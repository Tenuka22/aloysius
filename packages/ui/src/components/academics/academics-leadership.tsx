import * as stylex from "@stylexjs/stylex";

import type { ImageSource } from "../../components/primitives/media";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Eyebrow, Heading, Section } from "../primitives/layout";
import { Media } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

export interface AcademicsLeader {
  role: string;
  name?: string;
  title?: string;
  photo?: ImageSource;
}

const styles = stylex.create({
  grid: {
    display: "grid",
    gap: space.lg,
    marginBlockStart: space["2xl"],
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 16rem), 1fr))",
  },
  card: {
    display: "flex",
    flexDirection: "column",
  },
  role: {
    margin: 0,
    marginBlockStart: space.sm,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  name: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    color: color.onSurface,
  },
  title: {
    margin: 0,
    marginBlockStart: "0.1rem",
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
});

/**
 * The Principal, the Primary Section's sectional head and the Secondary
 * Section's deputy principal, side by side.
 *
 * The Principal's own name/title/photo are not a prop here specific to this
 * section - the caller passes the same `principalContent()` result every
 * other page reads, so there is exactly one photo of the Principal in the
 * system, not a second upload slot that can drift out of sync with it.
 */
export const AcademicsLeadership = ({
  leaders,
}: {
  leaders: readonly AcademicsLeader[];
}) => (
  <Section id="leadership" labelledBy="leadership-title" tone="surface">
    <Container>
      <Eyebrow>Leadership</Eyebrow>
      <Heading id="leadership-title" level={2}>
        Section Leadership
      </Heading>

      <div {...stylex.props(styles.grid)}>
        {leaders.map((leader, index) => (
          <Reveal
            delay={Math.min(index, 2) as 0 | 1 | 2}
            direction="up"
            key={leader.role}
          >
            <div {...stylex.props(styles.card)}>
              <Media
                placeholder={leader.name ?? leader.role}
                ratio="4:5"
                source={leader.photo}
              />
              <p {...stylex.props(styles.role)}>{leader.role}</p>
              <p {...stylex.props(styles.name)}>{leader.name ?? "\u2014"}</p>
              {leader.title && (
                <p {...stylex.props(styles.title)}>{leader.title}</p>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </Container>
  </Section>
);
