import * as stylex from "@stylexjs/stylex";

import { PREFECTS_BODY, PREFECTS_HEADING } from "../../content/students";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Section } from "../primitives/layout";

const styles = stylex.create({
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
});

/** The student-leadership banner: copy only, with no call-to-action button. */
export const PrefectsCta = ({
  heading = PREFECTS_HEADING,
  body = PREFECTS_BODY,
}: {
  /** CMS-resolved copy; falls back to the page's own constants. */
  heading?: string;
  body?: string;
}) => (
  <Section id="prefects" labelledBy="prefects-title" tone="inverse">
    <Container>
      <div {...stylex.props(styles.copy)}>
        <h2 id="prefects-title" {...stylex.props(styles.heading)}>
          {heading}
        </h2>
        <p {...stylex.props(styles.body)}>{body}</p>
      </div>
    </Container>
  </Section>
);
