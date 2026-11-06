import * as stylex from "@stylexjs/stylex";

import { font } from "../../tokens/tokens.stylex";
import type { ImageSource } from "../primitives/media";
import { Reveal } from "../primitives/reveal";
import { DcEyebrow, DcInner, DcSection, DcSlot } from "./dc";
import { dc } from "./dc-styles";

const styles = stylex.create({
  section: {
    paddingBlock: "clamp(72px, 10vw, 130px)",
  },
  watermark: {
    insetInlineStart: "-100px",
    insetBlockStart: "50%",
    transform: "translateY(-50%)",
    height: "520px",
    opacity: 0.06,
  },
  grid: {
    display: "grid",
    gap: "48px 80px",
    alignItems: "center",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  },
  eyebrow: {
    marginBlockEnd: "20px",
  },
  quote: {
    margin: 0,
    marginBlockEnd: "26px",
    fontFamily: font.display,
    fontSize: "clamp(35px, 4.7vw, 56px)",
    fontWeight: 600,
    lineHeight: 1.08,
    color: "#FFF8E7",
  },
  body: {
    margin: 0,
    marginBlockEnd: "40px",
    maxWidth: "54ch",
    fontSize: "16px",
    lineHeight: 1.75,
    color: "rgba(255, 248, 231, 0.75)",
    textWrap: "pretty",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
  },
  buttonPrimary: {
    display: "inline-block",
    paddingBlock: "14px",
    paddingInline: "30px",
    backgroundColor: {
      default: "#FFB203",
      ":hover": "#FFD45A",
    },
    color: "#013405",
    fontSize: "14px",
    fontWeight: 800,
    textDecoration: "none",
  },
  buttonOutline: {
    display: "inline-block",
    paddingBlock: "14px",
    paddingInline: "30px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: {
      default: "rgba(255, 248, 231, 0.5)",
      ":hover": "#FFB203",
    },
    color: {
      default: "#FFF8E7",
      ":hover": "#FFB203",
    },
    fontSize: "14px",
    fontWeight: 700,
    textDecoration: "none",
  },
  photo: {
    width: "100%",
    height: "clamp(260px, 40vw, 440px)",
  },
});

export const Alumni = ({
  quote = "The Aloysian Legacy Continues.",
  body = "A global network of Aloysians in leadership, service and scholarship — connected by the crest they carried.",
  photo,
  crestSrc = "/logo.png",
  associationHref = "/alumni",
  distinguishedHref = "/alumni#distinguished",
}: {
  quote?: string;
  body?: string;
  photo?: ImageSource;
  crestSrc?: string;
  associationHref?: string;
  distinguishedHref?: string;
}) => (
  <DcSection labelledBy="alumni-title" style={styles.section} tone="green">
    <img
      alt=""
      aria-hidden="true"
      src={crestSrc}
      {...stylex.props(dc.watermark, styles.watermark)}
    />
    <DcInner narrow>
      <div {...stylex.props(styles.grid)}>
        <Reveal direction="up">
          <div>
            <DcEyebrow gold style={styles.eyebrow}>
              Old Boys&rsquo; Association
            </DcEyebrow>
            <h2 id="alumni-title" {...stylex.props(styles.quote)}>
              &ldquo;{quote}&rdquo;
            </h2>
            <p {...stylex.props(styles.body)}>{body}</p>
            <div {...stylex.props(styles.actions)}>
              <a href={associationHref} {...stylex.props(styles.buttonPrimary)}>
                Old Boys&rsquo; Association
              </a>
              <a
                href={distinguishedHref}
                {...stylex.props(styles.buttonOutline)}
              >
                Distinguished Aloysians
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={1} direction="up">
          <DcSlot
            inverse
            placeholder="Archival group photograph"
            source={photo}
            style={styles.photo}
          />
        </Reveal>
      </div>
    </DcInner>
  </DcSection>
);
