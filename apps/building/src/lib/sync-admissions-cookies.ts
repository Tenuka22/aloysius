/**
 * aloysius-g1 (the separate admissions portal app) shares its saved-application
 * cookies across `aloysiuscollege.lk` and `admissions.aloysiuscollege.lk` by writing
 * them with `domain=aloysiuscollege.lk` on every page view (see that repo's
 * apps/web/src/lib/cookies.ts and lib/g1/saved-keys.ts). That only works while
 * something running on `aloysiuscollege.lk` actually performs the write - once this
 * placeholder replaces the admissions portal on that host, nothing else will ever run
 * there again to upgrade a visitor's still-host-only cookie from before the cutover.
 *
 * This is that same write, replicated here so the transfer keeps working after the
 * cutover: any of the three cookies aloysius-g1 uses, if already present (host-only or
 * otherwise), gets re-written with the shared domain attribute. Nothing is deleted -
 * an existing host-only cookie is simply left alongside the new shared-domain one and
 * expires on its own; aloysius-g1's read side already unions across duplicates.
 *
 * These are a separate repo/deployment from aloysius-g1, so there is nothing to
 * import from there directly - the cookie names below must stay in lockstep with
 * aloysius-g1's apps/web/src/lib/g1/saved-keys.ts.
 */
const SHARED_DOMAIN = "aloysiuscollege.lk";

const ADMISSIONS_COOKIE_NAMES = [
  "aloysius-admissions-application-keys",
  "aloysius-admissions-application-key",
  "aloysius-admissions-application-session-code",
];

function isSharedDomainHost(hostname: string): boolean {
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  return host === SHARED_DOMAIN || host.endsWith(`.${SHARED_DOMAIN}`);
}

// Value is read and written back still URI-encoded: this never needs to interpret the
// cookie's content (a JSON array for one of the three, a bare string for the other
// two), only copy it across domains byte-for-byte.
function readRawCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`)
  );
  return match ? match[1]! : null;
}

export function syncAdmissionsCookiesToSharedDomain(): void {
  if (
    typeof window === "undefined" ||
    !isSharedDomainHost(window.location.hostname)
  ) {
    return;
  }
  for (const name of ADMISSIONS_COOKIE_NAMES) {
    const value = readRawCookie(name);
    if (value === null) {
      continue;
    }
    document.cookie = `${encodeURIComponent(name)}=${value}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax; domain=${SHARED_DOMAIN}`;
  }
}
