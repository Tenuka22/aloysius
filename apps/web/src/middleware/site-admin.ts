export type SiteAdminSession = { user: { role?: string | null } } | null | undefined;

/**
 * Throws when `session` isn't an authenticated site admin. Kept dependency-free
 * (no auth/services imports) so the gate itself is unit-testable without a
 * request context or a live database; `requireSiteAdminMiddleware` in
 * `./admin` is a thin request-time wrapper around it.
 */
export function assertSiteAdmin(session: SiteAdminSession): void {
  const user = session?.user;
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
}
