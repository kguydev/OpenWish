import { useMemo, useState } from "react";

import { createFileRoute } from "@tanstack/react-router";
import { Copy, Plus, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { DashboardChrome, DashboardPageHeader } from "#/components/dashboard-shell";
import { Input } from "#/components/ui/input";
import { PasskeyPanel } from "#/components/passkey-panel";
import { McpAccessPanel } from "#/components/mcp-access-panel";
import {
  ApiRequestError,
  createAdminProject,
  deleteAdminProject,
} from "#/lib/api";
import { formatDate } from "#/lib/format";
import { forgetLastProjectSlug, readLastProjectSlug } from "#/lib/last-project";
import { assignLocation } from "#/lib/navigation";
import { useDashboardSession } from "#/lib/use-dashboard-session";

export const Route = createFileRoute("/dashboard/projects")({
  component: DashboardProjectsPage,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function DashboardProjectsPage() {
  const { error: sessionError, isLoading, projects, reloadProjects, sessionUsername } =
    useDashboardSession();
  const [projectName, setProjectName] = useState("OpenWish Project");
  const [projectSlug, setProjectSlug] = useState("openwish-project");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const activeProject = useMemo(() => {
    const lastSlug = readLastProjectSlug();
    return projects.find((project) => project.slug === lastSlug) ?? projects[0];
  }, [projects]);

  return (
    <DashboardChrome
      active="projects"
      projects={projects}
      sessionUsername={sessionUsername}
      projectName={activeProject?.name}
      projectSlug={activeProject?.slug}
    >
      <DashboardPageHeader
        title="Projects"
        actions={
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              const section = document.getElementById("create-project-card");
              section?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            <Plus className="size-4" />
            New project
          </Button>
        }
      />
      <section className="space-y-6">
        {sessionError || error ? (
          <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
            {error ?? sessionError}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <Card key={project.slug} className="border-border bg-card">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {project.appIconUrl ? (
                        <img
                          src={project.appIconUrl}
                          alt=""
                          className="size-10 shrink-0 rounded-lg border border-border"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-medium text-foreground">
                          {project.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground/80">
                          {formatDate(project.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 border-border bg-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                      onClick={async () => {
                        await navigator.clipboard.writeText(project.apiKey);
                      }}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80">
                      API key
                    </p>
                    <code className="mt-1.5 block overflow-x-auto rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] text-foreground/80">
                      {project.apiKey}
                    </code>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => assignLocation(`/dashboard/${project.slug}`)}
                    >
                      Open
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border bg-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-border bg-card text-foreground">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {project.name}?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            This removes the project and its stored feedback.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border bg-transparent text-foreground/80 hover:bg-foreground/5 hover:text-foreground">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={async () => {
                              setDeletingSlug(project.slug);
                              setError(null);
                              try {
                                await deleteAdminProject(project.slug);
                                forgetLastProjectSlug(project.slug);
                                await reloadProjects();
                              } catch (nextError) {
                                setError(
                                  nextError instanceof Error
                                    ? nextError.message
                                    : "Could not delete project.",
                                );
                              } finally {
                                setDeletingSlug(null);
                              }
                            }}
                          >
                            {deletingSlug === project.slug ? "Deleting…" : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}

            {isLoading && projects.length === 0 ? (
              <Card className="border-dashed border-border bg-transparent">
                <CardContent className="grid min-h-32 place-items-center p-4 text-xs text-muted-foreground/80">
                  Loading…
                </CardContent>
              </Card>
            ) : null}

            {!isLoading && projects.length === 0 ? (
              <Card className="border-dashed border-border bg-transparent">
                <CardContent className="grid min-h-32 place-items-center p-4 text-xs text-muted-foreground/80">
                  No projects yet.
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-4">
            <Card id="create-project-card" className="h-fit border-border bg-card">
            <CardContent className="space-y-4 p-4">
              <div>
                <h3 className="text-sm font-medium text-foreground">New project</h3>
                <p className="mt-1 text-xs text-muted-foreground/80">
                  Generates an API key for the Swift SDK.
                </p>
              </div>

              <form
                className="space-y-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setIsCreating(true);
                  setError(null);

                  try {
                    const response = await createAdminProject({
                      name: projectName,
                      slug: projectSlug,
                      watermarkEnabled: false,
                    });
                    await reloadProjects();
                    assignLocation(`/dashboard/${response.slug}`);
                  } catch (nextError) {
                    if (nextError instanceof ApiRequestError) {
                      setError(nextError.message);
                    } else {
                      setError("Could not create project.");
                    }
                  } finally {
                    setIsCreating(false);
                  }
                }}
              >
                <label className="grid gap-1.5">
                  <span className="text-xs text-muted-foreground">Project name</span>
                  <Input
                    className="h-9 border-border bg-muted text-foreground"
                    value={projectName}
                    onChange={(event) => {
                      const nextName = event.target.value;
                      setProjectName(nextName);
                      setProjectSlug((current) =>
                        current === slugify(projectName) ? slugify(nextName) : current,
                      );
                    }}
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs text-muted-foreground">Slug</span>
                  <Input
                    className="h-9 border-border bg-muted text-foreground"
                    value={projectSlug}
                    onChange={(event) => setProjectSlug(slugify(event.target.value))}
                  />
                </label>
                <Button
                  className="h-9 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isCreating}
                >
                  {isCreating ? "Creating…" : "Create project"}
                </Button>
              </form>
            </CardContent>
          </Card>

            <PasskeyPanel />
            <McpAccessPanel />
          </div>
        </div>
      </section>
    </DashboardChrome>
  );
}
