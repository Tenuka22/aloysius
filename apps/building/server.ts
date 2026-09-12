import { join } from "node:path";

const dist = join(import.meta.dir, "dist");
const indexHtml = Bun.file(join(dist, "index.html"));
const port = Number(process.env.PORT ?? 4001);

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    const filePath = join(dist, decodeURIComponent(url.pathname));
    const file = Bun.file(filePath);
    if (url.pathname !== "/" && (await file.exists())) {
      return new Response(file);
    }
    return new Response(indexHtml);
  },
});

console.log(`Building page listening on http://localhost:${port}`);
