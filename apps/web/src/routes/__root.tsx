import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";

import { THEME_INIT_SCRIPT } from "#/lib/theme";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "OpenWish",
      },
      {
        name: "theme-color",
        media: "(prefers-color-scheme: light)",
        content: "#f7f7f7",
      },
      {
        name: "theme-color",
        media: "(prefers-color-scheme: dark)",
        content: "#0a0f14",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/openwish-icon.svg",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased text-foreground">
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
