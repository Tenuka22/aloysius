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
  panel: {
    backgroundColor: color.surfaceInverse,
    paddingBlock: space.xl,
    paddingInline: space.xl,
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
      <h2 id="vision-title" hidden>
        Vision & Mission
      </h2>
      <div {...stylex.props(styles.grid)}>
        <Reveal direction="up">
          <div {...stylex.props(styles.panel)}>
            <Eyebrow inverse>Vision</Eyebrow>
            <p {...stylex.props(styles.statement)}>{vision}</p>
          </div>
        </Reveal>
        <Reveal delay={1} direction="up">
          <div {...stylex.props(styles.panel)}>
            <Eyebrow inverse>Mission</Eyebrow>
            <p {...stylex.props(styles.statement)}>{mission}</p>
          </div>
        </Reveal>
      </div>
    </Container>
  </Section>
);
