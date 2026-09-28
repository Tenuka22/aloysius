import { publicProcedure } from "../index";
import { adminClubsRouter } from "./admin-clubs";
import { adminUsersRouter } from "./admin-users";
import { clubsRouter } from "./clubs";
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
  adminUsers: adminUsersRouter,
  adminClubs: adminClubsRouter,
  clubs: clubsRouter,
};

export type AppRouter = typeof appRouter;
