import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { siteSettings } from "@aloysius-web/db/schema";
import { adminProcedure } from "../../index";

/**
 * Super-user tier for site settings. Site admin only (see admin/index.ts) —
 * settings are global CMS content with no scoped-admin/self-service concept.
 */
export const adminSettingsRouter = {
  set: adminProcedure
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

  setMany: adminProcedure
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
