import * as stylex from "@stylexjs/stylex";

import type { LeadershipPerson } from "../../content/people";
import { bp } from "../../tokens/breakpoints.stylex";
import { DcEyebrow, DcHeading, DcInner, DcSection, DcSlot } from "../home/dc";
import { Reveal } from "../primitives/reveal";

const NO_PEOPLE: readonly LeadershipPerson[] = [];

const styles = stylex.create({
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
    height: "280px",
  },
  name: {
    margin: 0,
    marginBlock: "18px 4px",
    fontWeight: 700,
    fontSize: "16px",
  },
  role: {
    margin: 0,
    fontSize: "12px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#FFB203",
  },
});

/**
 * The people who lead the College: the Principal first, then the Vice
 * Principals and Sectional Heads from the CMS roster. Renders nothing when
 * there is nobody to show.
 */
export const Administration = ({
  people = NO_PEOPLE,
}: {
  people?: readonly LeadershipPerson[];
}) => {
  if (people.length === 0) {
    return null;
  }

  return (
    <DcSection
      id="administration"
      labelledBy="administration-title"
      tone="green"
    >
      <DcInner>
        <DcEyebrow gold>Administration</DcEyebrow>
        <DcHeading id="administration-title" style={styles.heading}>
          College Leadership
        </DcHeading>
        <ul {...stylex.props(styles.grid)}>
          {people.map((person) => (
            <Reveal direction="up" key={person.id}>
              <li {...stylex.props(styles.card)}>
                <DcSlot
                  inverse
                  placeholder="Portrait"
                  source={person.image}
                  style={styles.portrait}
                />
                <p {...stylex.props(styles.name)}>{person.name}</p>
                {person.role ? (
                  <p {...stylex.props(styles.role)}>{person.role}</p>
                ) : null}
              </li>
            </Reveal>
          ))}
        </ul>
      </DcInner>
    </DcSection>
  );
};
