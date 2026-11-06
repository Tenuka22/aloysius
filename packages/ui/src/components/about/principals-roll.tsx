import * as stylex from "@stylexjs/stylex";

import { PRINCIPALS_ROLL } from "../../content/about";
import { DcEyebrow, DcHeading, DcInner, DcSection } from "../home/dc";

const MONO = "ui-monospace, Menlo, monospace";

const styles = stylex.create({
  section: {
    paddingBlock: "clamp(60px, 9vw, 110px)",
    borderBlockStartWidth: "1px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: "rgba(255, 178, 3, 0.2)",
    backgroundColor: "#062B0A",
  },
  header: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "24px",
    marginBlockEnd: "48px",
  },
  heading: {
    margin: 0,
  },
  count: {
    fontSize: "16px",
    color: "rgba(255, 248, 231, 0.75)",
  },
  list: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 400px), 1fr))",
    columnGap: "40px",
    rowGap: 0,
    margin: 0,
    padding: 0,
    listStyle: "none",
    borderBlockStartWidth: "1px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: "rgba(255, 178, 3, 0.35)",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "40px minmax(0, 1fr) auto",
    gap: "12px",
    alignItems: "baseline",
    paddingBlock: "18px",
    borderBlockEndWidth: "1px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "rgba(255, 248, 231, 0.12)",
  },
  no: {
    fontFamily: MONO,
    fontSize: "14px",
    color: "rgba(255, 248, 231, 0.6)",
  },
  name: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#FFF8E7",
  },
  current: {
    color: "#FFB203",
  },
  period: {
    fontFamily: MONO,
    fontSize: "15px",
    color: "rgba(255, 248, 231, 0.75)",
    whiteSpace: "nowrap",
  },
});

const FIRST_NUMBER_WIDTH = 2;

/** Every principal since 1896, oldest first, with the current term in gold. */
export const PrincipalsRoll = ({
  roll = PRINCIPALS_ROLL,
}: {
  roll?: typeof PRINCIPALS_ROLL;
}) => (
  <DcSection
    id="principals"
    labelledBy="principals-title"
    style={styles.section}
    tone="green"
  >
    <DcInner>
      <div {...stylex.props(styles.header)}>
        <div>
          <DcEyebrow gold>Since 1896</DcEyebrow>
          <DcHeading id="principals-title" style={styles.heading}>
            Roll of Principals
          </DcHeading>
        </div>
        <span {...stylex.props(styles.count)}>
          {roll.length} terms of leadership
        </span>
      </div>
      <ol {...stylex.props(styles.list)}>
        {roll.map((entry, index) => (
          <li
            key={`${entry.period}-${entry.name}`}
            {...stylex.props(styles.row)}
          >
            <span {...stylex.props(styles.no)}>
              {String(index + 1).padStart(FIRST_NUMBER_WIDTH, "0")}
            </span>
            <span
              {...stylex.props(
                styles.name,
                index === roll.length - 1 && styles.current
              )}
            >
              {entry.name}
            </span>
            <span {...stylex.props(styles.period)}>{entry.period}</span>
          </li>
        ))}
      </ol>
    </DcInner>
  </DcSection>
);
