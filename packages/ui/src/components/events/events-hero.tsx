import * as stylex from "@stylexjs/stylex";

import { EVENTS_HERO_INTRO, EVENTS_HERO_TITLE } from "../../content/events";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container } from "../primitives/layout";

const styles = stylex.create({
  /*
   * A masthead, not a hero panel.
   *
   * About opens with a near-full-viewport inverse band because it is an
   * editorial page about the college. This is a diary: the visitor's job is to
   * reach the next date, so the masthead is deliberately short and sits on
   * cream. No inverse band, no crest watermark, no jump-link chip row - the
   * first agenda row has to be visible on a laptop without scrolling, which is
   * the whole reason this page does not reuse About's treatment.
   */
  masthead: {
    paddingBlock: {
      /*
       * The masthead is now followed by the deep-green lead band, which carries
       * its own full section padding. A masthead that also took a full step at
       * the bottom left roughly 200px of cream between the standfirst and the
       * first thing the visitor is actually here to see.
       */
      default: space.xl,
      [bp.md]: space["2xl"],
    },
    paddingBlockEnd: space.lg,
    paddingInline: space.gutter,
    backgroundColor: color.surface,
  },
  bar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: {
      default: "flex-start",
      [bp.md]: "flex-end",
    },
    justifyContent: "space-between",
    gap: space.md,
  },
  titleBlock: {
    minInlineSize: 0,
  },
  /*
   * The display face at the `3xl` step rather than About's `4xl`: this title
   * shares a row with a jump link, and `4xl` would push the agenda's first date
   * column below the fold on a laptop.
   */
  title: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.size3xl,
    lineHeight: font.leadingTight,
    letterSpacing: font.trackingTight,
    color: color.onSurface,
    textWrap: "balance",
  },
  intro: {
    margin: 0,
    marginBlockStart: space["2xs"],
    maxInlineSize: space.measure,
    fontSize: font.sizeLg,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  /*
   * The one control on the masthead: a plain inline link to the honours band,
   * with a permanently-present underline so hovering cannot resize the row and
   * shift the title.
   */
  anchor: {
    display: "inline-flex",
    alignItems: "center",
    flexShrink: 0,
    minBlockSize: {
      default: "1.5rem",
      [bp.touch]: "2.75rem",
    },
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    color: color.accentOnSurface,
    textDecoration: "none",
    borderBlockEndWidth: "2px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.accent,
  },
});

export const EventsHero = ({
  title = EVENTS_HERO_TITLE,
  intro = EVENTS_HERO_INTRO,
  anchorHref = "#honours",
  anchorLabel,
}: {
  title?: string;
  intro?: string;
  anchorHref?: string;
  /** Omitted entirely when the page has no honours band to jump to. */
  anchorLabel?: string;
}) => (
  <section
    aria-labelledby="events-masthead-title"
    {...stylex.props(styles.masthead)}
  >
    <Container>
      <div {...stylex.props(styles.bar)}>
        <div {...stylex.props(styles.titleBlock)}>
          <h1 id="events-masthead-title" {...stylex.props(styles.title)}>
            {title}
          </h1>
          <p {...stylex.props(styles.intro)}>{intro}</p>
        </div>
        {anchorLabel ? (
          <a href={anchorHref} {...stylex.props(styles.anchor)}>
            {anchorLabel}
          </a>
        ) : null}
      </div>
    </Container>
  </section>
);
