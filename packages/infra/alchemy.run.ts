import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";
import { Worker } from "alchemy/cloudflare";
import { D1Database } from "alchemy/cloudflare";
import { R2Bucket } from "alchemy/cloudflare";
import { Assets } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });

if (process.env.NODE_ENV === "production") {
  config({ path: "../../apps/server/.env.production" });
  config({ path: "../../apps/web/.env.production" });
} else {
  config({ path: "../../apps/server/.env" });
  config({ path: "../../apps/web/.env" });
}

const DOMAIN = "template.com";
const stage = process.env.STAGE ?? "dev";

const app = await alchemy("web-template", { stage });

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

const serverPublicAssets = await Assets({ path: "../../apps/server/public" });

export const server = await Worker("server", {
  cwd: "../../apps/server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  url: true,
  bindings: {
    DB: db,
    ASSETS: serverPublicAssets,
    PUBLIC_ASSETS_BUCKET: publicAssetsBucket,
    R2_PUBLIC_URL: r2PublicUrl ?? alchemy.env("R2_PUBLIC_URL", ""),
    CORS_ORIGIN: alchemy.env("CORS_ORIGIN", "http://localhost:3001"),
    CLERK_SECRET_KEY: alchemy.secret.env("CLERK_SECRET_KEY", ""),
    CLERK_PUBLISHABLE_KEY: alchemy.env("CLERK_PUBLISHABLE_KEY", ""),
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
    CORS_ORIGIN: alchemy.env("CORS_ORIGIN", "http://localhost:3001"),
    CLERK_SECRET_KEY: alchemy.secret.env("CLERK_SECRET_KEY", ""),
    CLERK_PUBLISHABLE_KEY: alchemy.env("CLERK_PUBLISHABLE_KEY", ""),
  },
  dev: {
    env: {
      PORT: "3001",
      NODE_ENV: "development",
    },
  },
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);

await app.finalize();
