import * as stylex from "@stylexjs/stylex";

import { STUDY_SECTIONS } from "../../content/academics";
import type { StudySection } from "../../content/academics";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Eyebrow, Heading, Section } from "../primitives/layout";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  /*
   * `auto-fit` + `minmax` rather than the mock's hard `repeat(3, 1fr)`: one
   * column at 320px, two once there is room, three on a laptop, and it keeps
   * filling sensibly on an ultra-wide panel - no extra breakpoint needed.
   *
   * `min(100%, 18rem)` is what stops the track floor from exceeding the
   * container on a narrow phone, which is the usual cause of an `auto-fit`
   * grid overflowing horizontally.
   */
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    marginBlockStart: space["2xl"],
    padding: 0,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))",
    gap: space.md,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: space["2xs"],
    // Equal-height cards regardless of which description runs longest.
    blockSize: "100%",
    padding: space.lg,
    backgroundColor: color.surfaceRaised,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    // The gold cap from the design, as a thicker top edge on the same border.
    borderBlockStartWidth: "2px",
    borderBlockStartColor: color.accent,
  },
  grades: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    // Crimson, not gold: gold on cream is ~1.9:1 and fails AA for text.
    color: color.accentOnSurface,
  },
  name: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
    textWrap: "balance",
  },
  description: {
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  cell: {
    blockSize: "100%",
  },
});

export const StudySections = ({
  sections = STUDY_SECTIONS,
}: {
  sections?: readonly StudySection[];
}) => (
  <Section id="sections" labelledBy="sections-title" tone="surface">
    <Container>
      <Eyebrow>The college</Eyebrow>
      <Heading id="sections-title" level={2}>
        Sections of Study
      </Heading>

      <ul {...stylex.props(styles.grid)}>
        {sections.map((section, index) => (
          <li key={section.id} {...stylex.props(styles.cell)}>
            <Reveal
              delay={Math.min(index, 2) as 0 | 1 | 2}
              direction="up"
              style={styles.cell}
            >
              <div {...stylex.props(styles.card)}>
                <p {...stylex.props(styles.grades)}>{section.grades}</p>
                <h3 {...stylex.props(styles.name)}>{section.name}</h3>
                <p {...stylex.props(styles.description)}>
                  {section.description}
                </p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </Container>
  </Section>
);
