import * as stylex from "@stylexjs/stylex";

import type { AcademicHead } from "../../content/people";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Eyebrow, Heading, Section } from "../primitives/layout";
import { Media } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const NO_HEADS: readonly AcademicHead[] = [];

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
  grid: {
    display: "grid",
    gap: space.lg,
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      [bp.md]: "repeat(3, minmax(0, 1fr))",
      [bp.xl]: "repeat(4, minmax(0, 1fr))",
    },
  },
  card: {
    minWidth: 0,
  },
  role: {
    /*
     * The role leads the card, the name follows it.
     *
     * Reversed from the old Administration grid, which printed the name above
     * the role. Here the role is the thing being scanned - "Head of Physics",
     * "Head of Mathematics" - and the name is the answer to it, so a visitor
     * looking for the physics department reads down the roles, not the names.
     */
    margin: 0,
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  name: {
    margin: 0,
    marginBlockStart: space.xs,
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.sizeLg,
    lineHeight: font.leadingSnug,
    color: color.onInverse,
  },
  bio: {
    margin: 0,
    marginBlockStart: space["2xs"],
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseMuted,
    textWrap: "pretty",
  },
});

/**
 * Who leads each part of the College.
 *
 * A dynamic CMS roster (`cms.listAcademicHeads`, edited at
 * `/cms/academic-heads`) rather than a fixed set of block fields, because the
 * number of heads is the College's to decide: adding the Head of Commerce is a
 * row an editor adds, not a deploy.
 *
 * Renders nothing at all when there are no heads, rather than an empty state
 * paragraph: an unpopulated roster is a content gap, and a section that says
 * "profiles will be published here soon" under the Principal's message reads as
 * a broken page.
 */
export const AcademicHeads = ({
  heads = NO_HEADS,
}: {
  heads?: readonly AcademicHead[];
}) => {
  if (heads.length === 0) {
    return null;
  }

  return (
    <Section
      id="academic-heads"
      labelledBy="academic-heads-title"
      tone="inverse"
    >
      <Container>
        <Eyebrow inverse>Academics</Eyebrow>
        <Heading
          id="academic-heads-title"
          style={[styles.heading, styles.headingSpacing]}
        >
          Head of Academics
        </Heading>
        <ul {...stylex.props(styles.grid)}>
          {heads.map((head) => (
            <Reveal direction="up" key={head.id}>
              <li {...stylex.props(styles.card)}>
                <Media placeholder="Portrait" ratio="4:5" source={head.image} />
                {head.role ? (
                  <p {...stylex.props(styles.role)}>{head.role}</p>
                ) : null}
                <p {...stylex.props(styles.name)}>{head.name}</p>
                {head.bio ? (
                  <p {...stylex.props(styles.bio)}>{head.bio}</p>
                ) : null}
              </li>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
};
