import * as stylex from "@stylexjs/stylex";

import {
  RESULTS_BODY,
  RESULTS_CTA_HREF,
  RESULTS_CTA_LABEL,
  RESULTS_HEADING,
} from "../../content/academics";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { ButtonLink } from "../primitives/button";
import { Container, Section } from "../primitives/layout";

const styles = stylex.create({
  /*
   * Copy and call to action share a row from 40rem up and stack below it.
   * `flex-wrap` alone would do that, but the explicit `align-items` switch is
   * what keeps the button flush-left in the stacked state instead of stranded
   * against the right edge.
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

export const ResultsCta = ({ href = RESULTS_CTA_HREF }: { href?: string }) => (
  <Section id="results" labelledBy="results-title" tone="inverse">
    <Container>
      <div {...stylex.props(styles.bar)}>
        <div {...stylex.props(styles.copy)}>
          <h2 id="results-title" {...stylex.props(styles.heading)}>
            {RESULTS_HEADING}
          </h2>
          <p {...stylex.props(styles.body)}>{RESULTS_BODY}</p>
        </div>
        {/*
          The link is the flex item itself rather than sitting in a wrapper:
          `fluid` sets `width: 100%` below 26.75rem, which only spans the row
          if the element carrying it *is* the item that wrapped onto it.
        */}
        <ButtonLink fluid href={href} style={styles.action}>
          {RESULTS_CTA_LABEL}
        </ButtonLink>
      </div>
    </Container>
  </Section>
);
