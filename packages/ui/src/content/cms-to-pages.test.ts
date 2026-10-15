import { describe, expect, it } from "vitest";

import type { CmsBlock } from "./cms-to-home";
import { blocksToStudentsProps } from "./cms-to-pages";
import { SPORT_TILES } from "./students";

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
    expect(result.sportsHeading).toBe("On the Field");
    expect(result.activitiesHeading).toBe("Beyond the Classroom");
    expect(result.housesHeading).toBe("The College Houses");
    expect(result.prefectsHeading).toBe("Prefects' Guild & Student Leadership");
  });

  it("uses saved copy when an editor has published it", () => {
    const result = blocksToStudentsProps(
      blocks({
        "students-sports": { "students-sports-heading": "On the Turf" },
        "students-activities": {
          "students-activities-heading": "Clubs, Teams & Societies",
        },
        "students-prefects": {
          "students-prefects-body":
            "The Guild keeps the college's daily order.",
        },
      })
    );

    expect(result.sportsHeading).toBe("On the Turf");
    expect(result.activitiesHeading).toBe("Clubs, Teams & Societies");
    expect(result.prefectsBody).toBe(
      "The Guild keeps the college's daily order."
    );
  });

  it("resolves a sport photograph onto the tile it belongs to", () => {
    const result = blocksToStudentsProps(
      blocks({
        "students-sports": { "students-sports-rugby": "image:rugby.jpg" },
      })
    );

    expect(result.sportImages?.rugby).toMatchObject({ src: "rugby.jpg" });
    // Only the tile that was actually supplied gets a photograph; the others
    // keep the branded placeholder rather than inheriting this one.
    expect(Object.keys(result.sportImages ?? {})).toStrictEqual(["rugby"]);
    for (const tile of SPORT_TILES) {
      expect(tile.id).toBeTruthy();
    }
  });

  it("reads the overflow list as a comma-separated field", () => {
    expect(
      blocksToStudentsProps(
        blocks({
          "students-sports": { "students-more-sports": "Rowing, Boxing" },
        })
      ).moreSports
    ).toStrictEqual(["Rowing", "Boxing"]);
  });

  it("drops the overflow panel when every entry is cleared", () => {
    // An editor who empties the field means "no more sports panel", not
    // "restore the shipped list".
    expect(
      blocksToStudentsProps(
        blocks({ "students-sports": { "students-more-sports": "  ,  " } })
      ).moreSports
    ).toStrictEqual([]);
  });

  it("never invents a house name the college has not published", () => {
    const result = blocksToStudentsProps(
      blocks({
        "students-houses": {
          "students-house-gold": "  Loyola House  ",
          "students-house-crimson": "   ",
        },
      })
    );

    expect(result.houseNames).toStrictEqual({ gold: "Loyola House" });
  });

  it("drops a hidden block's copy rather than falling back to it", () => {
    const result = blocksToStudentsProps(
      blocks(
        { "students-sports": { "students-sports-heading": "On the Turf" } },
        ["students-sports"]
      )
    );

    expect(result.sportsHeading).toBeUndefined();
    expect(result.sportImages).toStrictEqual({});
  });
});
