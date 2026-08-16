import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { staffMembers } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { adminProcedure } from "../../index";

function serializeStaffMember(row: typeof staffMembers.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    email: row.email,
    photo: row.photo,
    bio: row.bio,
    year: row.year,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const adminStaffRouter = {
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        role: z.string().min(1),
        email: z.string().email().optional().nullable(),
        photo: z.string().optional().nullable(),
        bio: z.string().optional().nullable(),
        year: z.string().default(""),
        sortOrder: z.number().default(0),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const now = new Date();
      const record = await db
        .insert(staffMembers)
        .values({
          id: crypto.randomUUID(),
          name: input.name,
          role: input.role,
          email: input.email ?? null,
          photo: input.photo ?? null,
          bio: input.bio ?? null,
          year: input.year,
          sortOrder: input.sortOrder,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();
      return serializeStaffMember(record);
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        role: z.string().min(1).optional(),
        email: z.string().email().optional().nullable(),
        photo: z.string().optional().nullable(),
        bio: z.string().optional().nullable(),
        year: z.string().optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const existing = await db
        .select()
        .from(staffMembers)
        .where(eq(staffMembers.id, input.id))
        .get();
      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Staff member not found" });
      }
      const { id, ...updateData } = input;
      const setData: Record<string, unknown> = { updatedAt: new Date() };
      if (updateData.name !== undefined) setData.name = updateData.name;
      if (updateData.role !== undefined) setData.role = updateData.role;
      if (updateData.email !== undefined) setData.email = updateData.email;
      if (updateData.photo !== undefined) setData.photo = updateData.photo;
      if (updateData.bio !== undefined) setData.bio = updateData.bio;
      if (updateData.year !== undefined) setData.year = updateData.year;
      if (updateData.sortOrder !== undefined) setData.sortOrder = updateData.sortOrder;
      const record = await db
        .update(staffMembers)
        .set(setData)
        .where(eq(staffMembers.id, id))
        .returning()
        .get();
      return serializeStaffMember(record);
    }),

  delete: adminProcedure.input(z.object({ id: z.string() })).handler(async ({ input }) => {
    const db = createDb();
    const existing = await db
      .select()
      .from(staffMembers)
      .where(eq(staffMembers.id, input.id))
      .get();
    if (!existing) throw new ORPCError("NOT_FOUND", { message: "Staff member not found" });
    await db.delete(staffMembers).where(eq(staffMembers.id, input.id)).run();
    return { success: true };
  }),

  /**
   * Save the full staff roster for a year at once. Each entry is a staff slot;
   * existing rows are updated (matched by id), new names are created, and rows
   * of that year not in the submitted entries are removed (dropped from the form).
   */
  saveYear: adminProcedure
    .input(
      z.object({
        year: z.string().min(1),
        entries: z.array(
          z.object({
            id: z.string().optional(),
            name: z.string().min(1),
            role: z.string().min(1),
            email: z.string().email().optional().nullable(),
            photo: z.string().optional().nullable(),
            bio: z.string().optional().nullable(),
            sortOrder: z.number(),
          }),
        ),
      }),
    )
    .handler(async ({ input }) => {
      const db = createDb();
      const now = new Date();
      const submittedIds = input.entries.map((e) => e.id).filter((id): id is string => !!id);

      for (const entry of input.entries) {
        if (entry.id) {
          const existing = await db
            .select()
            .from(staffMembers)
            .where(eq(staffMembers.id, entry.id))
            .get();
          if (!existing) {
            throw new ORPCError("NOT_FOUND", { message: "Staff member not found" });
          }
          await db
            .update(staffMembers)
            .set({
              name: entry.name,
              role: entry.role,
              email: entry.email ?? null,
              photo: entry.photo ?? null,
              bio: entry.bio ?? null,
              year: input.year,
              sortOrder: entry.sortOrder,
              updatedAt: now,
            })
            .where(eq(staffMembers.id, entry.id))
            .run();
        } else {
          await db
            .insert(staffMembers)
            .values({
              id: crypto.randomUUID(),
              name: entry.name,
              role: entry.role,
              email: entry.email ?? null,
              photo: entry.photo ?? null,
              bio: entry.bio ?? null,
              year: input.year,
              sortOrder: entry.sortOrder,
              createdAt: now,
              updatedAt: now,
            })
            .run();
        }
      }

      // Remove year rows that were dropped from the form.
      const yearMembers = await db
        .select()
        .from(staffMembers)
        .where(eq(staffMembers.year, input.year))
        .all();
      let removed = 0;
      for (const member of yearMembers) {
        if (submittedIds.includes(member.id)) continue;
        await db.delete(staffMembers).where(eq(staffMembers.id, member.id)).run();
        removed++;
      }

      return { saved: input.entries.length, removed };
    }),
};
