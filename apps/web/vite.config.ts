import { defineConfig } from 'vite'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

const config = defineConfig(({ command, mode }) => {
  const isTest = mode === 'test'
  // Deployments set WRANGLER_CONFIG (see deploy/README.md). Without it, use
  // wrangler.jsonc, and let `vite dev` fall back to the example config so a
  // fresh clone runs locally with no Cloudflare account.
  const wranglerConfig =
    process.env.WRANGLER_CONFIG ??
    (command === 'serve' && !existsSync(new URL('./wrangler.jsonc', import.meta.url))
      ? fileURLToPath(new URL('./wrangler.example.jsonc', import.meta.url))
      : undefined)

  return {
    test: { server: { deps: { inline: ['@cloudflare/workers-oauth-provider'] } } },
    resolve: {
      tsconfigPaths: true,
      alias: isTest
        ? {
            'cloudflare:email': fileURLToPath(
              new URL('./test/support/cloudflare-email-shim.ts', import.meta.url),
            ),
            'cloudflare:workers': fileURLToPath(
              new URL('./test/support/cloudflare-workers-shim.ts', import.meta.url),
            ),
          }
        : undefined,
    },
    plugins: [
      ...(isTest ? [] : [devtools(), cloudflare({ configPath: wranglerConfig, viteEnvironment: { name: 'ssr' } }), tanstackStart()]),
      tailwindcss(),
      viteReact(),
    ],
  }
})

export default config
