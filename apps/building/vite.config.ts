import stylexVite from "@stylexjs/unplugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    /*
     * The site's dev server owns 4001 and its container owns 4000, so the
     * placeholder takes 4003 to stay out of both. MinIO's published ports
     * (4001 API, 4002 console) now reuse the same numbers as the site's dev
     * server and this placeholder's own container respectively - MinIO is
     * never meant to run alongside either of those at once, so this is left
     * as-is rather than renumbering everything again. The root `dev` script
     * runs every app at once, which is how the two apps used to share one
     * port and one of them always failed to bind.
     */
    port: 4003,
  },
  plugins: [
    stylexVite({
      useCSSLayers: true,
    }),
    react(),
  ],
});
