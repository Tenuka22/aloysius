import { z } from "zod";
import { createDb } from "@aloysius-web/db";
import { publicProcedure } from "../index";

export const tagsRouter = {
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const search = input.search?.trim();

      const tables = ["news", "announcements", "events", "achievements", "gallery", "student_works"];
      const allTags = new Set<string>();

      for (const table of tables) {
        try {
          const rows = db.prepare(`
            SELECT DISTINCT value as tag
            FROM ${table}, json_each(CASE WHEN json_array_length(${table}.tags) > 0 THEN ${table}.tags ELSE '[]' END)
            WHERE value IS NOT NULL AND value != ''
            ${search ? `AND value LIKE ?` : ""}
          `).all(search ? `%${search}%` : undefined) as Array<{ tag: string }>;

          for (const row of rows) {
            allTags.add(row.tag);
          }
        } catch {
          // Skip tables that don't exist or have issues
        }
      }

      return Array.from(allTags).sort();
    }),
};
