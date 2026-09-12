import stylex from "@stylexjs/unplugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 4001,
  },
  plugins: [
    stylex.vite({
      useCSSLayers: true,
    }),
    react(),
  ],
});
