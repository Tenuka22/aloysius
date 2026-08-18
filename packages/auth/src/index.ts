import { and, eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { user, session, account, verification } from "@aloysius-web/db/schema";
import { env } from "@aloysius-web/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

import { hashPassword, verifyPassword } from "better-auth/crypto";

export { hashPassword, verifyPassword };

import { randomBytes } from "node:crypto";

export function generateRandomPassword() {
  const charset =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_-+=?";
  const bytes = randomBytes(24);
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += charset[bytes[i]! % charset.length]!;
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return generateRandomPassword();
  }
  return password;
}

const SITE_ADMIN_EMAIL = "admin@aloysiuscollege.lk";
const SITE_ADMIN_PASSWORD = "12345678";
const OB_ADMIN_EMAIL = "obadmin@aloysiuscollege.lk";
const OB_ADMIN_PASSWORD = "12345678";

/** Domain used for auto-generated per-activity admin login emails. */
export const ACTIVITY_ADMIN_EMAIL_DOMAIN = "aloysiuscollege.lk";

/** Derives the auto-generated login email for an activity from its slug. */
export function activityAdminEmail(slug: string) {
  return `${slug}@${ACTIVITY_ADMIN_EMAIL_DOMAIN}`;
}

/** Derives the auth role granted to an activity's admin account (`<slug>:admin`). */
export function activityAdminRole(slug: string) {
  return `${slug}:admin`;
}

/** Emails that are promoted to a privileged role automatically on create/update. */
const EMAIL_ROLES: Record<string, string> = {
  "tenukaomaljith@gmail.com": "admin",
  "admin@aloysius.lk": "admin",
  [SITE_ADMIN_EMAIL]: "admin",
  [OB_ADMIN_EMAIL]: "ob:admin",
};

export function createAuth() {
  const db = createDb();

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
            const role = user.email?.toLowerCase()
              ? EMAIL_ROLES[user.email.toLowerCase()]
              : undefined;
            if (role) {
              return { data: { ...user, role } };
            }
            return { data: { ...user, role: user.role ?? "user" } };
          },
        },
        update: {
          before: async (user) => {
            const role = user.email?.toLowerCase()
              ? EMAIL_ROLES[user.email.toLowerCase()]
              : undefined;
            if (role) {
              return { data: { ...user, role } };
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

  return auth;
}

export async function ensureSiteAdmin(auth: ReturnType<typeof createAuth>) {
  await ensureCredentialUser(auth, {
    email: SITE_ADMIN_EMAIL,
    password: SITE_ADMIN_PASSWORD,
    name: "Site Admin",
    role: "admin",
  });
}

export async function ensureOBAdmin(auth: ReturnType<typeof createAuth>) {
  await ensureCredentialUser(auth, {
    email: OB_ADMIN_EMAIL,
    password: OB_ADMIN_PASSWORD,
    name: "OB Admin",
    role: "ob:admin",
  });
}

/**
 * Bootstraps (or re-secures) a credential login for a privileged account.
 * If the user already exists its password is rotated to the given default so a
 * forgotten/leaked password is always reset on boot — a server-side stand-in
 * for the admin plugin's `setUserPassword` route, which needs an admin session.
 */
async function ensureCredentialUser(
  auth: ReturnType<typeof createAuth>,
  {
    email,
    password,
    name,
    role,
  }: { email: string; password: string; name: string; role: string },
) {
  const db = createDb();
  const hash = await hashPassword(password);

  const existing = await db.select().from(user).where(eq(user.email, email)).get();
  if (!existing) {
    try {
      await auth.api.createUser({
        body: { email, password, name, role } as never,
      });
      console.log(`[auth] Created ${role}: ${email}`);
    } catch (e) {
      console.error(`[auth] ensure ${role} create error:`, e);
    }
    return;
  }

  const existingAccount = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, existing.id), eq(account.providerId, "credential")))
    .get();
  if (existingAccount) {
    await db
      .update(account)
      .set({ password: hash })
      .where(eq(account.id, existingAccount.id))
      .run();
  } else {
    await db
      .insert(account)
      .values({
        id: crypto.randomUUID(),
        accountId: existing.id,
        providerId: "credential",
        userId: existing.id,
        password: hash,
      })
      .run();
  }
  console.log(`[auth] Rotated password for ${role}: ${email}`);
}
