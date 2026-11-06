import * as stylex from "@stylexjs/stylex";
import { useMemo, useState } from "react";

import { ACHIEVEMENT_CATEGORIES } from "../../content/home";
import type { Achievement } from "../../content/home";
import { font } from "../../tokens/tokens.stylex";
import { VisuallyHidden } from "../primitives/layout";
import { Reveal } from "../primitives/reveal";
import { DcEyebrow, DcHeading, DcInner, DcSection } from "./dc";

const ALL = "All";

/** Categories the design tints red instead of gold. */
const NATIONAL_CATEGORIES = new Set(["National", "International"]);

const styles = stylex.create({
  backdrop: {
    position: "absolute",
    inset: 0,
    backgroundImage: "linear-gradient(135deg, #000000, #013405)",
    pointerEvents: "none",
  },
  heading: {
    marginBlockEnd: "16px",
    color: "#FFF8E7",
  },
  intro: {
    margin: 0,
    marginBlockEnd: "56px",
    maxWidth: "60ch",
    fontSize: "15px",
    color: "rgba(255, 248, 231, 0.65)",
  },
  filters: {
    display: "flex",
    flexWrap: "wrap",
    listStyle: "none",
    margin: 0,
    marginBlockEnd: "44px",
    padding: 0,
    gap: "12px",
  },
  chip: {
    paddingBlock: "9px",
    paddingInline: "18px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(255, 178, 3, 0.4)",
    backgroundColor: {
      default: "transparent",
      ":hover": "#FFB203",
    },
    color: {
      default: "#FFB203",
      ":hover": "#013405",
    },
    fontFamily: font.body,
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    cursor: "pointer",
    touchAction: "manipulation",
  },
  chipActive: {
    backgroundColor: "#FFB203",
    color: "#013405",
  },
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gap: "28px",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  },
  card: {
    borderBlockStartWidth: "2px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: "#FFB203",
    paddingBlockStart: "24px",
  },
  cardCategory: {
    margin: 0,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#FFB203",
  },
  cardCategoryNational: {
    color: "#E05252",
  },
  cardTitle: {
    margin: 0,
    marginBlock: "14px 10px",
    fontFamily: font.display,
    fontSize: "27px",
    fontWeight: 600,
    lineHeight: 1.2,
  },
  cardDetail: {
    margin: 0,
    fontSize: "13px",
    color: "rgba(255, 248, 231, 0.6)",
  },
  empty: {
    margin: 0,
    fontSize: "15px",
    color: "rgba(255, 248, 231, 0.65)",
  },
});

/**
 * Category filter. The design draws these chips as inert `<span>`s; here they
 * are real buttons (same look) that report state via `aria-pressed`, and a
 * single always-mounted live region announces the resulting count.
 */
export const Achievements = ({
  achievements,
  categories = ACHIEVEMENT_CATEGORIES,
  heading = "The Achievement Wall",
  intro = "Academic, sporting and national honours earned by Aloysians.",
}: {
  achievements: readonly Achievement[];
  categories?: readonly string[];
  heading?: string;
  intro?: string;
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
    <DcSection labelledBy="achievements-title" tone="black">
      <div aria-hidden="true" {...stylex.props(styles.backdrop)} />
      <DcInner>
        <DcEyebrow gold>Hall of fame</DcEyebrow>
        <DcHeading id="achievements-title" style={styles.heading}>
          {heading}
        </DcHeading>
        <p {...stylex.props(styles.intro)}>{intro}</p>

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
                  <p
                    {...stylex.props(
                      styles.cardCategory,
                      NATIONAL_CATEGORIES.has(item.category) &&
                        styles.cardCategoryNational
                    )}
                  >
                    {item.category}
                  </p>
                  <h3 {...stylex.props(styles.cardTitle)}>{item.title}</h3>
                  <p {...stylex.props(styles.cardDetail)}>{item.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p {...stylex.props(styles.empty)}>
              {active === ALL
                ? "No honours have been published yet."
                : `No ${active.toLowerCase()} honours have been published yet.`}
            </p>
          )}
        </Reveal>
      </DcInner>
    </DcSection>
  );
};
