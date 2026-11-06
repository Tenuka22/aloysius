import { describe, expect, it } from "vitest";

import type { CmsBlock } from "./cms-to-home";
import { blocksToStudentsProps } from "./cms-to-pages";

const blocks = (
  entries: Record<string, Record<string, string>>,
  hidden: readonly string[] = []
): CmsBlock[] =>
  Object.entries(entries).map(([id, fields]) => ({
    id,
    hidden: hidden.includes(id),
    fields: Object.entries(fields).map(([fieldId, value]) => ({
      id: fieldId,
      value,
    })),
  }));

describe(blocksToStudentsProps, () => {
  it("falls back to the page's own copy when nothing is published", () => {
    const result = blocksToStudentsProps([]);

    expect(result.heading).toBe("Student Life");
    expect(result.tagline).toBe(
      "Sports, societies, houses and the traditions that shape every Aloysian."
    );
  });

  it("uses saved copy when an editor has published it", () => {
    const result = blocksToStudentsProps(
      blocks({
        "students-header": {
          "students-heading": "Life at the College",
          "students-tagline": "Where boys become Aloysians.",
        },
      })
    );

    expect(result.heading).toBe("Life at the College");
    expect(result.tagline).toBe("Where boys become Aloysians.");
  });

  it("drops a hidden block's copy rather than falling back to it", () => {
    const result = blocksToStudentsProps(
      blocks({ "students-header": { "students-heading": "Hidden" } }, [
        "students-header",
      ])
    );

    expect(result.heading).toBeUndefined();
  });
});
