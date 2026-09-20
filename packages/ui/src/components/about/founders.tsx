import * as stylex from "@stylexjs/stylex";

import type { Founder } from "../../content/about";
import {
  FOUNDERS,
  FOUNDERS_EYEBROW,
  FOUNDERS_HEADING,
} from "../../content/about";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Eyebrow, Heading, Section } from "../primitives/layout";
import { Media } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  headingSpacing: {
    marginBlock: `${space.sm} ${space.xl}`,
  },
  grid: {
    display: "grid",
    gap: space.xl,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.md]: "repeat(2, minmax(0, 1fr))",
    },
  },
  photo: {
    marginBlockEnd: space.md,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderAccent,
  },
  name: {
    margin: 0,
    marginBlockEnd: space["2xs"],
    fontWeight: font.weightBold,
    fontSize: font.sizeLg,
    color: color.onSurface,
  },
  body: {
    margin: 0,
    fontSize: font.sizeMd,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
  },
});

export const Founders = ({
  eyebrow = FOUNDERS_EYEBROW,
  heading = FOUNDERS_HEADING,
  founders = FOUNDERS,
}: {
  eyebrow?: string;
  heading?: string;
  founders?: readonly Founder[];
}) => (
  <Section labelledBy="founders-title" tone="raised">
    <Container>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading id="founders-title" style={styles.headingSpacing}>
        {heading}
      </Heading>
      <div {...stylex.props(styles.grid)}>
        {founders.map((founder, index) => (
          <Reveal delay={index === 0 ? 0 : 1} direction="up" key={founder.name}>
            <div>
              <Media
                placeholder="Archive photo"
                ratio="4:5"
                source={founder.image}
                style={styles.photo}
              />
              <h3 {...stylex.props(styles.name)}>{founder.name}</h3>
              <p {...stylex.props(styles.body)}>{founder.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Container>
  </Section>
);
