import { asc } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { stats } from "@aloysius-web/db/schema";
import { publicProcedure } from "../index";

export const statsRouter = {
  list: publicProcedure.handler(async () => {
    const db = createDb();
    let rows = await db.select().from(stats).orderBy(asc(stats.sortOrder)).all();

    if (rows.length === 0) {
      const defaults = [
        { label: "150+ Years of Excellence", value: "150+", icon: "school", sortOrder: 0 },
        { label: "4500+ Students", value: "4500+", icon: "users", sortOrder: 1 },
        { label: "100+ Co-Curricular Activities", value: "100+", icon: "activity", sortOrder: 2 },
        { label: "20+ Global Partnerships", value: "20+", icon: "world", sortOrder: 3 },
      ];

      const inserted = await Promise.all(
        defaults.map((stat) =>
          db
            .insert(stats)
            .values({
              id: crypto.randomUUID(),
              label: stat.label,
              value: stat.value,
              icon: stat.icon,
              sortOrder: stat.sortOrder,
            })
            .returning()
            .get(),
        ),
      );

      rows = inserted;
    }

    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      value: row.value,
      icon: row.icon,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }),
};
