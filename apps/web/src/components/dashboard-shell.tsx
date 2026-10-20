import { useEffect, useState, type ReactNode } from "react";

import type { ProjectSummary } from "@openwish/shared";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bug,
  FolderKanban,
  LayoutPanelTop,
  Monitor,
  Moon,
  Settings,
  Sun,
} from "lucide-react";

import { Button } from "#/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { logoutDashboard } from "#/lib/api";
import { assignLocation } from "#/lib/navigation";
import { readThemePreference, setThemePreference, type ThemePreference } from "#/lib/theme";
import { cn } from "#/lib/utils";

export type DashboardTab = "board" | "bugs" | "analytics" | "settings" | "projects";

type DashboardChromeProps = {
  active: DashboardTab;
  children: ReactNode;
  sessionUsername: string;
  projectName?: string;
  projectSlug?: string;
  projects: ProjectSummary[];
};

function navClass(isActive: boolean) {
  return cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-foreground/10 text-foreground"
      : "text-muted-foreground/80 hover:bg-foreground/5 hover:text-foreground",
  );
}

const themeOptions = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;

function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  // Read after mount so the server render and hydration agree.
  useEffect(() => setPreference(readThemePreference()), []);

  return (
    <div role="group" aria-label="Theme" className="mt-3 flex rounded-md border border-border p-0.5">
      {themeOptions.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={preference === value}
          title={label}
          onClick={() => {
            setThemePreference(value);
            setPreference(value);
          }}
          className={cn(
            "flex min-w-0 flex-1 items-center justify-center gap-1 rounded px-1 py-1 text-xs transition-colors",
            preference === value
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

function dashboardHref(projectSlug?: string) {
  return projectSlug ? `/dashboard/${projectSlug}` : "/dashboard/projects";
}

function analyticsHref(projectSlug?: string) {
  return projectSlug ? `/dashboard/${projectSlug}/analytics` : "/dashboard/projects";
}

function bugsHref(projectSlug?: string) {
  return projectSlug ? `/dashboard/${projectSlug}/bugs` : "/dashboard/projects";
}

function settingsHref(projectSlug?: string) {
  return projectSlug ? `/dashboard/${projectSlug}/settings` : "/dashboard/projects";
}

function hrefForActive(active: DashboardTab, slug: string) {
  switch (active) {
    case "board":
      return `/dashboard/${slug}`;
    case "bugs":
      return `/dashboard/${slug}/bugs`;
    case "analytics":
      return `/dashboard/${slug}/analytics`;
    case "settings":
      return `/dashboard/${slug}/settings`;
    case "projects":
      return `/dashboard/${slug}`;
  }
}

// Per-page header (title + optional actions). Lives inside the chrome's content
// area so it scrolls with the page; each route renders its own so the chrome
// (sidebar) can stay mounted across tab navigations.
export function DashboardPageHeader({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-lg font-medium tracking-tight text-foreground">{title}</h1>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

// Persistent dashboard frame: logo, project switcher, nav, session/logout, and a
// content area. Rendered once by the /dashboard/$slug layout (with an <Outlet/>
// as children) so switching tabs never unmounts the sidebar — the project
// switcher no longer flickers out on navigation.
export function DashboardChrome({
  active,
  children,
  sessionUsername,
  projectName,
  projectSlug,
  projects,
}: DashboardChromeProps) {
  const selectValue =
    projectSlug && projects.some((project) => project.slug === projectSlug)
      ? projectSlug
      : undefined;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="flex flex-col border-b border-border px-5 py-6 lg:border-b-0 lg:border-r">
          <Link to="/dashboard/projects" className="flex items-center gap-2">
            <img
              src="/openwish-icon-dark-192.png"
              alt=""
              className="size-7 rounded-md"
            />
            <span className="text-sm font-medium tracking-tight text-foreground">OpenWish</span>
          </Link>

          {projects.length > 0 ? (
            <div className="mt-6 space-y-1.5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80">
                Project
              </p>
              <Select
                value={selectValue}
                onValueChange={(next) => assignLocation(hrefForActive(active, next))}
              >
                <SelectTrigger
                  size="sm"
                  className="h-9 w-full border-border bg-card text-sm text-foreground"
                >
                  <SelectValue placeholder={projectName ?? "Select project"} />
                </SelectTrigger>
                <SelectContent className="border-border bg-card text-foreground">
                  {projects.map((project) => (
                    <SelectItem key={project.slug} value={project.slug}>
                      <span className="flex items-center gap-2">
                        {project.appIconUrl ? (
                          <img
                            src={project.appIconUrl}
                            alt=""
                            className="size-4 rounded-sm border border-border"
                          />
                        ) : null}
                        {project.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <nav className="mt-6 space-y-1">
            <Link className={navClass(active === "board")} to={dashboardHref(projectSlug)}>
              <LayoutPanelTop className="size-4" />
              Board
            </Link>
            <Link className={navClass(active === "bugs")} to={bugsHref(projectSlug)}>
              <Bug className="size-4" />
              Bugs
            </Link>
            <Link className={navClass(active === "analytics")} to={analyticsHref(projectSlug)}>
              <BarChart3 className="size-4" />
              Analytics
            </Link>
            <Link className={navClass(active === "settings")} to={settingsHref(projectSlug)}>
              <Settings className="size-4" />
              Settings
            </Link>
            <Link className={navClass(active === "projects")} to="/dashboard/projects">
              <FolderKanban className="size-4" />
              Projects
            </Link>
          </nav>

          <div className="mt-8 border-t border-border pt-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80">Session</p>
            <p className="mt-2 truncate text-sm text-foreground">{sessionUsername || "admin"}</p>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full border-border bg-transparent text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
              onClick={async () => {
                try {
                  await logoutDashboard();
                } finally {
                  assignLocation("/login");
                }
              }}
            >
              Logout
            </Button>
          </div>
        </aside>

        <section className="min-w-0 px-5 py-6 sm:px-8">{children}</section>
      </div>
    </main>
  );
}
