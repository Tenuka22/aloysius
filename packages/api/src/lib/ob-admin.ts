import { eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { siteSettings } from "@aloysius-web/db/schema";
import { getUserEmail } from "./club-access";

/** The `siteSettings` key holding the single, site-wide OB admin email. */
export const OB_ADMIN_EMAIL_KEY = "ob_admin_email";

/**
 * A user is the OB admin when their email from the Better Auth user table
 * matches the single, site-wide OB admin email in `siteSettings`. There is
 * exactly one OB admin at a time — set by the site admin directly, with no
 * per-year scoping and no lookup against any OB member row.
 */
export async function isOBAdmin(userId: string): Promise<boolean> {
  const userEmail = await getUserEmail(userId);
  if (!userEmail) return false;
  const db = createDb();
  const row = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, OB_ADMIN_EMAIL_KEY))
    .get();
  const adminEmail = row?.value?.trim().toLowerCase();
  return !!adminEmail && adminEmail === userEmail;
}
