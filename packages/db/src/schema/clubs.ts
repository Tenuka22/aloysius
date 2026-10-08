import * as v from "valibot";

/**
 * The clubs this register currently serves. One hardcoded slug rather than a
 * membership table: `photography-admin` is a single seeded seat
 * (`packages/auth/src/roles.ts`), and a club here means "one administrator
 * identity with a `club:submit` grant", not a roster of members. Adding a
 * second club is adding a second slug plus a second seeded seat, not a
 * schema change.
 *
 * Lives in its own module (rather than `club-photos.ts`, which used to own
 * it) so `announcement`/`event`/`news_post`/`club_photo` can all depend on it
 * without any of them having to import each other - `club_photo` needs
 * `event`/`news_post`/`achievement` for its optional "related content" link,
 * and a shared `CLUBS` constant living on one of those tables would make that
 * a cycle.
 */
export const CLUBS = ["photography"] as const;
export type ClubSlug = (typeof CLUBS)[number];
export const clubSlugSchema = v.picklist(CLUBS);
