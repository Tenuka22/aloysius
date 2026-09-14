import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { cmsRouter } from "./cms";
import { filesRouter } from "./files";
import { staffRouter } from "./staff";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  cms: cmsRouter,
  files: filesRouter,
  staff: staffRouter,
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.session?.user,
  })),
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
