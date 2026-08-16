// --- Super-user tier ---
// Every procedure reachable under `client.admin.*` is gated exclusively by
// `adminProcedure` (site-admin only, see packages/api/src/index.ts). This is
// the ONLY namespace allowed to check `context.auth.adminCalled` — domain
// routers (news, events, ob, clubs, ...) must never fold a site-admin bypass
// into their own scoped-admin/author checks; site admins act through here.
import { adminNewsRouter } from "./news";
import { adminEventsRouter } from "./events";
import { adminAnnouncementsRouter } from "./announcements";
import { adminStudentWorksRouter } from "./student-works";
import { adminAchievementsRouter } from "./achievements";
import { adminGalleryRouter } from "./gallery";
import { adminActivitiesRouter } from "./activities";
import { adminStaffRouter } from "./staff";
import { adminPrincipalsRouter } from "./principals";
import { adminExamResultsRouter } from "./exam-results";
import { adminBigMatchesRouter } from "./big-matches";
import { adminSettingsRouter } from "./settings";
import { adminStatsRouter } from "./stats";
import { adminClubsRouter } from "./clubs";
import { adminClubAlbumsRouter } from "./club-albums";
import { adminObRouter } from "./ob";

export const adminRouter = {
  news: adminNewsRouter,
  events: adminEventsRouter,
  announcements: adminAnnouncementsRouter,
  studentWorks: adminStudentWorksRouter,
  achievements: adminAchievementsRouter,
  gallery: adminGalleryRouter,
  activities: adminActivitiesRouter,
  staff: adminStaffRouter,
  principals: adminPrincipalsRouter,
  examResults: adminExamResultsRouter,
  bigMatches: adminBigMatchesRouter,
  settings: adminSettingsRouter,
  stats: adminStatsRouter,
  clubs: adminClubsRouter,
  clubAlbums: adminClubAlbumsRouter,
  ob: adminObRouter,
};
