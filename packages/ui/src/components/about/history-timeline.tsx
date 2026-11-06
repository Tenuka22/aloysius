import * as stylex from "@stylexjs/stylex";

import type { TimelineEntry } from "../../content/about";
import { HISTORY_HEADING, TIMELINE } from "../../content/about";
import { bp } from "../../tokens/breakpoints.stylex";
import { DcEyebrow, DcHeading, DcInner, DcSection, DcSlot } from "../home/dc";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  heading: {
    marginBlockEnd: "clamp(36px, 6vw, 70px)",
  },
  row: {
    display: "grid",
    columnGap: {
      default: "20px",
      [bp.md]: "44px",
    },
    rowGap: "20px",
    gridTemplateColumns: {
      default: "max-content 2px minmax(0, 1fr)",
      [bp.xl]: "180px 2px minmax(0, 1fr) minmax(0, 320px)",
    },
    alignItems: "start",
    paddingBlock: "44px",
    borderBlockEndWidth: "1px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "rgba(1, 52, 5, 0.1)",
  },
  /*
   * In the design the year sits in a 46px gold serif box, but its label is a
   * 16px muted monospace span inside it - that is what renders, so that is
   * what is set here.
   */
  year: {
    margin: 0,
    gridColumn: {
      default: "1",
      [bp.xl]: "auto",
    },
    gridRow: {
      default: "1",
      [bp.xl]: "auto",
    },
    fontFamily: "ui-monospace, monospace",
    fontSize: "16px",
    lineHeight: 1,
    color: "rgba(1, 52, 5, 0.66)",
  },
  rule: {
    gridColumn: {
      default: "2",
      [bp.xl]: "auto",
    },
    alignSelf: "stretch",
    minHeight: "80px",
    backgroundColor: "#FFB203",
    gridRow: {
      default: "1 / span 2",
      [bp.xl]: "auto",
    },
  },
  copy: {
    gridColumn: {
      default: "3",
      [bp.xl]: "auto",
    },
    gridRow: {
      default: "1",
      [bp.xl]: "auto",
    },
  },
  entryTitle: {
    margin: 0,
    marginBlockEnd: "10px",
    fontWeight: 700,
    fontSize: "19px",
  },
  entryBody: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.7,
    color: "rgba(1, 52, 5, 0.75)",
  },
  image: {
    gridColumn: {
      default: "3",
      [bp.xl]: "auto",
    },
    gridRow: {
      default: "2",
      [bp.xl]: "auto",
    },
    width: "100%",
    maxWidth: {
      default: "28rem",
      [bp.xl]: "none",
    },
    height: "170px",
  },
});

export const HistoryTimeline = ({
  heading = HISTORY_HEADING,
  entries = TIMELINE,
}: {
  heading?: string;
  entries?: readonly TimelineEntry[];
}) => (
  <DcSection id="history" labelledBy="history-title" tone="cream">
    <DcInner>
      <DcEyebrow>History</DcEyebrow>
      <DcHeading id="history-title" style={styles.heading}>
        {heading}
      </DcHeading>
      <div>
        {entries.map((entry) => (
          <Reveal delay={0} direction="up" key={entry.year + entry.title}>
            <div {...stylex.props(styles.row)}>
              <p {...stylex.props(styles.year)}>{entry.year}</p>
              <div aria-hidden="true" {...stylex.props(styles.rule)} />
              <div {...stylex.props(styles.copy)}>
                <h3 {...stylex.props(styles.entryTitle)}>{entry.title}</h3>
                <p {...stylex.props(styles.entryBody)}>{entry.body}</p>
              </div>
              <DcSlot
                placeholder="Archive photo"
                source={entry.image}
                style={styles.image}
              />
            </div>
          </Reveal>
        ))}
      </div>
    </DcInner>
  </DcSection>
);
