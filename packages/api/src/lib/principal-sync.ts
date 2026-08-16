import { and, asc, desc, eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { principals, staffMembers, obMembers } from "@aloysius-web/db/schema";

/**
 * Idempotently auto-sync the current published principal into:
 *  1. a `staff_members` row with role "Principal" (in the principal's creation year),
 *  2. the President slot for a given (or the current) committee year — but only when
 *     that slot has no one assigned yet.
 *
 * Staff members themselves are permanent and always re-pointed at the current
 * principal. The President slot is a one-time default: once a President exists
 * for a year — auto-filled or manually set by the OB admin — it is left alone, so
 * a manual assignment always wins. Called on read so no manual sync button is
 * ever needed.
 */
export async function ensurePrincipalAsStaffAndPresident(
  targetYear?: string,
): Promise<{
  principal: string | null;
  staff: boolean;
  president: boolean;
}> {
  const db = createDb();
  const principal = await db
    .select()
    .from(principals)
    .where(eq(principals.status, "published"))
    .orderBy(asc(principals.sortOrder), desc(principals.createdAt))
    .limit(1)
    .get();

  if (!principal) {
    return { principal: null, staff: false, president: false };
  }

  const now = new Date();
  const staffYear = principal.year || String(now.getFullYear());
  const presidentYear = targetYear || String(now.getFullYear());

  // 1. Principal staff member row (matched by name + role so an incoming principal
  //    gets their own row while the previous principal's row stays with their year).
  let staff = false;
  const staffRow = await db
    .select()
    .from(staffMembers)
    .where(and(eq(staffMembers.name, principal.name), eq(staffMembers.role, "Principal")))
    .get();
  if (staffRow) {
    await db
      .update(staffMembers)
      .set({
        photo: principal.portrait ?? null,
        bio: principal.message ?? null,
        year: staffYear,
        updatedAt: now,
      })
      .where(eq(staffMembers.id, staffRow.id))
      .run();
    staff = true;
  } else {
    await db
      .insert(staffMembers)
      .values({
        id: crypto.randomUUID(),
        name: principal.name,
        role: "Principal",
        email: null,
        photo: principal.portrait ?? null,
        bio: principal.message ?? null,
        year: staffYear,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    staff = true;
  }

  // 2. OB President slot for the target year — only auto-filled when nobody has
  //    defined a President for that year yet. A row that already exists (whether
  //    auto-filled earlier or set by the OB admin) is left untouched, so a manual
  //    assignment always wins over the principal.
  let president = false;
  const presidentRow = await db
    .select()
    .from(obMembers)
    .where(
      and(
        eq(obMembers.year, presidentYear),
        eq(obMembers.role, "President"),
        eq(obMembers.status, "approved"),
      ),
    )
    .get();
  if (!presidentRow) {
    await db
      .insert(obMembers)
      .values({
        id: crypto.randomUUID(),
        name: principal.name,
        role: "President",
        email: null,
        photo: principal.portrait ?? null,
        bio: principal.message ?? null,
        year: presidentYear,
        sortOrder: 3,
        status: "approved",
        createdAt: now,
        updatedAt: now,
      })
      .run();
    president = true;
  }

  return { principal: principal.name, staff, president };
}
