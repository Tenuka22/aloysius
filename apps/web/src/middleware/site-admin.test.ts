import { describe, expect, it } from "vitest";

import { assertSiteAdmin } from "./site-admin";

describe("assertSiteAdmin", () => {
  it("throws UNAUTHORIZED when there is no session", () => {
    expect(() => assertSiteAdmin(null)).toThrowError("UNAUTHORIZED");
    expect(() => assertSiteAdmin(undefined)).toThrowError("UNAUTHORIZED");
  });

  it("throws FORBIDDEN when the session user is not a site admin", () => {
    expect(() => assertSiteAdmin({ user: { role: "user" } })).toThrowError("FORBIDDEN");
    expect(() => assertSiteAdmin({ user: { role: null } })).toThrowError("FORBIDDEN");
  });

  it("does not throw for an authenticated site admin", () => {
    expect(() => assertSiteAdmin({ user: { role: "admin" } })).not.toThrow();
  });
});
