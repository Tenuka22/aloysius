import { afterEach, describe, expect, it, vi } from "vitest";

import { syncAdmissionsCookiesToSharedDomain } from "./sync-admissions-cookies";

function setLocation(hostname: string) {
  Object.defineProperty(window, "location", {
    value: { hostname, pathname: "/", search: "" },
    writable: true,
    configurable: true,
  });
}

function clearAllCookies() {
  for (const entry of document.cookie.split(";")) {
    const name = entry.split("=")[0]?.trim();
    if (name) {
      document.cookie = `${name}=; max-age=0`;
    }
  }
}

describe(syncAdmissionsCookiesToSharedDomain, () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearAllCookies();
  });

  it("does nothing on a host outside the shared admissions domain", () => {
    setLocation("example.com");
    document.cookie = "aloysius-admissions-application-key=abc123";
    const setCookie = vi.spyOn(document, "cookie", "set");

    syncAdmissionsCookiesToSharedDomain();

    expect(setCookie).not.toHaveBeenCalled();
  });

  it("re-writes a present admissions cookie with the shared domain attribute", () => {
    setLocation("aloysiuscollege.lk");
    document.cookie = "aloysius-admissions-application-key=abc%20123";
    const setCookie = vi.spyOn(document, "cookie", "set");

    syncAdmissionsCookiesToSharedDomain();

    expect(setCookie).toHaveBeenCalledOnce();
    expect(setCookie.mock.calls[0]?.[0]).toBe(
      "aloysius-admissions-application-key=abc%20123; path=/; max-age=31536000; samesite=lax; domain=aloysiuscollege.lk"
    );
  });

  it("also rewrites cookies on a subdomain of the shared domain", () => {
    setLocation("admissions.aloysiuscollege.lk");
    document.cookie = "aloysius-admissions-application-session-code=xyz";
    const setCookie = vi.spyOn(document, "cookie", "set");

    syncAdmissionsCookiesToSharedDomain();

    expect(setCookie).toHaveBeenCalledOnce();
  });

  it("skips cookies that are not present", () => {
    setLocation("aloysiuscollege.lk");
    const setCookie = vi.spyOn(document, "cookie", "set");

    syncAdmissionsCookiesToSharedDomain();

    expect(setCookie).not.toHaveBeenCalled();
  });
});
