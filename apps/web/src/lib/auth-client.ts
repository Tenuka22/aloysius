"use client";

import { createAuthClient } from "better-auth/react";
import { env } from "@aloysius-web/env/web";

export const authClient = createAuthClient({
  baseURL: `${env.VITE_SERVER_URL}/api/auth`,
  user: {
    additionalFields: {
      role: {
        type: "string",
      },
    },
  },
});

export type AuthUser = { id: string; email: string; name: string; role: string; image?: string | null };

export function useAuthSession() {
  const { data: session } = authClient.useSession();
  return { user: session?.user as AuthUser | undefined, session: session?.session };
}
