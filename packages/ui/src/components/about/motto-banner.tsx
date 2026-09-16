import * as stylex from "@stylexjs/stylex";

import { MOTTO, MOTTO_TRANSLATION } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, palette, space } from "../../tokens/tokens.stylex";
import { Container } from "../primitives/layout";

const styles = stylex.create({
  section: {
    position: "relative",
    overflow: "hidden",
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
    fontSize: "clamp(3.5rem, 3rem + 4vw, 6.875rem)",
    textTransform: "uppercase",
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
