import * as stylex from "@stylexjs/stylex";

import type { LeadershipMember } from "../../content/about";
import { ADMINISTRATION_HEADING } from "../../content/about";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Eyebrow, Heading, Section } from "../primitives/layout";
import { Media } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const NO_MEMBERS: readonly LeadershipMember[] = [];

const styles = stylex.create({
  heading: {
    color: color.onInverse,
  },
  headingSpacing: {
    marginBlock: `${space.sm} ${space.xl}`,
  },
  empty: {
    margin: 0,
    fontSize: font.sizeMd,
    color: color.onInverseSubtle,
  },
  yearGroup: {
    marginBlockEnd: space.xl,
  },
  yearLabel: {
    margin: 0,
    marginBlockEnd: space.md,
    paddingBlockEnd: space.sm,
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.accentOnInverse,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.borderInverse,
  },
  grid: {
    display: "grid",
    gap: space.lg,
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      [bp.md]: "repeat(3, minmax(0, 1fr))",
      [bp.xl]: "repeat(4, minmax(0, 1fr))",
    },
  },
  name: {
    margin: 0,
    marginBlockStart: space.sm,
    fontWeight: font.weightBold,
    fontSize: font.sizeMd,
    color: color.onInverse,
  },
  role: {
    margin: 0,
    fontSize: font.sizeXs,
    letterSpacing: font.trackingWide,
    color: color.accentOnInverse,
  },
});

/**
 * The leadership roster has no public data source yet - the project's staff
 * records are admin-only HR data, not a published "who leads the college"
 * list. This degrades to an empty state rather than inventing names, the same
 * pattern `content/home.ts` uses for figures the registry has not supplied.
 */
export const Administration = ({
  members = NO_MEMBERS,
}: {
  members?: readonly LeadershipMember[];
}) => {
  const byYear = new Map<string, LeadershipMember[]>();
  for (const member of members) {
    const group = byYear.get(member.year);
    if (group) {
      group.push(member);
    } else {
      byYear.set(member.year, [member]);
    }
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- fresh array from spread, mutation is safe
  const years = [...byYear.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <Section
      id="administration"
      labelledBy="administration-title"
      tone="inverse"
    >
      <Container>
        <Eyebrow inverse>Administration</Eyebrow>
        <Heading
          id="administration-title"
          style={[styles.heading, styles.headingSpacing]}
        >
          {ADMINISTRATION_HEADING}
        </Heading>
        {years.length === 0 ? (
          <p {...stylex.props(styles.empty)}>
            Leadership profiles will be published here soon.
          </p>
        ) : (
          years.map((year) => (
            <Reveal direction="up" key={year}>
              <div {...stylex.props(styles.yearGroup)}>
                <p {...stylex.props(styles.yearLabel)}>{year}</p>
                <div {...stylex.props(styles.grid)}>
                  {(byYear.get(year) ?? []).map((member) => (
                    <div key={member.id}>
                      <Media
                        placeholder="Portrait"
                        ratio="4:5"
                        source={member.portrait}
                      />
                      <p {...stylex.props(styles.name)}>{member.name}</p>
                      <p {...stylex.props(styles.role)}>{member.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))
        )}
      </Container>
    </Section>
  );
};
