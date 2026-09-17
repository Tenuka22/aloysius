import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { auth } from "../services";

/**
 * What the CMS chrome needs to render an account panel. Deliberately a
 * projection rather than the whole better-auth session: the full object carries
 * token and IP fields that have no business crossing to the client.
 */
export interface SessionSummary {
  name: string;
  role: string;
  isSiteAdmin: boolean;
}

/**
 * Reads the current session on the server.
 *
 * The handler body is stripped from the client bundle by the Start plugin, so
 * importing `../services` here does not drag the database, storage or auth
 * instance into the browser.
 *
 * Returns `null` rather than throwing when there is no session: "signed out" is
 * an ordinary state for a route guard to branch on, not an error.
 */
export const fetchSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionSummary | null> => {
    const session = await auth.api.getSession({
      headers: getRequest().headers,
    });

    const user = session?.user;
    if (!user) {
      return null;
    }

    const role = user.role ?? "user";

    return {
      // `username` is what the admin actually signs in with; `name` is the
      // display field and may be unset on a seeded account.
      name: user.name || user.username || "Account",
      role,
      isSiteAdmin: role === "admin",
    };
  }
);
