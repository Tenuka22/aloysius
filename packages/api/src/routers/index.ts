import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { cmsRouter } from "./cms";
import { filesRouter } from "./files";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  /**
   * The current request's session, or `null` if signed out. Route layouts
   * call this from `beforeLoad` to gate access on the server - during SSR
   * this runs before any HTML is sent, so an unauthorized visitor never sees
   * a flash of protected UI while a client-side check catches up.
   */
  getSession: publicProcedure.handler(({ context }) => context.session),
  cms: cmsRouter,
  files: filesRouter,
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.session?.user,
  })),
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
