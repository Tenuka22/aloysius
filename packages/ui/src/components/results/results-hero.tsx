import * as stylex from "@stylexjs/stylex";

import { RESULTS_HERO_INTRO, RESULTS_HERO_TITLE } from "../../content/results";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import { Container } from "../primitives/layout";

const EXAM_TABS = [
  { id: "al", label: "A/L Rankers", href: "#al" },
  { id: "ol", label: "O/L 9A", href: "#ol" },
  { id: "scholarship", label: "Grade 5 Scholarship", href: "#scholarship" },
] as const;

const styles = stylex.create({
  hero: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    paddingBlockStart: space["3xl"],
    paddingInline: space.gutter,
  },
  watermark: {
    position: "absolute",
    insetInlineEnd: "-5.5rem",
    insetBlockStart: "-3.5rem",
    height: "30rem",
    width: "auto",
    opacity: 0.07,
    pointerEvents: "none",
    display: {
      default: "none",
      [bp.md]: "block",
    },
  },
  content: {
    position: "relative",
  },
  breadcrumb: {
    margin: 0,
    marginBlockEnd: space.md,
    fontSize: font.sizeXs,
    fontWeight: font.weightSemibold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onInverseSubtle,
  },
  breadcrumbLink: {
    display: "inline-flex",
    alignItems: "center",
    minBlockSize: {
      default: "1.5rem",
      [bp.touch]: "2.75rem",
    },
    color: {
      default: color.onInverseSubtle,
      ":hover": color.accentOnInverse,
    },
    textDecoration: "none",
  },
  breadcrumbCurrent: {
    color: color.accentOnInverse,
  },
  title: {
    margin: 0,
    maxWidth: "14ch",
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.size4xl,
    lineHeight: font.leadingTight,
    letterSpacing: font.trackingTight,
    textWrap: "balance",
  },
  intro: {
    margin: 0,
    marginBlockStart: space.md,
    maxWidth: space.measure,
    fontSize: font.sizeLg,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseMuted,
    textWrap: "pretty",
  },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: space.md,
    marginBlockStart: space.xl,
  },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "2px",
  },
  tab: {
    display: "inline-flex",
    alignItems: "center",
    minBlockSize: "2.75rem",
    paddingInline: space.md,
    fontSize: font.sizeSm,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    textDecoration: "none",
    backgroundColor: {
      default: "rgba(255, 248, 231, 0.08)",
      ":hover": "rgba(255, 248, 231, 0.18)",
    },
    color: color.onInverse,
    transitionProperty: "background-color",
    transitionDuration: motionToken.fast,
  },
  years: {
    margin: 0,
    padding: 0,
    borderWidth: 0,
    minInlineSize: 0,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space.xs,
    paddingBlockEnd: space.sm,
  },
  yearsLabel: {
    margin: 0,
    marginInlineEnd: space["2xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onInverseSubtle,
  },
  year: {
    minBlockSize: "2.75rem",
    minInlineSize: "2.75rem",
    paddingInline: space.sm,
    borderWidth: space.px,
    borderStyle: "solid",
    fontFamily: font.mono,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    cursor: "pointer",
  },
  yearIdle: {
    backgroundColor: "transparent",
    borderColor: color.borderInverse,
    color: color.onInverseMuted,
  },
  yearActive: {
    backgroundColor: color.accent,
    borderColor: color.accent,
    color: color.onAccent,
  },
});

export interface ResultsHeroProps {
  years: readonly string[];
  year: string;
  onYearChange: (year: string) => void;
}

export const ResultsHero = ({
  years,
  year,
  onYearChange,
}: ResultsHeroProps) => (
  <section aria-labelledby="results-hero-title" {...stylex.props(styles.hero)}>
    <img
      alt=""
      aria-hidden="true"
      decoding="async"
      loading="lazy"
      src="/logo.png"
      {...stylex.props(styles.watermark)}
    />
    <Container>
      <div {...stylex.props(styles.content)}>
        <nav aria-label="Breadcrumb">
          <p {...stylex.props(styles.breadcrumb)}>
            <a href="/" {...stylex.props(styles.breadcrumbLink)}>
              Home
            </a>{" "}
            /{" "}
            <a href="/academics" {...stylex.props(styles.breadcrumbLink)}>
              Academics
            </a>{" "}
            /{" "}
            <span {...stylex.props(styles.breadcrumbCurrent)}>
              Examinations &amp; Results
            </span>
          </p>
        </nav>
        <h1 id="results-hero-title" {...stylex.props(styles.title)}>
          {RESULTS_HERO_TITLE}
        </h1>
        <p {...stylex.props(styles.intro)}>{RESULTS_HERO_INTRO}</p>

        <div {...stylex.props(styles.controls)}>
          <nav aria-label="Result categories" {...stylex.props(styles.tabs)}>
            {EXAM_TABS.map((tab) => (
              <a href={tab.href} key={tab.id} {...stylex.props(styles.tab)}>
                {tab.label}
              </a>
            ))}
          </nav>
          <fieldset {...stylex.props(styles.years)}>
            <legend {...stylex.props(styles.yearsLabel)}>Exam year</legend>
            {years.map((value) => {
              const on = value === year;
              return (
                <button
                  aria-pressed={on}
                  key={value}
                  onClick={() => onYearChange(value)}
                  type="button"
                  {...stylex.props(
                    styles.year,
                    on ? styles.yearActive : styles.yearIdle
                  )}
                >
                  {value}
                </button>
              );
            })}
          </fieldset>
        </div>
      </div>
    </Container>
  </section>
);
