import * as stylex from "@stylexjs/stylex";

import { MOTTO, MOTTO_TRANSLATION } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, palette, space } from "../../tokens/tokens.stylex";
import { Container } from "../primitives/layout";

const styles = stylex.create({
  section: {
    position: "relative",
    // `clip` not `hidden`: `hidden` makes the section a scroll container, which
    // breaks `scroll-margin` for the #motto jump link and can trap touch pans.
    overflowX: "clip",
    backgroundColor: palette.black,
    color: color.onInverse,
    paddingBlock: space["3xl"],
    paddingInline: space.gutter,
    textAlign: "center",
  },
  watermark: {
    position: "absolute",
    insetInlineStart: "50%",
    insetBlockStart: "50%",
    transform: "translate(-50%, -50%)",
    height: "32rem",
    width: "auto",
    opacity: 0.06,
    pointerEvents: "none",
    display: {
      default: "none",
      [bp.md]: "block",
    },
  },
  content: {
    position: "relative",
  },
  eyebrow: {
    margin: 0,
    marginBlockEnd: space.md,
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingUltra,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  motto: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    letterSpacing: font.trackingWide,
    lineHeight: font.leadingTight,
    /*
     * 34px at 320px, 110px at 1920px. The previous 3.5rem floor set 56px type
     * for a 15-character word on a 280px column - it overflowed the viewport
     * on every phone in the matrix and the section's clip hid the evidence.
     */
    fontSize: "clamp(2.125rem, 1.15rem + 4.9vw, 6.875rem)",
    textTransform: "uppercase",
    overflowWrap: "break-word",
  },
  rule: {
    width: "3.5rem",
    height: "2px",
    marginBlock: space.lg,
    marginInline: "auto",
    backgroundColor: color.accent,
    border: 0,
  },
  translation: {
    margin: 0,
    fontFamily: font.display,
    fontStyle: "italic",
    fontSize: font.size2xl,
    color: color.onInverseMuted,
  },
});

export const MottoBanner = ({
  motto = MOTTO,
  translation = MOTTO_TRANSLATION,
  crestSrc = "/logo.png",
}: {
  motto?: string;
  translation?: string;
  crestSrc?: string;
}) => (
  <section
    aria-labelledby="motto-title"
    id="motto"
    {...stylex.props(styles.section)}
  >
    <img
      alt=""
      aria-hidden="true"
      src={crestSrc}
      {...stylex.props(styles.watermark)}
    />
    <Container>
      <div {...stylex.props(styles.content)}>
        <p {...stylex.props(styles.eyebrow)}>The College Motto</p>
        <h2 id="motto-title" {...stylex.props(styles.motto)}>
          {motto}
        </h2>
        <hr {...stylex.props(styles.rule)} />
        <p {...stylex.props(styles.translation)}>&ldquo;{translation}&rdquo;</p>
      </div>
    </Container>
  </section>
);
