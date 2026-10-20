import { useEffect, useState } from "react";

import { startAuthentication } from "@simplewebauthn/browser";
import { createFileRoute } from "@tanstack/react-router";
import { Fingerprint } from "lucide-react";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import {
  fetchPasskeyAvailability,
  fetchPasskeyLoginOptions,
  loginDashboard,
  verifyPasskeyLogin,
} from "#/lib/api";
import { lastProjectHomePath } from "#/lib/last-project";
import { assignLocation, safeLoginReturnPath } from "#/lib/navigation";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

export function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPasskeyAvailability()
      .then((response) => {
        if (!cancelled) {
          setHasPasskey(response.hasPasskey);
        }
      })
      .catch(() => {
        // Ignore — fall back to password auth.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function postLoginRedirect() {
    const search = new URLSearchParams(window.location.search);
    const next = search.get("next");
    // Without an explicit return path, reopen the project used last.
    assignLocation(next ? safeLoginReturnPath(next) : lastProjectHomePath());
  }

  async function handlePasskeyLogin() {
    setIsPasskeyLoading(true);
    setError(null);
    try {
      const options = await fetchPasskeyLoginOptions();
      const assertion = await startAuthentication({ optionsJSON: options });
      await verifyPasskeyLogin(assertion);
      postLoginRedirect();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message === "The operation either timed out or was not allowed."
            ? "Passkey sign-in was cancelled."
            : nextError.message
          : "Could not sign in with passkey.",
      );
    } finally {
      setIsPasskeyLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-10 text-foreground">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <img src="/openwish-icon-dark-192.png" alt="" className="size-7 rounded-md" />
            <span className="text-sm font-medium tracking-tight text-foreground">OpenWish</span>
          </div>
          <CardTitle className="pt-4 text-xl font-medium tracking-tight text-foreground">
            Sign in
          </CardTitle>
          <p className="text-sm text-muted-foreground/80">
            {hasPasskey
              ? "Use the passkey registered for this dashboard."
              : "Single-user dashboard auth."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasPasskey ? (
            <>
              <Button
                type="button"
                className="h-9 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isPasskeyLoading}
                onClick={handlePasskeyLogin}
              >
                <Fingerprint className="size-4" />
                {isPasskeyLoading ? "Waiting for passkey…" : "Sign in with passkey"}
              </Button>
              {error ? (
                <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                  {error}
                </div>
              ) : null}
              <p className="text-[11px] leading-relaxed text-muted-foreground/80">
                Lost every device? Recover by deleting the rows in{" "}
                <code className="rounded bg-foreground/5 px-1 py-0.5 text-[10px] text-foreground/80">
                  auth_passkeys
                </code>{" "}
                via{" "}
                <code className="rounded bg-foreground/5 px-1 py-0.5 text-[10px] text-foreground/80">
                  wrangler d1 execute
                </code>{" "}
                — the password fallback re-activates automatically.
              </p>
            </>
          ) : (
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setIsLoading(true);
                setError(null);

                try {
                  await loginDashboard(username, password);
                  postLoginRedirect();
                } catch (nextError) {
                  setError(
                    nextError instanceof Error ? nextError.message : "Could not sign in.",
                  );
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              <label className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">Username</span>
                <Input
                  className="h-9 border-border bg-muted text-foreground"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">Password</span>
                <Input
                  className="h-9 border-border bg-muted text-foreground"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              {error ? (
                <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                  {error}
                </div>
              ) : null}
              <Button
                className="h-9 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
