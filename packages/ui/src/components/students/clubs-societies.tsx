import * as stylex from "@stylexjs/stylex";

import {
  CLUBS,
  CLUBS_EYEBROW,
  CLUBS_HEADING,
  CLUBS_INTRO,
} from "../../content/students";
import type { Club } from "../../content/students";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import {
  Container,
  Eyebrow,
  Heading,
  Lead,
  Section,
} from "../primitives/layout";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  /*
   * The hairline rules between cells are drawn by a 1px grid gap over the
   * container's gold background rather than per-cell borders - that way the
   * lines never double up where two cells meet, at any column count.
   *
   * `auto-fit` + `minmax` rather than the mock's hard `repeat(4, 1fr)`, which
   * gives each of these eight cells ~56px at 320px. `min(100%, 15rem)` is what
   * stops the track floor exceeding the container on a narrow phone.
   */
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    marginBlockStart: space["2xl"],
    padding: 0,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15rem), 1fr))",
    gap: space.px,
    backgroundColor: color.borderAccent,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderAccent,
  },
  cell: {
    blockSize: "100%",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: space["3xs"],
    justifyContent: "center",
    blockSize: "100%",
    // Keeps every cell a comfortable band on touch displays and smart boards
    // even where a club has no description yet.
    minBlockSize: "5.5rem",
    padding: space.lg,
    backgroundColor: {
      default: color.surfaceInverse,
      ":hover": color.surfaceInverseDeep,
    },
    transitionProperty: "background-color",
    transitionDuration: motionToken.base,
  },
  name: {
    margin: 0,
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
    color: color.onInverse,
    textWrap: "balance",
  },
  description: {
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseSubtle,
    textWrap: "pretty",
  },
  // `Heading` and `Lead` both reset their margins, so the gap between them is
  // the caller's to supply.
  heading: {
    color: color.onInverse,
    marginBlockEnd: space.sm,
  },
});

export const ClubsSocieties = ({
  clubs = CLUBS,
}: {
  clubs?: readonly Club[];
}) => (
  <Section id="clubs" labelledBy="clubs-title" tone="inverseGradient">
    <Container>
      <Eyebrow inverse>{CLUBS_EYEBROW}</Eyebrow>
      <Heading id="clubs-title" level={2} style={styles.heading}>
        {CLUBS_HEADING}
      </Heading>
      <Lead inverse>{CLUBS_INTRO}</Lead>

      <ul {...stylex.props(styles.grid)}>
        {clubs.map((club) => (
          <li key={club.id} {...stylex.props(styles.cell)}>
            <Reveal direction="up" style={styles.cell}>
              <div {...stylex.props(styles.card)}>
                <h3 {...stylex.props(styles.name)}>{club.name}</h3>
                {/*
                  No filler when the society has not published what it does:
                  an empty slot is honest, `[CMS: description]` is not.
                */}
                {club.description ? (
                  <p {...stylex.props(styles.description)}>
                    {club.description}
                  </p>
                ) : null}
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </Container>
  </Section>
);
