import * as stylex from "@stylexjs/stylex";

import {
  ABOUT_PRINCIPAL_HEADING,
  ABOUT_PRINCIPAL_MESSAGE,
} from "../../content/about";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Eyebrow, Heading, Section } from "../primitives/layout";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  grid: {
    display: "grid",
    gap: space.xl,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: "minmax(0, 21rem) minmax(0, 1fr)",
    },
    alignItems: "center",
  },
  portraitWrap: {
    position: "relative",
    paddingInlineEnd: {
      default: 0,
      [bp.xl]: space["2xs"],
    },
    paddingBlockEnd: {
      default: 0,
      [bp.xl]: space["2xs"],
    },
    maxWidth: {
      default: "22rem",
      [bp.xl]: "none",
    },
  },
  frame: {
    display: {
      default: "none",
      [bp.xl]: "block",
    },
    position: "absolute",
    insetBlockStart: space["2xs"],
    insetInlineStart: space["2xs"],
    insetBlockEnd: 0,
    insetInlineEnd: 0,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.accent,
    pointerEvents: "none",
  },
  headingSpacing: {
    marginBlock: `${space.sm} ${space.md}`,
  },
  message: {
    margin: 0,
    marginBlockEnd: space.md,
    fontSize: font.sizeLg,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
  },
  attribution: {
    margin: 0,
    fontFamily: font.display,
    fontStyle: "italic",
    fontSize: font.sizeXl,
    color: color.onSurfaceSubtle,
  },
});

/**
 * The principal's name is optional for the same reason as the homepage's
 * `PrincipalMessage`: a placeholder name for a real person is worse than
 * naming the office alone.
 */
export const PrincipalNote = ({
  heading = ABOUT_PRINCIPAL_HEADING,
  message = ABOUT_PRINCIPAL_MESSAGE,
  name,
  portrait,
}: {
  heading?: string;
  message?: string;
  name?: string;
  portrait?: ImageSource;
}) => (
  <Section id="principal" labelledBy="principal-title" tone="raised">
    <Container>
      <div {...stylex.props(styles.grid)}>
        <Reveal direction="up">
          <div {...stylex.props(styles.portraitWrap)}>
            <Media
              placeholder="Principal portrait"
              ratio="4:5"
              source={portrait}
            />
            <div {...stylex.props(styles.frame)} />
          </div>
        </Reveal>
        <Reveal delay={1} direction="up">
          <div>
            <Eyebrow>Principal&rsquo;s message</Eyebrow>
            <Heading
              id="principal-title"
              level={2}
              style={styles.headingSpacing}
            >
              {heading}
            </Heading>
            <p {...stylex.props(styles.message)}>{message}</p>
            {name ? (
              <p {...stylex.props(styles.attribution)}>&mdash; {name}</p>
            ) : null}
          </div>
        </Reveal>
      </div>
    </Container>
  </Section>
);
