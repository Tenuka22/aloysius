import { ac, admin, cms, user } from "@aloysius/auth/permissions";
import {
  adminClient,
  multiSessionClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Mirrors the server's `admin()` + `multiSession()` + `username()` plugins
// (see packages/auth/src/index.ts) so `authClient.useSession()` is typed
// with `role`, and the admin/multi-session/username actions and error codes
// exist on this client. The two sides must be kept in sync plugin-for-plugin
// — there's no separate "cookie name" setting to pass here; the browser just
// sends whatever `Set-Cookie` the server issued under its custom prefix.
export const authClient = createAuthClient({
  plugins: [
    adminClient({ ac, roles: { admin, cms, user } }),
    multiSessionClient(),
    usernameClient(),
  ],
});
