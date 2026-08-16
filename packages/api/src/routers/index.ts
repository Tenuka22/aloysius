import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { filesRouter } from "./files";
import { newsRouter } from "./news";
import { announcementsRouter } from "./announcements";
import { eventsRouter } from "./events";
import { achievementsRouter } from "./achievements";
import { galleryRouter } from "./gallery";
import { studentWorksRouter } from "./student-works";
import { statsRouter } from "./stats";
import { tagsRouter } from "./tags";
import { settingsRouter } from "./settings";
import { activitiesRouter } from "./activities";
import { bigMatchesRouter } from "./big-matches";
import { clubsRouter } from "./clubs";
import { notificationsRouter } from "./notifications";
import { clubAlbumsRouter } from "./club-albums";
import { principalsRouter } from "./principals";
import { staffRouter } from "./staff";
import { examResultsRouter } from "./exam-results";
import { obRouter } from "./ob";
import { adminRouter } from "./admin";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      userId: context.auth?.userId,
    };
  }),
  files: filesRouter,
  news: newsRouter,
  announcements: announcementsRouter,
  events: eventsRouter,
  achievements: achievementsRouter,
  gallery: galleryRouter,
  studentWorks: studentWorksRouter,
  stats: statsRouter,
  tags: tagsRouter,
  settings: settingsRouter,
  activities: activitiesRouter,
  bigMatches: bigMatchesRouter,
  clubs: clubsRouter,
  notifications: notificationsRouter,
  clubAlbums: clubAlbumsRouter,
  principals: principalsRouter,
  staff: staffRouter,
  examResults: examResultsRouter,
  ob: obRouter,
  admin: adminRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
