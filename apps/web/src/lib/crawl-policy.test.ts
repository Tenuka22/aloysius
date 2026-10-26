import { describe, expect, it } from "vitest";

import { canonicalRedirect, isPrivatePath, robotsHeader } from "./crawl-policy";

const redirectFor = (url: string, host: string, method = "GET") =>
  canonicalRedirect(new URL(url), host, method);

describe(canonicalRedirect, () => {
  it("sends www to the apex host, keeping path and query", () => {
    expect(
      redirectFor(
        "https://www.aloysiuscollege.lk/about?x=1",
        "www.aloysiuscollege.lk"
      )
    ).toBe("https://aloysiuscollege.lk/about?x=1");
  });

  it("strips a trailing slash", () => {
    expect(
      redirectFor("https://aloysiuscollege.lk/galleries/", "aloysiuscollege.lk")
    ).toBe("/galleries");
  });

  it("leaves canonical URLs, the root and non-page paths alone", () => {
    expect(
      redirectFor("https://aloysiuscollege.lk/", "aloysiuscollege.lk")
    ).toBeNull();
    expect(
      redirectFor("https://aloysiuscollege.lk/about", "aloysiuscollege.lk")
    ).toBeNull();
    expect(
      redirectFor("https://aloysiuscollege.lk/api/files/", "aloysiuscollege.lk")
    ).toBeNull();
    expect(
      redirectFor("http://localhost:4311/about/", "localhost:4311")
    ).not.toBeNull();
  });

  it("never redirects a non-GET request", () => {
    expect(
      redirectFor("https://aloysiuscollege.lk/x/", "aloysiuscollege.lk", "POST")
    ).toBeNull();
  });
});

describe(robotsHeader, () => {
  it("marks private areas noindex whatever the status", () => {
    expect(robotsHeader("/cms/news", 200)).toBe("noindex, nofollow");
    expect(robotsHeader("/preview/abc", 200)).toBe("noindex, nofollow");
    expect(isPrivatePath("/administrators")).toBeFalsy();
  });

  it("marks every 404 noindex and leaves public pages alone", () => {
    expect(robotsHeader("/nonsense", 404)).toBe("noindex, nofollow");
    expect(robotsHeader("/about", 200)).toBeNull();
  });
});
