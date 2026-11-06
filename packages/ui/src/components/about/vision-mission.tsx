import * as stylex from "@stylexjs/stylex";

import { MISSION_STATEMENT, VISION_STATEMENT } from "../../content/about";
import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";
import { DcEyebrow, DcInner, DcSection } from "../home/dc";
import { Reveal } from "../primitives/reveal";

const GOLD_LINE = "rgba(255, 178, 3, 0.25)";

const styles = stylex.create({
  grid: {
    display: "grid",
    gap: "1px",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.md]: "repeat(2, minmax(0, 1fr))",
    },
    backgroundColor: GOLD_LINE,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: GOLD_LINE,
  },
  /*
   * The 1px grid gap is painted by the grid's gold background, so both cells
   * fill their track edge to edge.
   */
  cell: {
    blockSize: "100%",
  },
  panel: {
    blockSize: "100%",
    backgroundColor: "#013405",
    paddingBlock: "clamp(40px, 5vw, 60px)",
    paddingInline: "clamp(24px, 4.4vw, 52px)",
  },
  label: {
    marginBlockEnd: "22px",
  },
  statement: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: 500,
    fontSize: "clamp(24px, 2.7vw, 30px)",
    lineHeight: 1.4,
  },
  srOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    margin: "-1px",
    padding: 0,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
  },
});

export const VisionMission = ({
  vision = VISION_STATEMENT,
  mission = MISSION_STATEMENT,
}: {
  vision?: string;
  mission?: string;
}) => (
  <DcSection id="vision" labelledBy="vision-title" tone="greenGradient">
    <DcInner narrow>
      <h2 id="vision-title" {...stylex.props(styles.srOnly)}>
        Vision &amp; Mission
      </h2>
      <div {...stylex.props(styles.grid)}>
        <Reveal direction="up" style={styles.cell}>
          <div {...stylex.props(styles.panel)}>
            <DcEyebrow gold style={styles.label}>
              Vision
            </DcEyebrow>
            <p {...stylex.props(styles.statement)}>{vision}</p>
          </div>
        </Reveal>
        <Reveal delay={1} direction="up" style={styles.cell}>
          <div {...stylex.props(styles.panel)}>
            <DcEyebrow gold style={styles.label}>
              Mission
            </DcEyebrow>
            <p {...stylex.props(styles.statement)}>{mission}</p>
          </div>
        </Reveal>
      </div>
    </DcInner>
  </DcSection>
);
