import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { stats } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";

export const statsRouter = {
  list: publicProcedure.handler(async () => {
    const db = createDb();
    const rows = await db
      .select()
      .from(stats)
      .orderBy(asc(stats.sortOrder))
      .all();

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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1).optional(),
        value: z.string().min(1).optional(),
        icon: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const existing = await db
        .select()
        .from(stats)
        .where(eq(stats.id, input.id))
        .get();

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Stat not found" });
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.label !== undefined) updateData.label = input.label;
      if (input.value !== undefined) updateData.value = input.value;
      if (input.icon !== undefined) updateData.icon = input.icon;
      if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

      const record = await db
        .update(stats)
        .set(updateData)
        .where(eq(stats.id, input.id))
        .returning()
        .get();

      return {
        id: record.id,
        label: record.label,
        value: record.value,
        icon: record.icon,
        sortOrder: record.sortOrder,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      };
    }),

  seed: protectedProcedure.handler(async ({ context }) => {
    if (!context.auth?.userId) {
      throw new ORPCError("UNAUTHORIZED");
    }

    const db = createDb();
    const existing = await db.select().from(stats).all();

    if (existing.length > 0) {
      return {
        message: "Stats already seeded",
        stats: existing.map((row) => ({
          id: row.id,
          label: row.label,
          value: row.value,
          icon: row.icon,
          sortOrder: row.sortOrder,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })),
      };
    }

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
          .get()
      )
    );

    return inserted.map((row) => ({
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
