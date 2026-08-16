import { z } from "zod";
import { eq, desc, and, count } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { staffMembers } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { publicProcedure } from "../index";
import { ensurePrincipalAsStaffAndPresident } from "../lib/principal-sync";

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

export const staffRouter = {
  /** List staff members, optionally filtered by year. */
  list: publicProcedure
    .input(
      z.object({
        year: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      // Auto-sync the principal as a staff member + current year's OB President.
      await ensurePrincipalAsStaffAndPresident();
      const db = createDb();
      const conditions = [];
      if (input.year) {
        conditions.push(eq(staffMembers.year, input.year));
      }
      if (input.search) {
        conditions.push(eq(staffMembers.name, input.search));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db
        .select()
        .from(staffMembers)
        .where(where)
        .orderBy(desc(staffMembers.sortOrder))
        .all();
      return rows.map(serializeStaffMember);
    }),

  /** Distinct years that have staff (or a principal) with member counts. */
  years: publicProcedure.handler(async () => {
    await ensurePrincipalAsStaffAndPresident();
    const db = createDb();
    const rows = await db
      .select({ year: staffMembers.year, total: count() })
      .from(staffMembers)
      .groupBy(staffMembers.year)
      .all();
    return rows
      .filter((r) => !!r.year)
      .map((r) => ({ year: r.year as string, total: r.total }))
      .sort((a, b) => (a.year > b.year ? -1 : 1));
  }),

  get: publicProcedure.input(z.object({ id: z.string() })).handler(async ({ input }) => {
    const db = createDb();
    const row = await db.select().from(staffMembers).where(eq(staffMembers.id, input.id)).get();
    if (!row) {
      throw new ORPCError("NOT_FOUND", { message: "Staff member not found" });
    }
    return serializeStaffMember(row);
  }),
};
