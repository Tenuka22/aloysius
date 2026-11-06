import * as stylex from "@stylexjs/stylex";

import {
  ALUMNI_NOTABLES,
  ALUMNI_NOTABLES_EYEBROW,
  ALUMNI_NOTABLES_TITLE,
  ALUMNI_ROLL,
} from "../../content/alumni";
import type {
  DistinguishedAloysian,
  NotableAlumnus,
} from "../../content/alumni";
import { bp } from "../../tokens/breakpoints.stylex";
import { DcEyebrow, DcHeading, DcInner, DcSection, DcSlot } from "../home/dc";
import type { ImageSource } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

/** Portraits from the CMS Hall of Fame, keyed by lower-cased name. */
export type NotablePortraits = Readonly<Record<string, ImageSource>>;

/*
 * Measurements are the approved design's (Alumni.dc.html): a 120px section on
 * a black-to-green diagonal, four 260px portraits, then a ruled list of the
 * wider roll set in auto-filled 340px columns.
 */
const styles = stylex.create({
  backdrop: {
    position: "absolute",
    inset: 0,
    backgroundImage: "linear-gradient(135deg, #000000, #013405)",
    pointerEvents: "none",
  },
  heading: {
    marginBlockEnd: "clamp(36px, 5vw, 60px)",
  },
  grid: {
    display: "grid",
    gap: "28px",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      [bp.xl]: "repeat(4, minmax(0, 1fr))",
    },
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  card: {
    minWidth: 0,
  },
  portrait: {
    width: "100%",
    height: "260px",
  },
  name: {
    margin: 0,
    marginBlock: "16px 4px",
    fontWeight: 700,
    fontSize: "16px",
  },
  field: {
    margin: 0,
    fontSize: "12px",
    letterSpacing: "0.12em",
    color: "#FFB203",
    textTransform: "uppercase",
  },
  note: {
    margin: 0,
    marginBlockStart: "8px",
    fontSize: "13px",
    lineHeight: 1.55,
    color: "rgba(255, 248, 231, 0.75)",
  },
  roll: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
    columnGap: "40px",
    rowGap: 0,
    marginBlockStart: "clamp(48px, 7vw, 72px)",
    marginBlockEnd: 0,
    marginInline: 0,
    padding: 0,
    listStyle: "none",
    borderBlockStartWidth: "1px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: "rgba(255, 178, 3, 0.35)",
  },
  rollItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    paddingBlock: "16px",
    borderBlockEndWidth: "1px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "rgba(255, 248, 231, 0.12)",
  },
  rollName: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    color: "#FFF8E7",
  },
  rollNote: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.5,
    color: "rgba(255, 248, 231, 0.72)",
  },
});

/** The Hall of Fame: four portraits, then the wider roll of notable Aloysians. */
export const Distinguished = ({
  portraits,
  featured = ALUMNI_NOTABLES,
  roll = ALUMNI_ROLL,
}: {
  portraits?: NotablePortraits;
  featured?: readonly DistinguishedAloysian[];
  roll?: readonly NotableAlumnus[];
}) => (
  <DcSection id="distinguished" labelledBy="distinguished-title" tone="black">
    <div aria-hidden="true" {...stylex.props(styles.backdrop)} />
    <DcInner>
      <DcEyebrow gold>{ALUMNI_NOTABLES_EYEBROW}</DcEyebrow>
      <DcHeading id="distinguished-title" style={styles.heading}>
        {ALUMNI_NOTABLES_TITLE}
      </DcHeading>

      <ul {...stylex.props(styles.grid)}>
        {featured.map((person, index) => (
          <li key={person.id} {...stylex.props(styles.card)}>
            <Reveal delay={Math.min(index, 2) as 0 | 1 | 2} direction="up">
              <DcSlot
                inverse
                placeholder="Portrait"
                source={portraits?.[person.name.toLowerCase()]}
                style={styles.portrait}
              />
              <h3 {...stylex.props(styles.name)}>{person.name}</h3>
              <p {...stylex.props(styles.field)}>{person.field}</p>
              <p {...stylex.props(styles.note)}>{person.note}</p>
            </Reveal>
          </li>
        ))}
      </ul>

      <ul {...stylex.props(styles.roll)}>
        {roll.map((alumnus) => (
          <li key={alumnus.name} {...stylex.props(styles.rollItem)}>
            <p {...stylex.props(styles.rollName)}>{alumnus.name}</p>
            <p {...stylex.props(styles.rollNote)}>{alumnus.note}</p>
          </li>
        ))}
      </ul>
    </DcInner>
  </DcSection>
);
