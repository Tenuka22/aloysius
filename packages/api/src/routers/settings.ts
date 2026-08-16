import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { siteSettings } from "@aloysius-web/db/schema";
import { publicProcedure } from "../index";

export const settingsRouter = {
  get: publicProcedure.input(z.object({ key: z.string() })).handler(async ({ input }) => {
    const db = createDb();
    const row = await db.select().from(siteSettings).where(eq(siteSettings.key, input.key)).get();
    return { key: input.key, value: row?.value ?? "" };
  }),

  getMany: publicProcedure
    .input(z.object({ keys: z.array(z.string()) }))
    .handler(async ({ input }) => {
      const db = createDb();
      const rows = await db.select().from(siteSettings).all();
      const map = new Map(rows.map((r) => [r.key, r.value]));
      return input.keys.map((key) => ({ key, value: map.get(key) ?? "" }));
    }),

  getAll: publicProcedure.handler(async () => {
    const db = createDb();
    const rows = await db.select().from(siteSettings).all();
    return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
  }),
};
