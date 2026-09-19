import * as stylex from "@stylexjs/stylex";

import { MISSION_STATEMENT, VISION_STATEMENT } from "../../content/about";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Eyebrow, Section } from "../primitives/layout";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  grid: {
    display: "grid",
    gap: "1px",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.md]: "repeat(2, minmax(0, 1fr))",
    },
    backgroundColor: color.borderAccent,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderAccent,
  },
  /*
   * The 1px grid gap is painted by the grid's gold background, so both cells
   * have to fill their track edge to edge. Without these two `100%` heights
   * the shorter statement leaves a gold slab under it once the two columns
   * are side by side.
   */
  cell: {
    blockSize: "100%",
  },
  panel: {
    blockSize: "100%",
    backgroundColor: color.surfaceInverse,
    paddingBlock: space.xl,
    paddingInline: {
      default: space.md,
      [bp.md]: space.xl,
    },
  },
  /**
   * The section needs an accessible name but not a visible one - `hidden`
   * dropped the heading out of the document outline entirely, so the page's
   * h1-h2 sequence skipped this section for screen-reader heading navigation.
   */
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
  statement: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: font.weightMedium,
    fontSize: font.size2xl,
    lineHeight: font.leadingSnug,
    color: color.onInverse,
    textWrap: "pretty",
  },
});

export const VisionMission = ({
  vision = VISION_STATEMENT,
  mission = MISSION_STATEMENT,
}: {
  vision?: string;
  mission?: string;
}) => (
  <Section id="vision" labelledBy="vision-title" tone="inverseGradient">
    <Container>
      <h2 id="vision-title" {...stylex.props(styles.srOnly)}>
        Vision &amp; Mission
      </h2>
      <div {...stylex.props(styles.grid)}>
        <Reveal direction="up" style={styles.cell}>
          <div {...stylex.props(styles.panel)}>
            <Eyebrow inverse>Vision</Eyebrow>
            <p {...stylex.props(styles.statement)}>{vision}</p>
          </div>
        </Reveal>
        <Reveal delay={1} direction="up" style={styles.cell}>
          <div {...stylex.props(styles.panel)}>
            <Eyebrow inverse>Mission</Eyebrow>
            <p {...stylex.props(styles.statement)}>{mission}</p>
          </div>
        </Reveal>
      </div>
    </Container>
  </Section>
);
