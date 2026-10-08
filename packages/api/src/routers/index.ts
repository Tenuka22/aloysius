import { publicProcedure } from "../index";
import { listSeatAccounts, setSeatPassword } from "./admin-accounts";
import { clubRouter } from "./club";
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
  club: clubRouter,
  admin: { listSeatAccounts, setSeatPassword },
};

export type AppRouter = typeof appRouter;
