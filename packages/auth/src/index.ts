import { createDb } from "@aloysius-web/db";
import { user, session, account, verification } from "@aloysius-web/db/schema";
import { env } from "@aloysius-web/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

const SITE_ADMIN_EMAIL = "admin@aloysiuscollege.lk";
const SITE_ADMIN_PASSWORD = "12345678";

export function createAuth() {
  const db = createDb();
  const adminEmails = ["tenukaomaljith@gmail.com", "admin@aloysius.lk", SITE_ADMIN_EMAIL];

  const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: { user, session, account, verification },
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (adminEmails.includes(user.email.toLowerCase())) {
              return { data: { ...user, role: "admin" } };
            }
            return { data: { ...user, role: user.role ?? "user" } };
          },
        },
        update: {
          before: async (user) => {
            if (user.email?.toLowerCase() && adminEmails.includes(user.email.toLowerCase())) {
              return { data: { ...user, role: "admin" } };
            }
            return { data: user };
          },
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [admin()],
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
      },
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
  });

  ensureSiteAdmin(auth);

  return auth;
}

async function ensureSiteAdmin(auth: ReturnType<typeof createAuth>) {
  try {
    const existing = await auth.api.listUsers({ query: { email: SITE_ADMIN_EMAIL } });
    const found = existing?.users?.find((u: any) => u.email === SITE_ADMIN_EMAIL);
    if (!found) {
      await auth.api.createUser({
        body: {
          email: SITE_ADMIN_EMAIL,
          password: SITE_ADMIN_PASSWORD,
          name: "Site Admin",
          role: "admin",
        },
      });
      console.log(`[auth] Created site admin: ${SITE_ADMIN_EMAIL}`);
    }
  } catch (e) {
    console.error("[auth] Failed to ensure site admin:", e);
  }
}
