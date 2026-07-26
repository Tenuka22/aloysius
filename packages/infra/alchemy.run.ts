import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";
import { Worker } from "alchemy/cloudflare";
import { D1Database } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });
config({ path: "../../apps/server/.env" });

const app = await alchemy("web-template");

const db = await D1Database("database", {
  migrationsDir: "../../packages/db/src/migrations",
});

export const server = await Worker("server", {
  cwd: "../../apps/server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  url: true,
  bindings: {
    DB: db,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    CLERK_SECRET_KEY: alchemy.secret.env.CLERK_SECRET_KEY!,
    CLERK_PUBLISHABLE_KEY: alchemy.env.CLERK_PUBLISHABLE_KEY!,
  },
  dev: {
    port: 3000,
  },
});

export const web = await TanStackStart("web", {
  cwd: "../../apps/web",
  bindings: {
    VITE_SERVER_URL: server.url!,
    DB: db,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    CLERK_SECRET_KEY: alchemy.secret.env.CLERK_SECRET_KEY!,
    CLERK_PUBLISHABLE_KEY: alchemy.env.CLERK_PUBLISHABLE_KEY!,
  },
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);

await app.finalize();
