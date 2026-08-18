/** The auth role that grants full OB dashboard access. */
export const OB_ADMIN_ROLE = "ob:admin";

/**
 * A user is the OB admin when their Better Auth role is `ob:admin`. There is
 * exactly one OB admin at a time — provisioned from `obadmin@aloysiuscollege.lk`
 * by the auth package, with no per-year scoping and no lookup against any OB
 * member row.
 */
export function isOBAdmin(role: string | null | undefined): boolean {
  return role === OB_ADMIN_ROLE;
}