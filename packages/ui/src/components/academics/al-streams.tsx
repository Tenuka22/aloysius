import * as stylex from "@stylexjs/stylex";

import { AL_STREAMS } from "../../content/academics";
import type { Stream } from "../../content/academics";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import { Container, Eyebrow, Heading, Section } from "../primitives/layout";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  /*
   * The hairline rules between cells are drawn by a 1px grid gap over the
   * container's gold background rather than per-cell borders - that way the
   * lines never double up where two cells meet, at any column count.
   */
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    marginBlockStart: space["2xl"],
    padding: 0,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 14rem), 1fr))",
    gap: space.px,
    backgroundColor: color.borderAccent,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderAccent,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: space["2xs"],
    blockSize: "100%",
    padding: space.lg,
    backgroundColor: {
      default: color.surfaceInverse,
      ":hover": color.surfaceInverseDeep,
    },
    transitionProperty: "background-color",
    transitionDuration: motionToken.base,
  },
  index: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: 1,
    color: color.accentOnInverse,
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
  heading: {
    color: color.onInverse,
  },
  cell: {
    blockSize: "100%",
  },
});

export const AlStreams = ({
  streams = AL_STREAMS,
}: {
  streams?: readonly Stream[];
}) => (
  <Section id="streams" labelledBy="streams-title" tone="inverseGradient">
    <Container>
      <Eyebrow inverse>Advanced Level</Eyebrow>
      <Heading id="streams-title" level={2} style={styles.heading}>
        A/L Streams
      </Heading>

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
    </Container>
  </Section>
);
