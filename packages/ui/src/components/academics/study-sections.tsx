import * as stylex from "@stylexjs/stylex";

import { STUDY_SECTIONS } from "../../content/academics";
import type { StudySection } from "../../content/academics";
import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";
import { DcEyebrow, DcHeading, DcInner, DcSection } from "../home/dc";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  heading: {
    marginBlockEnd: "clamp(36px, 5vw, 64px)",
  },
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gap: "28px",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.lg]: "repeat(3, minmax(0, 1fr))",
    },
  },
  cell: {
    blockSize: "100%",
  },
  card: {
    blockSize: "100%",
    paddingBlock: "40px",
    paddingInline: "34px",
    backgroundColor: "#fffdf6",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(1, 52, 5, 0.15)",
    borderBlockStartWidth: "2px",
    borderBlockStartColor: "#FFB203",
  },
  grades: {
    margin: 0,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#A51919",
  },
  name: {
    margin: 0,
    marginBlock: "14px 12px",
    fontFamily: font.display,
    fontSize: "32px",
    fontWeight: 600,
  },
  description: {
    margin: 0,
    fontSize: "14.5px",
    lineHeight: 1.7,
    color: "rgba(1, 52, 5, 0.75)",
  },
});

export const StudySections = ({
  sections = STUDY_SECTIONS,
}: {
  sections?: readonly StudySection[];
}) => (
  <DcSection id="sections" labelledBy="sections-title" tone="cream">
    <DcInner>
      <DcEyebrow>The College</DcEyebrow>
      <DcHeading id="sections-title" style={styles.heading}>
        Sections of Study
      </DcHeading>
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
    </DcInner>
  </DcSection>
);
