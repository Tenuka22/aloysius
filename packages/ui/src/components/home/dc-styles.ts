import * as stylex from "@stylexjs/stylex";

import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";

/** Exact measurements from the approved homepage design (Homepage.dc.html). */
export const dc = stylex.create({
  section: {
    position: "relative",
    overflow: "hidden",
    paddingBlock: "clamp(66px, 10vw, 120px)",
    paddingInline: "clamp(20px, 5vw, 48px)",
  },
  toneCream: {
    backgroundColor: "#FFF8E7",
    color: "#013405",
  },
  toneRaised: {
    backgroundColor: "#fffdf6",
    color: "#013405",
    borderBlockStartWidth: "1px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: "rgba(1, 52, 5, 0.08)",
  },
  toneGreen: {
    backgroundColor: "#013405",
    color: "#FFF8E7",
  },
  toneGreenGradient: {
    backgroundImage: "linear-gradient(180deg, #013405, #062B0A)",
    color: "#FFF8E7",
  },
  toneBlack: {
    backgroundColor: "#000000",
    color: "#FFF8E7",
  },
  inner: {
    position: "relative",
    width: "100%",
    maxWidth: "1180px",
    marginInline: "auto",
  },
  innerNarrow: {
    maxWidth: "1080px",
  },
  eyebrow: {
    display: "block",
    margin: 0,
    marginBlockEnd: "18px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.4em",
    textTransform: "uppercase",
    color: "#A51919",
  },
  eyebrowGold: {
    color: "#FFB203",
  },
  heading: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: "clamp(33px, 4.5vw, 54px)",
    lineHeight: 1.05,
  },
  header: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "24px",
    marginBlockEnd: "56px",
  },
  link: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    paddingBlockEnd: "6px",
    borderBlockEndWidth: "2px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "#FFB203",
    fontSize: "14px",
    fontWeight: 700,
    whiteSpace: "nowrap",
    textDecoration: "none",
    color: {
      default: "#013405",
      ":hover": "#A51919",
    },
  },
  linkGold: {
    color: {
      default: "#FFB203",
      ":hover": "#FFD45A",
    },
  },
  slot: {
    position: "relative",
    overflow: "hidden",
    minWidth: 0,
  },
  watermark: {
    position: "absolute",
    pointerEvents: "none",
    width: "auto",
    display: {
      default: "none",
      [bp.md]: "block",
    },
  },
});
