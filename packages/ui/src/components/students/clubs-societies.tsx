import * as stylex from "@stylexjs/stylex";

import {
  CLUBS_EYEBROW,
  CLUBS_HEADING,
  CLUB_NAMES,
} from "../../content/students";
import { bp } from "../../tokens/breakpoints.stylex";
import { DcEyebrow, DcHeading, DcInner, DcSection } from "../home/dc";
import { Reveal } from "../primitives/reveal";

const GOLD_LINE = "rgba(255, 178, 3, 0.2)";

/** Club descriptions keyed by lower-cased club name. */
export type ClubDescriptions = Readonly<Record<string, string>>;

const styles = stylex.create({
  heading: {
    marginBlockEnd: "clamp(36px, 5vw, 60px)",
  },
  /*
   * The hairline rules between cells are drawn by a 1px grid gap over the
   * container's gold background, so the lines never double up where two cells
   * meet at any column count.
   */
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.md]: "repeat(2, minmax(0, 1fr))",
      [bp.xl]: "repeat(4, minmax(0, 1fr))",
    },
    gap: "1px",
    margin: 0,
    padding: 0,
    listStyle: "none",
    backgroundColor: GOLD_LINE,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: GOLD_LINE,
  },
  cell: {
    blockSize: "100%",
  },
  card: {
    blockSize: "100%",
    paddingBlock: "30px",
    paddingInline: "26px",
    backgroundColor: "#013405",
  },
  name: {
    margin: 0,
    fontWeight: 700,
    fontSize: "16px",
  },
  description: {
    margin: 0,
    marginBlockStart: "6px",
    fontSize: "12px",
    lineHeight: 1.6,
    color: "rgba(255, 248, 231, 0.55)",
  },
});

/** The College's societies, each with its published description if it has one. */
export const ClubsSocieties = ({
  names = CLUB_NAMES,
  descriptions,
}: {
  names?: readonly string[];
  descriptions?: ClubDescriptions;
}) => (
  <DcSection id="clubs" labelledBy="clubs-title" tone="greenGradient">
    <DcInner>
      <DcEyebrow gold>{CLUBS_EYEBROW}</DcEyebrow>
      <DcHeading id="clubs-title" style={styles.heading}>
        {CLUBS_HEADING}
      </DcHeading>
      <ul {...stylex.props(styles.grid)}>
        {names.map((name) => {
          const description = descriptions?.[name.toLowerCase()];
          return (
            <li key={name} {...stylex.props(styles.cell)}>
              <Reveal direction="up" style={styles.cell}>
                <div {...stylex.props(styles.card)}>
                  <h3 {...stylex.props(styles.name)}>{name}</h3>
                  {description ? (
                    <p {...stylex.props(styles.description)}>{description}</p>
                  ) : null}
                </div>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </DcInner>
  </DcSection>
);
