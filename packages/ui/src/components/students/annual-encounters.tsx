import * as stylex from "@stylexjs/stylex";

import {
  ENCOUNTERS,
  ENCOUNTERS_EYEBROW,
  ENCOUNTERS_HEADING,
  ENCOUNTERS_INTRO,
} from "../../content/students";
import type { Encounter } from "../../content/students";
import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";
import { DcEyebrow, DcHeading, DcInner, DcSection } from "../home/dc";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "24px",
    marginBlockEnd: "clamp(36px, 5vw, 52px)",
  },
  heading: {
    lineHeight: 1.05,
  },
  intro: {
    margin: 0,
    maxWidth: "44ch",
    fontSize: "15px",
    lineHeight: 1.65,
    color: "rgba(255, 248, 231, 0.75)",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    margin: 0,
    padding: 0,
    listStyle: "none",
    borderBlockStartWidth: "1px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: "rgba(255, 178, 3, 0.4)",
  },
  row: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.lg]: "120px minmax(0, 1.2fr) minmax(0, 1fr)",
    },
    gap: {
      default: "10px",
      [bp.lg]: "28px",
    },
    alignItems: "baseline",
    paddingBlock: "26px",
    borderBlockEndWidth: "1px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "rgba(255, 248, 231, 0.14)",
  },
  sport: {
    fontSize: "11px",
    letterSpacing: "0.22em",
    fontWeight: 700,
    color: "#FFB203",
    textTransform: "uppercase",
  },
  titles: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: "28px",
    lineHeight: 1.15,
  },
  vs: {
    fontSize: "14px",
    fontWeight: 600,
    color: "rgba(255, 248, 231, 0.85)",
  },
  note: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.6,
    color: "rgba(255, 248, 231, 0.72)",
    textWrap: "pretty",
  },
});

/** The College's big fixtures: sport, name, opponent and a line of history. */
export const AnnualEncounters = ({
  encounters = ENCOUNTERS,
}: {
  encounters?: readonly Encounter[];
}) => (
  <DcSection id="encounters" labelledBy="encounters-title" tone="green">
    <DcInner>
      <div {...stylex.props(styles.header)}>
        <div>
          <DcEyebrow gold>{ENCOUNTERS_EYEBROW}</DcEyebrow>
          <DcHeading id="encounters-title" style={styles.heading}>
            {ENCOUNTERS_HEADING}
          </DcHeading>
        </div>
        <p {...stylex.props(styles.intro)}>{ENCOUNTERS_INTRO}</p>
      </div>
      <ul {...stylex.props(styles.list)}>
        {encounters.map((encounter) => (
          <li key={encounter.title}>
            <Reveal direction="up">
              <div {...stylex.props(styles.row)}>
                <span {...stylex.props(styles.sport)}>{encounter.sport}</span>
                <div {...stylex.props(styles.titles)}>
                  <h3 {...stylex.props(styles.title)}>{encounter.title}</h3>
                  <span {...stylex.props(styles.vs)}>{encounter.vs}</span>
                </div>
                <p {...stylex.props(styles.note)}>{encounter.note}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </DcInner>
  </DcSection>
);
