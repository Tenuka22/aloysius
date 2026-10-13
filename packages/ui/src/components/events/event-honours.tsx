import * as stylex from "@stylexjs/stylex";

import { HONOURS_HEADING, HONOURS_INTRO } from "../../content/events";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Heading, Lead, Section } from "../primitives/layout";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  list: {
    display: "grid",
    gap: space.md,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.md]: "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))",
    },
    listStyle: "none",
    margin: 0,
    marginBlockStart: space["2xl"],
    padding: 0,
  },
  entry: {
    display: "flex",
    flexDirection: "column",
    gap: space["3xs"],
    minInlineSize: 0,
    // A 2px gold rule, matching the students page's achievement cards so the
    // same kind of record looks the same wherever it appears.
    borderBlockStartWidth: "2px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.accent,
    paddingBlockStart: space.md,
  },
  /*
   * One size step below the agenda's titles. The visitor is not scanning these
   * for a date, and a heading as large as an event's would make a four-line
   * honour outrank the thing they came to find.
   */
  title: {
    margin: 0,
    fontSize: font.sizeMd,
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
    textWrap: "pretty",
  },
  detail: {
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  meta: {
    margin: 0,
    fontSize: font.sizeXs,
    letterSpacing: font.trackingWide,
    color: color.onSurfaceSubtle,
  },
});

export interface AgendaAchievement {
  id: string;
  title: string;
  detail: string | null;
  category: string | null;
  achievedOn: string | null;
}

const META_SEPARATOR = " · ";

/**
 * Category and date joined into one meta line, carrying only the fields the
 * record actually has - an achievement with no date shows its category alone
 * rather than a trailing separator.
 */
const metaLine = (achievement: AgendaAchievement): string =>
  [achievement.category, achievement.achievedOn]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(META_SEPARATOR);

export const EventHonours = ({
  achievements,
  heading = HONOURS_HEADING,
  intro = HONOURS_INTRO,
}: {
  achievements: readonly AgendaAchievement[];
  heading?: string;
  intro?: string;
}) => {
  if (achievements.length === 0) {
    return null;
  }

  return (
    <Section id="honours" labelledBy="honours-title" tone="raised">
      <Container>
        <Heading id="honours-title" level={2}>
          {heading}
        </Heading>
        <Lead>{intro}</Lead>

        <Reveal direction="up">
          <ul {...stylex.props(styles.list)}>
            {achievements.map((achievement) => {
              const meta = metaLine(achievement);

              return (
                <li
                  id={`achievement-${achievement.id}`}
                  key={achievement.id}
                  {...stylex.props(styles.entry)}
                >
                  {meta ? <p {...stylex.props(styles.meta)}>{meta}</p> : null}
                  <h3 {...stylex.props(styles.title)}>{achievement.title}</h3>
                  {achievement.detail ? (
                    <p {...stylex.props(styles.detail)}>{achievement.detail}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
};
