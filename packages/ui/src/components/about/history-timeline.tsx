import * as stylex from "@stylexjs/stylex";

import type { TimelineEntry } from "../../content/about";
import { HISTORY_HEADING, TIMELINE } from "../../content/about";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Eyebrow, Heading, Section } from "../primitives/layout";
import { Media } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  headingSpacing: {
    marginBlock: `${space.sm} ${space.xl}`,
  },
  row: {
    display: "grid",
    columnGap: {
      default: space.md,
      [bp.md]: space.lg,
    },
    rowGap: space.md,
    /*
     * `max-content` for the year instead of a 5rem track: "Today" set in
     * Cormorant at the 2xl step is wider than 5rem, so the fixed track forced
     * the label to wrap mid-word on 320-390px phones.
     */
    gridTemplateColumns: {
      default: "max-content 2px minmax(0, 1fr)",
      [bp.xl]: "minmax(0, 6rem) 2px minmax(0, 1fr) minmax(0, 18rem)",
    },
    alignItems: "start",
    paddingBlock: space.lg,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  rowLast: {
    borderBlockEndWidth: 0,
  },
  year: {
    margin: 0,
    gridRow: {
      default: "1",
      [bp.xl]: "auto",
    },
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.size2xl,
    lineHeight: font.leadingTight,
    // Gold on cream is ~1.9:1. The year is content, so it takes the crimson
    // accent (7.4:1) that the token file reserves for accent *text* on cream;
    // gold stays on the rule beside it, where it is a fill.
    color: color.accentOnSurface,
  },
  rule: {
    alignSelf: "stretch",
    gridRow: {
      default: "1 / -1",
      [bp.xl]: "auto",
    },
    minHeight: "3rem",
    backgroundColor: color.accent,
  },
  entryTitle: {
    margin: 0,
    marginBlockEnd: space["2xs"],
    fontWeight: font.weightBold,
    fontSize: font.sizeLg,
    color: color.onSurface,
  },
  entryBody: {
    margin: 0,
    fontSize: font.sizeMd,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
  },
  /*
   * The archive photo is content, not decoration, so it is no longer hidden
   * below 1024px - it drops under the entry copy instead, inside the same
   * column so it stays aligned to the timeline rule.
   */
  image: {
    gridColumn: {
      default: "3 / -1",
      [bp.xl]: "4 / 5",
    },
    gridRow: {
      default: "auto",
      [bp.xl]: "1",
    },
    maxWidth: {
      default: "28rem",
      [bp.xl]: "none",
    },
  },
});

export const HistoryTimeline = ({
  entries = TIMELINE,
}: {
  entries?: readonly TimelineEntry[];
}) => (
  <Section id="history" labelledBy="history-title" tone="surface">
    <Container>
      <Eyebrow>History</Eyebrow>
      <Heading id="history-title" style={styles.headingSpacing}>
        {HISTORY_HEADING}
      </Heading>
      <div>
        {entries.map((entry, index) => (
          <Reveal delay={0} direction="up" key={entry.year + entry.title}>
            <div
              {...stylex.props(
                styles.row,
                index === entries.length - 1 && styles.rowLast
              )}
            >
              <p {...stylex.props(styles.year)}>{entry.year}</p>
              <div aria-hidden="true" {...stylex.props(styles.rule)} />
              <div>
                <h3 {...stylex.props(styles.entryTitle)}>{entry.title}</h3>
                <p {...stylex.props(styles.entryBody)}>{entry.body}</p>
              </div>
              <Media
                placeholder="Archive photo"
                ratio="4:3"
                source={entry.image}
                style={styles.image}
              />
            </div>
          </Reveal>
        ))}
      </div>
    </Container>
  </Section>
);
