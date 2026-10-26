import { describe, expect, it } from "vitest";

import { buildSitemapEntries, renderSitemapXml } from "./sitemap";

const day = (iso: string) => new Date(iso);

describe("sitemap", () => {
  const entries = buildSitemapEntries({
    galleries: [
      { slug: "sports-day", updatedAt: day("2026-10-01T00:00:00Z") },
      { slug: "a&b", updatedAt: day("2026-10-10T00:00:00Z") },
    ],
    newsUpdatedAt: day("2026-09-01T00:00:00Z"),
    publishedAtByPage: new Map([
      ["homepage", day("2026-10-20T00:00:00Z")],
      ["about", day("2026-08-01T00:00:00Z")],
    ]),
  });
  const paths = entries.map((entry) => entry.path);

  it("lists only pages that exist and may be indexed", () => {
    expect(paths).toContain("/");
    expect(paths).toContain("/galleries");
    expect(paths).not.toContain("/admissions");
    for (const path of paths) {
      expect(path).not.toMatch(
        /^\/(?:admin|cms|club-admin|sign-in|preview|api)/u
      );
    }
  });

  it("adds one URL per approved gallery", () => {
    expect(paths).toContain("/galleries/sports-day");
    expect(paths).toContain("/galleries/a%26b");
  });

  it("takes lastmod from real data and omits it when there is none", () => {
    const byPath = new Map(entries.map((entry) => [entry.path, entry.lastmod]));

    expect(byPath.get("/")?.toISOString()).toBe("2026-10-20T00:00:00.000Z");
    expect(byPath.get("/news")?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(byPath.get("/galleries")?.toISOString()).toBe(
      "2026-10-10T00:00:00.000Z"
    );
    expect(byPath.get("/contact")).toBeUndefined();
  });

  it("renders absolute canonical URLs and escapes XML", () => {
    const xml = renderSitemapXml([
      { lastmod: day("2026-10-01T00:00:00Z"), path: "/galleries/a&b" },
      { path: "/" },
    ]);

    expect(xml).toContain(
      "<loc>https://aloysiuscollege.lk/galleries/a&amp;b</loc>"
    );
    expect(xml).toContain("<lastmod>2026-10-01T00:00:00.000Z</lastmod>");
    expect(xml).toContain("<loc>https://aloysiuscollege.lk/</loc>");
  });
});
