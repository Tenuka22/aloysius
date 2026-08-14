import { and, asc, desc, eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { principals, staffMembers, obMembers } from "@aloysius-web/db/schema";

/**
 * Idempotently auto-sync the current published principal into:
 *  1. a `staff_members` row with role "Principal" (in the principal's creation year),
 *  2. the current year's `ob_members` President slot.
 *
 * Staff members themselves are permanent — but the principal has a tenure, so when
 * a new principal is published, the President row (and the Principal staff row)
 * are re-pointed at the new principal. Called on read so no manual sync button is
 * ever needed.
 */
export async function ensurePrincipalAsStaffAndPresident(): Promise<{
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
  const presidentYear = String(now.getFullYear());

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

  // 2. Current year's OB President slot — re-pointed at the new principal if it changed.
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
  if (presidentRow) {
    await db
      .update(obMembers)
      .set({
        name: principal.name,
        photo: principal.portrait ?? null,
        bio: principal.message ?? null,
        updatedAt: now,
      })
      .where(eq(obMembers.id, presidentRow.id))
      .run();
    president = true;
  } else {
    await db
      .insert(obMembers)
      .values({
        id: crypto.randomUUID(),
        name: principal.name,
        role: "President",
        email: null,
        adminEmail: null,
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
