import { describe, expect, it } from "vitest";

import { OG_IMAGE, SITE_URL, pageHead, privateHead } from "./seo";

const metaContent = (
  meta: readonly Record<string, string | undefined>[],
  key: "name" | "property",
  value: string
): string | undefined => meta.find((tag) => tag[key] === value)?.content;

describe(pageHead, () => {
  const head = pageHead({
    description: "About the College.",
    path: "/about",
    title: "About | St. Aloysius' College, Galle",
  });

  it("sets an absolute canonical link on the apex host", () => {
    expect(head.links).toStrictEqual([
      { href: `${SITE_URL}/about`, rel: "canonical" },
    ]);
  });

  it("mirrors title and description into Open Graph and Twitter tags", () => {
    expect(metaContent(head.meta, "property", "og:title")).toBe(
      "About | St. Aloysius' College, Galle"
    );
    expect(metaContent(head.meta, "property", "og:url")).toBe(
      `${SITE_URL}/about`
    );
    expect(metaContent(head.meta, "name", "twitter:description")).toBe(
      "About the College."
    );
  });

  it("defaults the social image to the shared 1200x630 card", () => {
    expect(metaContent(head.meta, "property", "og:image")).toBe(OG_IMAGE.url);
    expect(metaContent(head.meta, "property", "og:image:width")).toBe("1200");
    expect(metaContent(head.meta, "property", "og:image:height")).toBe("630");
  });

  it("emits a BreadcrumbList from Home to the page", () => {
    const [script] = head.scripts;
    const data = JSON.parse(script?.children ?? "{}");

    expect(data["@type"]).toBe("BreadcrumbList");
    expect(
      data.itemListElement.map((item: { item: string }) => item.item)
    ).toStrictEqual([`${SITE_URL}/`, `${SITE_URL}/about`]);
    expect(data.itemListElement[1].name).toBe("About");
  });

  it("emits no breadcrumb for the homepage", () => {
    const home = pageHead({
      description: "Home.",
      path: "/",
      title: "St. Aloysius' College, Galle",
    });

    expect(home.scripts).toStrictEqual([]);
    expect(home.links).toStrictEqual([
      { href: `${SITE_URL}/`, rel: "canonical" },
    ]);
  });

  it("uses a page's own image without the default image dimensions", () => {
    const withImage = pageHead({
      description: "A gallery.",
      image: `${SITE_URL}/api/files/a.jpg`,
      path: "/galleries/a",
      title: "A",
    });

    expect(metaContent(withImage.meta, "property", "og:image")).toBe(
      `${SITE_URL}/api/files/a.jpg`
    );
    expect(
      metaContent(withImage.meta, "property", "og:image:width")
    ).toBeUndefined();
  });
});

describe(privateHead, () => {
  it("is noindex, nofollow by default and noindex, follow on request", () => {
    expect(privateHead("CMS").meta).toContainEqual({
      content: "noindex, nofollow",
      name: "robots",
    });
    expect(privateHead("Sign in", true).meta).toContainEqual({
      content: "noindex, follow",
      name: "robots",
    });
  });
});
