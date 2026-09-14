import * as stylex from "@stylexjs/stylex";

import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { ArrowLink } from "../primitives/button";
import { Container, Eyebrow, Section } from "../primitives/layout";
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
    // The offset gold frame only reads on a wide layout; on a phone it would
    // sit on top of the copy.
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
  portrait: {
    position: "relative",
  },
  quote: {
    margin: 0,
    marginBlock: `${space.sm} ${space.md}`,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightMedium,
    lineHeight: font.leadingSnug,
    textWrap: "pretty",
  },
  attribution: {
    margin: 0,
    fontFamily: font.display,
    fontStyle: "italic",
    fontSize: font.sizeXl,
    color: color.onSurfaceMuted,
  },
  role: {
    margin: 0,
    marginBlock: `${space["3xs"]} ${space.lg}`,
    fontSize: font.size2xs,
    fontWeight: font.weightSemibold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurfaceSubtle,
  },
});

/**
 * The principal's name is optional on purpose: rendering a placeholder name for
 * a real person is worse than rendering the office alone.
 */
export const PrincipalMessage = ({
  quote = "Every Aloysian carries forward a tradition of faith, discipline and excellence - certa viriliter.",
  name,
  portrait,
  href = "/about",
}: {
  quote?: string;
  name?: string;
  portrait?: ImageSource;
  href?: string;
}) => (
  <Section labelledBy="principal-title" tone="raised">
    <Container>
      <div {...stylex.props(styles.grid)}>
        <Reveal direction="up">
          <div {...stylex.props(styles.portraitWrap)}>
            <Media
              placeholder="Principal portrait"
              ratio="4:5"
              source={portrait}
              style={styles.portrait}
            />
            <div {...stylex.props(styles.frame)} />
          </div>
        </Reveal>

        <Reveal delay={1} direction="up">
          <div>
            <Eyebrow>From the principal</Eyebrow>
            <blockquote {...stylex.props(styles.quote)} id="principal-title">
              &ldquo;{quote}&rdquo;
            </blockquote>
            {name ? (
              <p {...stylex.props(styles.attribution)}>&mdash; {name}</p>
            ) : null}
            <p {...stylex.props(styles.role)}>
              Principal, St. Aloysius&rsquo; College
            </p>
            <ArrowLink href={href}>Read the full message</ArrowLink>
          </div>
        </Reveal>
      </div>
    </Container>
  </Section>
);
