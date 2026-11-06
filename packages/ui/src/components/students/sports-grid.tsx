import * as stylex from "@stylexjs/stylex";

import {
  MAIN_SPORTS,
  OTHER_SPORTS,
  SPORTS_EYEBROW,
  SPORTS_HEADING,
} from "../../content/students";
import { font } from "../../tokens/tokens.stylex";
import { DcEyebrow, DcHeading, DcInner, DcSection, DcSlot } from "../home/dc";
import type { ImageSource } from "../primitives/media";

const MONO = "ui-monospace, monospace";

const pad = (value: number) => String(value).padStart(2, "0");

/** Photographs keyed by lower-cased sport name, e.g. `cricket`. */
export type SportImages = Readonly<Record<string, ImageSource>>;

const styles = stylex.create({
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "24px",
    marginBlockEnd: "clamp(36px, 5vw, 56px)",
  },
  eyebrow: {
    marginBlockEnd: "18px",
  },
  heading: {
    lineHeight: 1.05,
  },
  total: {
    display: "flex",
    alignItems: "baseline",
    gap: "12px",
  },
  totalNumber: {
    fontFamily: font.display,
    fontSize: "64px",
    fontWeight: 600,
    // The design's gold on cream is 1.7:1; its own darker gold passes at this size.
    color: "#936500",
    lineHeight: 0.9,
  },
  totalLabel: {
    fontSize: "11px",
    letterSpacing: "0.2em",
    fontWeight: 700,
    color: "rgba(1, 52, 5, 0.65)",
    lineHeight: 1.4,
    textTransform: "uppercase",
  },
  label: {
    margin: 0,
    marginBlockEnd: "18px",
    fontSize: "11px",
    letterSpacing: "0.32em",
    fontWeight: 700,
    color: "rgba(1, 52, 5, 0.72)",
    textTransform: "uppercase",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
    gap: "14px",
    margin: 0,
    marginBlockEnd: "clamp(40px, 5vw, 64px)",
    padding: 0,
    listStyle: "none",
  },
  tile: {
    position: "relative",
    aspectRatio: "3 / 4",
    backgroundColor: "#013405",
    overflow: "hidden",
  },
  tilePhoto: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  },
  tileFade: {
    position: "absolute",
    insetInline: 0,
    insetBlockEnd: 0,
    height: "42%",
    backgroundImage:
      "linear-gradient(180deg, rgba(1, 52, 5, 0) 0%, rgba(1, 52, 5, 0.92) 100%)",
    pointerEvents: "none",
  },
  tileNumber: {
    position: "absolute",
    insetBlockStart: "16px",
    insetInlineStart: "16px",
    paddingBlock: "4px",
    paddingInline: "9px",
    backgroundColor: "#FFB203",
    color: "#013405",
    fontFamily: MONO,
    fontSize: "11px",
    pointerEvents: "none",
  },
  tileCaption: {
    position: "absolute",
    insetInline: "22px",
    insetBlockEnd: "22px",
    color: "#FFF8E7",
    pointerEvents: "none",
  },
  tileName: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "clamp(26px, 2.6vw, 34px)",
    fontWeight: 600,
    lineHeight: 1,
  },
  tileRule: {
    inlineSize: "32px",
    blockSize: "2px",
    marginBlockStart: "12px",
    backgroundColor: "#FFB203",
  },
  allHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "16px",
    marginBlockEnd: "18px",
  },
  allLabel: {
    margin: 0,
  },
  allCount: {
    fontSize: "12.5px",
    color: "rgba(1, 52, 5, 0.72)",
  },
  chips: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 210px), 1fr))",
    gap: "12px",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  chip: {
    display: "block",
    minWidth: 0,
    padding: "18px",
    backgroundColor: "#fffdf6",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(1, 52, 5, 0.16)",
    borderInlineStartWidth: "3px",
    borderInlineStartColor: "#FFB203",
  },
  chipNumber: {
    display: "block",
    fontFamily: MONO,
    fontSize: "10px",
    color: "rgba(1, 52, 5, 0.7)",
  },
  chipName: {
    display: "block",
    marginBlockStart: "2px",
    fontWeight: 700,
    fontSize: "15px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

/**
 * The "On the Field" section: the four main sports as photograph tiles, then
 * every other sport as a numbered chip, with the grand total beside the
 * heading. The total is counted from the two lists, never typed.
 */
export const SportsGrid = ({
  images,
  main = MAIN_SPORTS,
  others = OTHER_SPORTS,
}: {
  images?: SportImages;
  main?: readonly string[];
  others?: readonly string[];
}) => (
  <DcSection id="sports" labelledBy="sports-title" tone="cream">
    <DcInner>
      <div {...stylex.props(styles.header)}>
        <div>
          <DcEyebrow style={styles.eyebrow}>{SPORTS_EYEBROW}</DcEyebrow>
          <DcHeading id="sports-title" style={styles.heading}>
            {SPORTS_HEADING}
          </DcHeading>
        </div>
        <div {...stylex.props(styles.total)}>
          <span {...stylex.props(styles.totalNumber)}>
            {main.length + others.length}
          </span>
          <span {...stylex.props(styles.totalLabel)}>
            Sports
            <br />
            at the College
          </span>
        </div>
      </div>

      <p {...stylex.props(styles.label)}>Main sports</p>
      <ul {...stylex.props(styles.mainGrid)}>
        {main.map((name, index) => (
          <li key={name} {...stylex.props(styles.tile)}>
            <DcSlot
              inverse
              placeholder={`${name} — action photo`}
              source={images?.[name.toLowerCase()]}
              style={styles.tilePhoto}
            />
            <div aria-hidden="true" {...stylex.props(styles.tileFade)} />
            <span aria-hidden="true" {...stylex.props(styles.tileNumber)}>
              {pad(index + 1)}
            </span>
            <div {...stylex.props(styles.tileCaption)}>
              <h3 {...stylex.props(styles.tileName)}>{name}</h3>
              <div aria-hidden="true" {...stylex.props(styles.tileRule)} />
            </div>
          </li>
        ))}
      </ul>

      <div {...stylex.props(styles.allHeader)}>
        <p {...stylex.props(styles.label, styles.allLabel)}>All sports</p>
        <span {...stylex.props(styles.allCount)}>
          {others.length} more sports
        </span>
      </div>
      <ul {...stylex.props(styles.chips)}>
        {others.map((name, index) => (
          <li key={name} {...stylex.props(styles.chip)}>
            <span aria-hidden="true" {...stylex.props(styles.chipNumber)}>
              {pad(main.length + index + 1)}
            </span>
            <span {...stylex.props(styles.chipName)}>{name}</span>
          </li>
        ))}
      </ul>
    </DcInner>
  </DcSection>
);
