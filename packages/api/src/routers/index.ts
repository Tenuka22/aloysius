import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { filesRouter } from "./files";
import { newsRouter } from "./news";
import { announcementsRouter } from "./announcements";

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
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
