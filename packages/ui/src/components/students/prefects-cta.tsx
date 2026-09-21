import * as stylex from "@stylexjs/stylex";

import {
  PREFECTS_BODY,
  PREFECTS_CTA_LABEL,
  PREFECTS_HEADING,
} from "../../content/students";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { ButtonLink } from "../primitives/button";
import { Container, Section } from "../primitives/layout";

const styles = stylex.create({
  /*
   * Copy and call to action share a row from 40rem up and stack below it.
   * `flex-wrap` alone would do that, but the explicit `align-items` switch is
   * what keeps the button flush-left in the stacked state instead of stranded
   * against the right edge - which is exactly what the mock does.
   */
  bar: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.md,
    alignItems: {
      default: "flex-start",
      [bp.md]: "center",
    },
    justifyContent: "space-between",
  },
  copy: {
    minWidth: 0,
  },
  heading: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onInverse,
    textWrap: "balance",
  },
  body: {
    margin: 0,
    marginBlockStart: space["2xs"],
    maxWidth: space.measure,
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseMuted,
    textWrap: "pretty",
  },
  action: {
    flexShrink: 0,
  },
});

/**
 * The design ships this call to action as `href="#"` - a primary button that
 * navigates nowhere. No prefects page exists yet, so `href` is optional and the
 * default is **no button at all**: an honest section of copy beats a dead
 * control that teaches the visitor something is there when it is not.
 */
export const PrefectsCta = ({ href }: { href?: string }) => (
  <Section id="prefects" labelledBy="prefects-title" tone="inverse">
    <Container>
      <div {...stylex.props(styles.bar)}>
        <div {...stylex.props(styles.copy)}>
          <h2 id="prefects-title" {...stylex.props(styles.heading)}>
            {PREFECTS_HEADING}
          </h2>
          <p {...stylex.props(styles.body)}>{PREFECTS_BODY}</p>
        </div>
        {href ? (
          /*
            The link is the flex item itself rather than sitting in a wrapper:
            `fluid` sets `width: 100%` below 26.75rem, which only spans the row
            if the element carrying it *is* the item that wrapped onto it.
          */
          <ButtonLink fluid href={href} style={styles.action}>
            {PREFECTS_CTA_LABEL}
          </ButtonLink>
        ) : null}
      </div>
    </Container>
  </Section>
);
