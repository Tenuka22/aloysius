import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { siteSettings } from "@aloysius-web/db/schema";
import { HOMEPAGE_DEFAULTS } from "@aloysius-web/db/homepage-settings";
import { publicProcedure } from "../index";

export const settingsRouter = {
  get: publicProcedure.input(z.object({ key: z.string() })).handler(async ({ input }) => {
    const db = createDb();
    const row = await db.select().from(siteSettings).where(eq(siteSettings.key, input.key)).get();
    const defaultValue = HOMEPAGE_DEFAULTS[input.key as keyof typeof HOMEPAGE_DEFAULTS] ?? "";
    return { key: input.key, value: row?.value ?? defaultValue };
  }),

  getMany: publicProcedure
    .input(z.object({ keys: z.array(z.string()) }))
    .handler(async ({ input }) => {
      const db = createDb();
      const rows = await db.select().from(siteSettings).all();
      const map = new Map(rows.map((r) => [r.key, r.value]));
      return input.keys.map((key) => {
        const defaultValue = HOMEPAGE_DEFAULTS[key as keyof typeof HOMEPAGE_DEFAULTS] ?? "";
        return { key, value: map.get(key) ?? defaultValue };
      });
    }),

  getAll: publicProcedure.handler(async () => {
    const db = createDb();
    const rows = await db.select().from(siteSettings).all();
    const dbSettings = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
    return { ...HOMEPAGE_DEFAULTS, ...dbSettings };
  }),
};
