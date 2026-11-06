import * as stylex from "@stylexjs/stylex";

import {
  HOUSES,
  HOUSES_EYEBROW,
  HOUSES_HEADING,
  HOUSES_INTRO,
} from "../../content/students";
import type { House } from "../../content/students";
import { font } from "../../tokens/tokens.stylex";
import { DcEyebrow, DcHeading, DcInner, DcSection } from "../home/dc";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  heading: {
    marginBlockEnd: "18px",
  },
  intro: {
    margin: 0,
    marginBlockEnd: "clamp(36px, 5vw, 56px)",
    maxWidth: "62ch",
    fontSize: "16px",
    lineHeight: 1.7,
    color: "rgba(1, 52, 5, 0.75)",
    textWrap: "pretty",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
    gap: "20px",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  cell: {
    blockSize: "100%",
  },
  card: {
    blockSize: "100%",
    paddingBlock: "44px",
    paddingInline: "24px",
    textAlign: "center",
    backgroundColor: "#FFF8E7",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(1, 52, 5, 0.15)",
  },
  swatch: (backgroundColor: string) => ({
    inlineSize: "54px",
    blockSize: "54px",
    marginBlockStart: 0,
    marginBlockEnd: "20px",
    marginInline: "auto",
    transform: "rotate(45deg)",
    backgroundColor,
  }),
  name: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "28px",
    fontWeight: 600,
  },
  colour: {
    margin: 0,
    marginBlockStart: "8px",
    fontSize: "11px",
    letterSpacing: "0.16em",
    color: "rgba(1, 52, 5, 0.72)",
    textTransform: "uppercase",
  },
});

/** The College's five houses, each with its colour as a diamond. */
export const HouseSystem = ({
  houses = HOUSES,
}: {
  houses?: readonly House[];
}) => (
  <DcSection id="houses" labelledBy="houses-title" tone="raised">
    <DcInner>
      <DcEyebrow>{HOUSES_EYEBROW}</DcEyebrow>
      <DcHeading id="houses-title" style={styles.heading}>
        {HOUSES_HEADING}
      </DcHeading>
      <p {...stylex.props(styles.intro)}>{HOUSES_INTRO}</p>
      <ul {...stylex.props(styles.grid)}>
        {houses.map((house, index) => (
          <li key={house.id} {...stylex.props(styles.cell)}>
            <Reveal
              delay={Math.min(index, 2) as 0 | 1 | 2}
              direction="up"
              style={styles.cell}
            >
              <div {...stylex.props(styles.card)}>
                <div
                  aria-hidden="true"
                  {...stylex.props(styles.swatch(house.color))}
                />
                <h3 {...stylex.props(styles.name)}>{house.name}</h3>
                <p {...stylex.props(styles.colour)}>{house.colorName}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </DcInner>
  </DcSection>
);
