import stylexVite from "@stylexjs/unplugin/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    /*
     * The dev server binds 4001. The container binds 4000, so the two can be run
     * side by side - a bare `docker run` and a local dev server never collide.
     * `BETTER_AUTH_URL` must match whatever is actually bound, because Better
     * Auth derives `trustedOrigins` from it.
     */
    port: 4001,
  },
  resolve: {
    tsconfigPaths: true,
    /*
     * `tsconfigPaths` resolves `@aloysius/ui/*` to a bare path under
     * `packages/ui/src`, which bypasses that package's `exports` map and hands
     * the extension choice to this list. Vite's default order puts `.js` first,
     * so any emitted `.js` sitting next to a `.tsx` source silently wins and
     * the app renders a stale build of the design system. Sources are listed
     * first so an emitted artifact can never shadow the file it was emitted
     * from.
     */
    extensions: [".ts", ".tsx", ".mts", ".mjs", ".js", ".jsx", ".json"],
  },
  plugins: [
    varlockVitePlugin({ ssrInjectMode: "auto-load" }),
    stylexVite({
      useCSSLayers: true,
    }),
    tanstackStart(),
    nitro({ preset: "node-server" }),
    viteReact(),
  ],
});
