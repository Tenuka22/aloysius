import * as stylex from "@stylexjs/stylex";

import { PREFECTS_BODY, PREFECTS_HEADING } from "../../content/students";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Section } from "../primitives/layout";
import type { ImageSource } from "../primitives/media";
import { Media } from "../primitives/media";

const styles = stylex.create({
  /*
   * Copy and photograph share the row from 48rem up.
   *
   * The band was copy-only in a full-width container, which left the right
   * half of a full-bleed green panel empty on every screen - the heading and
   * one paragraph, then a wide expanse of nothing. With no photograph the grid
   * collapses to one column, so an editor who clears the field gets the old
   * layout rather than a hole.
   */
  layout: {
    display: "grid",
    gap: space.xl,
    alignItems: "center",
    gridTemplateColumns: {
      default: "1fr",
      [bp.xl]: "minmax(0, 1fr) minmax(0, 1fr)",
    },
  },
  copy: {
    minWidth: 0,
  },
  photo: {
    borderRadius: "2px",
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

/**
 * The student-leadership banner: copy, and a photograph when one is published.
 *
 * The CMS block is `students-prefects`; its image field is optional, so an
 * editor who has not uploaded one yet still gets the copy-only band rather than
 * a reserved empty half.
 */
export const PrefectsCta = ({
  heading = PREFECTS_HEADING,
  body = PREFECTS_BODY,
  image,
}: {
  /** CMS-resolved copy; falls back to the page's own constants. */
  heading?: string;
  body?: string;
  /** CMS-resolved photograph; omitted until one is uploaded. */
  image?: ImageSource;
}) => (
  <Section id="prefects" labelledBy="prefects-title" tone="inverse">
    <Container>
      <div {...stylex.props(styles.layout)}>
        <div {...stylex.props(styles.copy)}>
          <h2 id="prefects-title" {...stylex.props(styles.heading)}>
            {heading}
          </h2>
          <p {...stylex.props(styles.body)}>{body}</p>
        </div>
        {image ? (
          <Media
            placeholder=""
            ratio="3:2"
            source={image}
            style={styles.photo}
          />
        ) : null}
      </div>
    </Container>
  </Section>
);
