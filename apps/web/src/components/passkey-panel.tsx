import { useEffect, useState } from "react";

import {
  browserSupportsWebAuthn,
  startRegistration,
} from "@simplewebauthn/browser";
import type { PasskeySummary } from "@openwish/shared";
import { Fingerprint, KeyRound, Trash2 } from "lucide-react";

import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import {
  ApiRequestError,
  deletePasskey,
  fetchPasskeyList,
  fetchPasskeyRegisterOptions,
  verifyPasskeyRegistration,
} from "#/lib/api";
import { formatDate } from "#/lib/format";

export function PasskeyPanel() {
  const [list, setList] = useState<PasskeySummary[] | null>(null);
  const [supported, setSupported] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
    void reload();
  }, []);

  async function reload() {
    try {
      const response = await fetchPasskeyList();
      setList(response.list);
    } catch (nextError) {
      setError(
        nextError instanceof ApiRequestError
          ? nextError.message
          : "Could not load passkeys.",
      );
    }
  }

  async function handleRegister() {
    setIsRegistering(true);
    setError(null);
    setInfo(null);
    try {
      const options = await fetchPasskeyRegisterOptions();
      const attestation = await startRegistration({ optionsJSON: options });
      await verifyPasskeyRegistration(attestation, label.trim() === "" ? null : label.trim());
      setLabel("");
      setInfo("Passkey added.");
      await reload();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message === "The operation either timed out or was not allowed."
            ? "Registration was cancelled."
            : nextError.message
          : "Could not register passkey.",
      );
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleRevoke(credentialId: string) {
    setRevokingId(credentialId);
    setError(null);
    setInfo(null);
    try {
      await deletePasskey(credentialId);
      setInfo("Passkey removed.");
      await reload();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Could not remove passkey.",
      );
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Passkeys</h3>
        </div>
        <p className="text-xs text-muted-foreground/80">
          Sign in to the dashboard from this device with Touch ID, Face ID, Windows Hello,
          or any roaming security key. Passwords still work as a fallback.
        </p>

        {!supported ? (
          <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-700 dark:text-yellow-200">
            This browser doesn't support WebAuthn.
          </div>
        ) : null}

        {list && list.length > 0 ? (
          <div className="space-y-2">
            {list.map((passkey) => (
              <div
                key={passkey.credentialId}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    {passkey.label ?? "Unnamed passkey"}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground/80">
                    Added {formatDate(passkey.createdAt)}
                    {passkey.lastUsedAt
                      ? ` · last used ${formatDate(passkey.lastUsedAt)}`
                      : null}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-border bg-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  disabled={revokingId === passkey.credentialId}
                  onClick={() => handleRevoke(passkey.credentialId)}
                >
                  <Trash2 className="size-3.5" />
                  {revokingId === passkey.credentialId ? "Removing…" : "Remove"}
                </Button>
              </div>
            ))}
          </div>
        ) : list && list.length === 0 ? (
          <p className="text-xs text-muted-foreground/80">
            No passkeys registered yet.
          </p>
        ) : null}

        <div className="space-y-2 border-t border-border pt-4">
          <Input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Optional label (e.g. MacBook Touch ID)"
            className="h-9 border-border bg-muted text-sm text-foreground"
            maxLength={80}
            disabled={!supported || isRegistering}
          />
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!supported || isRegistering}
            onClick={handleRegister}
          >
            <Fingerprint className="size-4" />
            {isRegistering ? "Waiting for device…" : "Add passkey on this device"}
          </Button>
          {error ? <p className="text-xs text-red-700 dark:text-red-300">{error}</p> : null}
          {info ? <p className="text-xs text-emerald-700 dark:text-emerald-300">{info}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
