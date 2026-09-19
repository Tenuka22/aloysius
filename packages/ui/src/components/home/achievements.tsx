import * as stylex from "@stylexjs/stylex";
import { useMemo, useState } from "react";

import { ACHIEVEMENT_CATEGORIES } from "../../content/home";
import type { Achievement } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import {
  Container,
  Eyebrow,
  Heading,
  Lead,
  Section,
  VisuallyHidden,
} from "../primitives/layout";
import { Reveal } from "../primitives/reveal";

const ALL = "All";

const styles = stylex.create({
  section: {
    backgroundImage: `linear-gradient(135deg, ${color.surfaceInverseDeep}, ${color.surfaceInverse})`,
    color: color.onInverse,
  },
  heading: {
    color: color.onInverse,
  },
  headingSpacing: {
    marginBlock: `${space.sm} ${space.sm}`,
  },
  filters: {
    display: "flex",
    flexWrap: "wrap",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gap: space["2xs"],
    marginBlock: `${space.xl} ${space.lg}`,
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "2.75rem",
    paddingInline: space.md,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderAccent,
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(255, 178, 3, 0.16)",
    },
    color: color.accentOnInverse,
    fontFamily: font.body,
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    transitionProperty: "background-color, color, border-color",
    transitionDuration: motionToken.fast,
  },
  chipActive: {
    backgroundColor: color.accent,
    borderColor: color.accent,
    color: color.onAccent,
  },

  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gap: space.lg,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.md]: "repeat(auto-fit, minmax(min(100%, 17rem), 1fr))",
    },
  },
  card: {
    borderBlockStartWidth: "2px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.accent,
    paddingBlockStart: space.md,
  },
  cardCategory: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  cardTitle: {
    margin: 0,
    marginBlock: `${space["2xs"]} ${space["3xs"]}`,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onInverse,
    textWrap: "pretty",
  },
  cardDetail: {
    margin: 0,
    fontSize: font.sizeSm,
    color: color.onInverseSubtle,
  },
  empty: {
    margin: 0,
    fontSize: font.sizeMd,
    color: color.onInverseMuted,
  },
});

/**
 * Category filter. In the design these chips were `<span>`s with hover styling
 * and no behaviour - invisible to assistive tech and to the keyboard. Here they
 * are real buttons in a tablist-free "toggle group": each one reports its state
 * via `aria-pressed`, and the results region is a live region so a screen reader
 * user hears the count change.
 */
export const Achievements = ({
  achievements,
  categories = ACHIEVEMENT_CATEGORIES,
}: {
  achievements: readonly Achievement[];
  categories?: readonly string[];
}) => {
  const [active, setActive] = useState(ALL);

  const visible = useMemo(
    () =>
      active === ALL
        ? achievements
        : achievements.filter((item) => item.category === active),
    [achievements, active]
  );

  return (
    <Section
      labelledBy="achievements-title"
      style={styles.section}
      tone="inverse"
    >
      <Container>
        <Eyebrow inverse>Hall of fame</Eyebrow>
        <Heading
          id="achievements-title"
          level={2}
          style={[styles.heading, styles.headingSpacing]}
        >
          The Achievement Wall
        </Heading>
        <Lead inverse>
          Academic, sporting and national honours earned by Aloysians.
        </Lead>

        <ul {...stylex.props(styles.filters)}>
          {categories.map((category) => {
            const isActive = category === active;
            return (
              <li key={category}>
                <button
                  aria-pressed={isActive}
                  onClick={() => setActive(category)}
                  type="button"
                  {...stylex.props(styles.chip, isActive && styles.chipActive)}
                >
                  {category}
                </button>
              </li>
            );
          })}
        </ul>

        {/*
          One stable live region that only ever holds a short count, rather than
          `aria-live` on the grid itself. A live region on the grid announces
          every card's full text on each filter change, and the empty-state
          variant was a *newly inserted* live region, which browsers do not
          announce at all. This node is always mounted, so the update is seen.
        */}
        <VisuallyHidden>
          <output aria-live="polite">
            {visible.length === 0
              ? `No ${active.toLowerCase()} honours published`
              : `Showing ${visible.length} ${active === ALL ? "" : `${active.toLowerCase()} `}${visible.length === 1 ? "honour" : "honours"}`}
          </output>
        </VisuallyHidden>

        <Reveal direction="up">
          {visible.length > 0 ? (
            <ul {...stylex.props(styles.grid)}>
              {visible.map((item) => (
                <li key={item.id} {...stylex.props(styles.card)}>
                  <p {...stylex.props(styles.cardCategory)}>{item.category}</p>
                  <h3 {...stylex.props(styles.cardTitle)}>{item.title}</h3>
                  <p {...stylex.props(styles.cardDetail)}>{item.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p {...stylex.props(styles.empty)}>
              No {active.toLowerCase()} honours have been published yet.
            </p>
          )}
        </Reveal>
      </Container>
    </Section>
  );
};
