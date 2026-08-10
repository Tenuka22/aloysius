import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { siteSettings } from "@aloysius-web/db/schema";
import { protectedProcedure, publicProcedure } from "../index";

export const settingsRouter = {
  get: publicProcedure
    .input(z.object({ key: z.string() }))
    .handler(async ({ input }) => {
      const db = createDb();
      const row = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, input.key))
        .get();
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

  set: protectedProcedure
    .input(z.object({ key: z.string(), value: z.string() }))
    .handler(async ({ input }) => {
      const db = createDb();
      const now = new Date();
      const existing = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, input.key))
        .get();

      if (existing) {
        await db
          .update(siteSettings)
          .set({ value: input.value, updatedAt: now })
          .where(eq(siteSettings.key, input.key))
          .run();
      } else {
        await db
          .insert(siteSettings)
          .values({ key: input.key, value: input.value, updatedAt: now })
          .run();
      }

      return { key: input.key, value: input.value };
    }),

  setMany: protectedProcedure
    .input(z.object({ items: z.array(z.object({ key: z.string(), value: z.string() })) }))
    .handler(async ({ input }) => {
      const db = createDb();
      const now = new Date();

      for (const item of input.items) {
        const existing = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, item.key))
          .get();

        if (existing) {
          await db
            .update(siteSettings)
            .set({ value: item.value, updatedAt: now })
            .where(eq(siteSettings.key, item.key))
            .run();
        } else {
          await db
            .insert(siteSettings)
            .values({ key: item.key, value: item.value, updatedAt: now })
            .run();
        }
      }

      return { success: true };
    }),
};
