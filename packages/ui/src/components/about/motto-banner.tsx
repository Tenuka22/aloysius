import * as stylex from "@stylexjs/stylex";

import { MOTTO, MOTTO_TRANSLATION } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";
import { DcEyebrow, DcSection } from "../home/dc";

const styles = stylex.create({
  section: {
    paddingBlock: "clamp(72px, 12vw, 140px)",
    textAlign: "center",
  },
  watermark: {
    position: "absolute",
    insetInlineStart: "50%",
    insetBlockStart: "50%",
    transform: "translate(-50%, -50%)",
    height: "520px",
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
    marginBlockEnd: "30px",
  },
  motto: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: 600,
    letterSpacing: "0.04em",
    lineHeight: 1,
    // 8vw capped at 110px, as designed; the floor lets the two words wrap
    // instead of overflowing a 320px phone.
    fontSize: "clamp(34px, 8vw, 110px)",
    textTransform: "uppercase",
    overflowWrap: "break-word",
  },
  rule: {
    width: "56px",
    height: "2px",
    marginBlock: "36px",
    marginInline: "auto",
    backgroundColor: "#FFB203",
    borderWidth: 0,
    borderStyle: "none",
  },
  translation: {
    margin: 0,
    fontFamily: font.display,
    fontStyle: "italic",
    fontSize: "26px",
    color: "rgba(255, 248, 231, 0.8)",
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
  <DcSection
    id="motto"
    labelledBy="motto-title"
    style={styles.section}
    tone="black"
  >
    <img
      alt=""
      aria-hidden="true"
      decoding="async"
      loading="lazy"
      src={crestSrc}
      {...stylex.props(styles.watermark)}
    />
    <div {...stylex.props(styles.content)}>
      <DcEyebrow gold style={styles.eyebrow}>
        The College Motto
      </DcEyebrow>
      <h2 id="motto-title" {...stylex.props(styles.motto)}>
        {motto}
      </h2>
      <hr {...stylex.props(styles.rule)} />
      <p {...stylex.props(styles.translation)}>&ldquo;{translation}&rdquo;</p>
    </div>
  </DcSection>
);
