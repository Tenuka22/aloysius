import * as stylex from "@stylexjs/stylex";

import { DEPARTMENTS, STATS } from "../../content/home";
import type { Department, Stat } from "../../content/home";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import { ArrowLink } from "../primitives/button";
import {
  Container,
  Eyebrow,
  Heading,
  Section,
  SectionHeader,
} from "../primitives/layout";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  /*
   * `auto-fit` + `minmax` instead of the design's hard `repeat(4, 1fr)`: one
   * column at 320px, two on a large phone, four on a laptop, and it keeps
   * filling sensibly on an ultra-wide monitor without another breakpoint.
   */
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15rem), 1fr))",
    // 1px gap over a bordered container is what draws the hairline rules.
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
    padding: space.md,
    backgroundColor: {
      default: color.surfaceInverse,
      ":hover": color.surfaceInverseDeep,
    },
    transitionProperty: "background-color",
    transitionDuration: motionToken.base,
  },
  cardIndex: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: 1,
    color: color.accentOnInverse,
  },
  cardTitle: {
    margin: 0,
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
    color: color.onInverse,
  },
  cardBody: {
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseSubtle,
  },

  stats: {
    display: "grid",
    margin: 0,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 11rem), 1fr))",
    gap: space.lg,
    marginBlockStart: space["2xl"],
  },
  stat: {
    display: "flex",
    flexDirection: "column-reverse",
    gap: space["3xs"],
  },
  statValue: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: 1,
    color: color.accentOnInverse,
  },
  statPending: {
    fontSize: font.sizeLg,
    color: color.onInverseSubtle,
  },
  statLabel: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightSemibold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onInverseMuted,
  },
  heading: {
    color: color.onInverse,
  },
  action: {
    // Keeps the "All departments" link aligned with the heading baseline on
    // wide screens and on its own row below 40rem.
    flexShrink: 0,
  },
});

export const Academics = ({
  departments = DEPARTMENTS,
  stats = STATS,
  allHref = "/academics",
}: {
  departments?: readonly Department[];
  stats?: readonly Stat[];
  allHref?: string;
}) => (
  <Section id="academics" labelledBy="academics-title" tone="inverseGradient">
    <Container>
      <SectionHeader
        action={
          <span {...stylex.props(styles.action)}>
            <ArrowLink href={allHref} inverse>
              All departments
            </ArrowLink>
          </span>
        }
      >
        <Eyebrow inverse>Academics</Eyebrow>
        <Heading id="academics-title" level={2} style={styles.heading}>
          Academic Excellence
        </Heading>
      </SectionHeader>

      <Reveal direction="up">
        <ul {...stylex.props(styles.grid)}>
          {departments.map((department) => (
            <li key={department.id} {...stylex.props(styles.card)}>
              <p {...stylex.props(styles.cardIndex)}>{department.index}</p>
              <h3 {...stylex.props(styles.cardTitle)}>{department.name}</h3>
              <p {...stylex.props(styles.cardBody)}>{department.description}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={1} direction="up">
        <dl {...stylex.props(styles.stats)}>
          {stats.map((stat) => (
            <div key={stat.id} {...stylex.props(styles.stat)}>
              <dt {...stylex.props(styles.statLabel)}>{stat.label}</dt>
              <dd
                {...stylex.props(
                  styles.statValue,
                  !stat.value && styles.statPending
                )}
              >
                {stat.value ?? "—"}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </Container>
  </Section>
);
