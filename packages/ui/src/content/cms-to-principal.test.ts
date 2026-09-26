import { describe, expect, it } from "vitest";

import type { CmsBlock } from "./cms-to-home";
import { blocksToPrincipal, principalContent } from "./cms-to-principal";
import { PRINCIPAL_BLOCK_ID, PRINCIPAL_DEFAULTS } from "./principal";

const block = (fields: Record<string, string>, hidden = false): CmsBlock[] => [
  {
    id: PRINCIPAL_BLOCK_ID,
    hidden,
    fields: Object.entries(fields).map(([id, value]) => ({ id, value })),
  },
];

describe(blocksToPrincipal, () => {
  const defaults = PRINCIPAL_DEFAULTS;

  it("falls back to the shipped copy for absent fields", () => {
    const result = blocksToPrincipal(block({}), defaults);
    expect(result.quote).toBe(defaults.quote);
    expect(result.body).toBe(defaults.body);
    expect(result.eyebrow).toBe(defaults.eyebrow);
    expect(result.role).toBe(defaults.role);
  });

  it("uses saved values when present", () => {
    const result = blocksToPrincipal(
      block({
        "principal-quote": "A saved quote.",
        "principal-body": "<p>A saved body.</p>",
        "principal-eyebrow": "From the Head",
      }),
      defaults
    );
    expect(result.quote).toBe("A saved quote.");
    expect(result.body).toBe("<p>A saved body.</p>");
    expect(result.eyebrow).toBe("From the Head");
  });

  /**
   * The bug that motivated the global block: `??` only falls back on
   * null/undefined, so a field the editor cleared arrived as "" and rendered an
   * empty pair of quotation marks on the page.
   */
  it("treats a cleared field as 'use the default', not as empty", () => {
    const result = blocksToPrincipal(
      block({ "principal-quote": "", "principal-eyebrow": "" }),
      defaults
    );
    expect(result.quote).toBe(defaults.quote);
    expect(result.eyebrow).toBe(defaults.eyebrow);
  });

  it("keeps the link only when both label and target are set", () => {
    expect(
      blocksToPrincipal(
        block({
          "principal-link-label": "Read more",
          "principal-link-href": "/about",
        }),
        defaults
      ).link
    ).toStrictEqual({ href: "/about", label: "Read more" });

    expect(
      blocksToPrincipal(
        block({
          "principal-link-label": "Read more",
          "principal-link-href": "",
        }),
        defaults
      ).link
    ).toBeUndefined();

    expect(
      blocksToPrincipal(
        block({ "principal-link-label": "", "principal-link-href": "" }),
        defaults
      ).link
    ).toBeUndefined();
  });

  it("resolves the portrait and strips the image: prefix", () => {
    const result = blocksToPrincipal(
      block({ "principal-portrait": "image:/uploads/p.jpg" }),
      defaults
    );
    expect(result.portrait).toStrictEqual({
      src: "/uploads/p.jpg",
      alt: "Portrait of the Principal",
    });
  });

  it("carries the saved aspect ratio onto the portrait", () => {
    const blocks: CmsBlock[] = [
      {
        id: PRINCIPAL_BLOCK_ID,
        hidden: false,
        fields: [
          { id: "principal-portrait", value: "image:/p.jpg", aspectRatio: 0.8 },
        ],
      },
    ];
    expect(blocksToPrincipal(blocks, defaults).portrait?.aspectRatio).toBe(0.8);
  });

  it("reads the hidden flag", () => {
    expect(blocksToPrincipal(block({}, true), defaults).hidden).toBeTruthy();
    expect(blocksToPrincipal(block({}), defaults).hidden).toBeFalsy();
  });
});

describe(principalContent, () => {
  it("returns the shipped copy when there are no blocks at all", () => {
    expect(principalContent().quote).toBe(PRINCIPAL_DEFAULTS.quote);
    expect(principalContent([]).quote).toBe(PRINCIPAL_DEFAULTS.quote);
    expect(principalContent().hidden).toBeFalsy();
  });

  it("resolves when blocks are present", () => {
    expect(principalContent(block({ "principal-quote": "Hi" })).quote).toBe(
      "Hi"
    );
  });
});
