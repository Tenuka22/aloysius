export interface HardcodedClub {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly status: "active" | "archived";
  readonly adminUsername: string;
}

/** The supported clubs and their single administrator identities. */
export const HARDCODED_CLUBS = [
  {
    id: "club-photography",
    slug: "photography",
    name: "Photography Club",
    status: "active",
    adminUsername: "photography-admin",
  },
] as const satisfies readonly HardcodedClub[];

export const findHardcodedClub = (clubId: string) =>
  HARDCODED_CLUBS.find((club) => club.id === clubId);

/**
 * The club a signed-in administrator belongs to, resolved from their username.
 *
 * The username is the join key: each club has exactly one administrator, named
 * `<club-slug>-admin`, so `HARDCODED_CLUBS` can be scanned for the match. This
 * is the only way a club-admin screen learns which club it is editing, which is
 * why every submission path needs it - a client-supplied `clubId` would let an
 * administrator of one club write into another.
 *
 * Returns `null` for anyone who is not a configured club administrator,
 * including a signed-in `admin` or `cms` user, so callers can treat "not a club
 * admin" as an ordinary empty result rather than an error.
 */
export const findClubByAdminUsername = (
  username: string | null | undefined
) => {
  if (!username) {
    return;
  }
  const normalized = username.trim().toLowerCase();
  return HARDCODED_CLUBS.find((club) => club.adminUsername === normalized);
};
