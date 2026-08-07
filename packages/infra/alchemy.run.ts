import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";
import { Worker } from "alchemy/cloudflare";
import { D1Database } from "alchemy/cloudflare";
import { R2Bucket } from "alchemy/cloudflare";
import { config } from "dotenv";

const load = (p: string) => {
  config({ path: p });
};

load("./.env");
load("../../apps/web/.env");
load("../../apps/server/.env");

if (process.env.NODE_ENV === "production") {
  load("../../apps/web/.env.production");
  load("../../apps/server/.env.production");
} else {
  load("../../apps/web/.env.local");
  load("../../apps/server/.env.local");
}

const DOMAIN = "template.com";
const stage = process.env.STAGE ?? "dev";

const app = await alchemy("aloysius-web", { stage });

const db = await D1Database("database", {
  migrationsDir: "../../packages/db/src/migrations",
});

const publicAssetsBucket = await R2Bucket("public-assets", {
  name: "public-assets",
  devDomain: true,
  domains: stage === "prod" ? [
    {
      domain: `assets.${DOMAIN}`,
      zone: "YOUR_ZONE_ID",
    },
  ] : undefined,
});

const r2PublicUrl = (() => {
  if (stage === "prod" && publicAssetsBucket.domains?.[0]) {
    return `https://${publicAssetsBucket.domains[0]}`;
  }
  if (publicAssetsBucket.devDomain) {
    return `https://${publicAssetsBucket.devDomain}/${publicAssetsBucket.name}`;
  }
  return undefined;
})();


export const server = await Worker("server", {
  cwd: "../../apps/server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  url: true,
  bindings: {
    DB: db,
    PUBLIC_ASSETS_BUCKET: publicAssetsBucket,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || r2PublicUrl || "",
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    CLERK_SECRET_KEY: alchemy.secret.env.CLERK_SECRET_KEY!,
    CLERK_PUBLISHABLE_KEY: alchemy.env.CLERK_PUBLISHABLE_KEY!,
    NODE_ENV: process.env.NODE_ENV ?? "development",
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
