import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@aloysius-web/api/context";
import { appRouter } from "@aloysius-web/api/routers/index";
import { seed } from "@aloysius-web/db/seed";
import { env } from "@aloysius-web/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context: context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

app.get("/image/*", async (c) => {
  const key = c.req.path.replace("/image/", "");
  if (!key) return c.json({ message: "Key required" }, 400);

  const bucket = env.PUBLIC_ASSETS_BUCKET;
  if (!bucket) return c.json({ message: "Bucket not bound" }, 500);
  const obj = await bucket.get(key);
  if (!obj) return c.json({ message: "Not found" }, 404);
  const headers: Record<string, string> = {
    "Content-Type": obj.httpMetadata?.contentType ?? "image/jpeg",
    "Cache-Control": "public, max-age=31536000",
  };
  if (obj.size) headers["Content-Length"] = String(obj.size);
  return c.newResponse(obj.body, { headers });
});

app.get("/files/*", async (c) => {
  const key = c.req.path.replace("/files/", "");
  if (!key) return c.json({ message: "Key required" }, 400);

  const bucket = env.PUBLIC_ASSETS_BUCKET;
  if (!bucket) return c.json({ message: "Bucket not bound" }, 500);

  const obj = await bucket.get(key);
  if (!obj) return c.json({ message: "Not found" }, 404);

  const headers: Record<string, string> = {
    "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
    "Cache-Control": "private, max-age=3600",
  };
  if (obj.size) headers["Content-Length"] = String(obj.size);
  return c.newResponse(obj.body, { headers });
});

app.get("/", (c) => {
  return c.text("OK");
});

app.get("/seed", async (c) => {
  try {
    await seed();
    return c.json({ message: "Database seeded successfully" });
  } catch (error) {
    console.error("Seed error:", error);
    return c.json({ message: "Failed to seed database" }, 500);
  }
});

export default app;
