import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { filesRouter } from "./files";
import { newsRouter } from "./news";
import { announcementsRouter } from "./announcements";
import { eventsRouter } from "./events";
import { achievementsRouter } from "./achievements";
import { galleryRouter } from "./gallery";
import { studentWorksRouter } from "./student-works";
import { pagesRouter } from "./pages";
import { statsRouter } from "./stats";

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
  pages: pagesRouter,
  stats: statsRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
