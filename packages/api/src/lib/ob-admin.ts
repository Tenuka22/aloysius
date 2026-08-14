import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { obMembers } from "@aloysius-web/db/schema";
import { getUserEmail } from "./club-access";

/**
 * A user is an OB admin when their Clerk email matches the `adminEmail` stored on
 * any approved OB member row. The admin is designated by email, so it does not
 * matter which row the site admin happened to store `adminEmail` on — the check
 * is purely user-email vs DB-email.
 */
export async function isOBAdmin(userId: string): Promise<boolean> {
  const userEmail = await getUserEmail(userId);
  if (!userEmail) return false;
  const db = createDb();
  const rows = await db.select().from(obMembers).where(eq(obMembers.status, "approved")).all();
  return rows.some((r) => !!r.adminEmail && r.adminEmail.toLowerCase() === userEmail);
}
