import stylex from "@stylexjs/unplugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    /*
     * The site's dev server owns 4001 and its container owns 4000, so the
     * placeholder takes 4003 to stay out of both. The root `dev` script runs every
     * app at once, which is how the two apps used to share one port and one of
     * them always failed to bind.
     */
    port: 4003,
  },
  plugins: [
    stylex.vite({
      useCSSLayers: true,
    }),
    react(),
  ],
});
