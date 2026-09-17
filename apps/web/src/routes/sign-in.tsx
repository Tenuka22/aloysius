import { SignInPage } from "@aloysius/ui/components/auth/sign-in-page";
import type { SignInCredentials } from "@aloysius/ui/components/auth/sign-in-page";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { fetchSession } from "@/lib/session";

/**
 * One message for every credential failure. better-auth distinguishes "no such
 * user" from "wrong password", and surfacing that difference turns the sign-in
 * screen into a username-enumeration oracle.
 */
const GENERIC_FAILURE =
  "Those credentials were not recognised. Check them and try again.";

/** Where an admin lands when they sign in without a specific destination. */
const DEFAULT_DESTINATION = "/cms";

/**
 * Only same-origin, absolute-path redirects are honoured. Without this an
 * attacker can send `/sign-in?redirect=https://evil.example` and use the
 * College's own sign-in screen as an open redirect. `//host` is rejected too -
 * it is protocol-relative and leaves the origin.
 */
const safeDestination = (target: unknown): string => {
  if (typeof target !== "string") {
    return DEFAULT_DESTINATION;
  }
  if (!target.startsWith("/") || target.startsWith("//")) {
    return DEFAULT_DESTINATION;
  }
  return target;
};

const SignIn = () => {
  const navigate = useNavigate();
  // Sanitised again at the point of navigation, for the same reason the
  // `beforeLoad` guard does it: this is the other call that actually navigates.
  const destination = safeDestination(Route.useSearch().redirect);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async ({
    username,
    password,
    rememberMe,
  }: SignInCredentials) => {
    setError(null);

    const { error: signInError } = await authClient.signIn.username({
      username,
      password,
      rememberMe,
    });

    if (signInError) {
      setError(GENERIC_FAILURE);
      return;
    }

    // `reloadDocument` so the CMS route's `beforeLoad` re-runs against the
    // freshly set cookie instead of a router context captured before sign-in.
    await navigate({ to: destination, reloadDocument: true });
  };

  return <SignInPage error={error} onSubmit={handleSubmit} />;
};

export const Route = createFileRoute("/sign-in")({
  /*
   * The return type is annotated with `redirect` optional on purpose: inferred
   * as required, every `navigate({ to: "/sign-in" })` in the app would be
   * forced to pass a search object.
   *
   * The param is dropped when it is absent or already the default. Emitting it
   * unconditionally made the router normalise `/sign-in` to
   * `/sign-in?redirect=/cms` first, costing an extra redirect hop on every
   * visit and leaving a redundant param in the address bar. Dropping an unsafe
   * value here also strips it from the URL rather than echoing it back.
   */
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const target = safeDestination(search.redirect);
    return target === DEFAULT_DESTINATION ? {} : { redirect: target };
  },

  /*
   * Anyone the CMS would admit has no reason to see this screen; send them on
   * to wherever they were heading. Everyone else is left here deliberately -
   * the CMS would reject them, and bouncing them there is a redirect loop.
   */
  beforeLoad: async ({ search }) => {
    const session = await fetchSession();
    if (session?.canAccessCms) {
      // Re-sanitised here rather than trusting `validateSearch`: this is the
      // call that actually performs the navigation, and a raw value reaching
      // it is what turns the sign-in screen into an open redirect.
      throw redirect({ to: safeDestination(search.redirect) });
    }
  },

  head: () => ({
    meta: [
      { title: "Sign in | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "Sign in to the St. Aloysius' College staff and content management portal.",
      },
      // A sign-in screen must never rank; `follow` keeps the outbound links
      // (home, contact) contributing normally.
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: SignIn,
});
