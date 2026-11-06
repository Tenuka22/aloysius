import * as stylex from "@stylexjs/stylex";

import { AL_STREAMS } from "../../content/academics";
import type { Stream } from "../../content/academics";
import { font } from "../../tokens/tokens.stylex";
import { DcEyebrow, DcHeading, DcInner, DcSection } from "../home/dc";
import { Reveal } from "../primitives/reveal";

const GOLD_LINE = "rgba(255, 178, 3, 0.2)";

const styles = stylex.create({
  heading: {
    marginBlockEnd: "clamp(36px, 5vw, 60px)",
  },
  /*
   * The hairline rules between cells are drawn by a 1px grid gap over the
   * container's gold background rather than per-cell borders, so the lines
   * never double up where two cells meet at any column count.
   */
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
    gap: "1px",
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
    paddingBlock: "36px",
    paddingInline: "28px",
    backgroundColor: {
      default: "#013405",
      ":hover": "#062B0A",
    },
  },
  index: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "38px",
    fontWeight: 600,
    color: "#FFB203",
  },
  name: {
    margin: 0,
    marginBlock: "14px 8px",
    fontSize: "17px",
    fontWeight: 700,
  },
  description: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.6,
    color: "rgba(255, 248, 231, 0.65)",
  },
});

export const AlStreams = ({
  streams = AL_STREAMS,
}: {
  streams?: readonly Stream[];
}) => (
  <DcSection id="streams" labelledBy="streams-title" tone="greenGradient">
    <DcInner>
      <DcEyebrow gold>Advanced Level</DcEyebrow>
      <DcHeading id="streams-title" style={styles.heading}>
        A/L Streams
      </DcHeading>
      <ul {...stylex.props(styles.grid)}>
        {streams.map((stream) => (
          <li key={stream.id} {...stylex.props(styles.cell)}>
            <Reveal direction="up" style={styles.cell}>
              <div {...stylex.props(styles.card)}>
                <p {...stylex.props(styles.index)}>{stream.index}</p>
                <h3 {...stylex.props(styles.name)}>{stream.name}</h3>
                <p {...stylex.props(styles.description)}>
                  {stream.description}
                </p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </DcInner>
  </DcSection>
);
