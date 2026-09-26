import * as stylex from "@stylexjs/stylex";

import { FOUNDED_YEAR } from "../../content/home";
import { aspectRatios } from "../../tokens/aspect-ratios";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { ArrowLink } from "../primitives/button";
import {
  Container,
  Eyebrow,
  Heading,
  Lead,
  Section,
} from "../primitives/layout";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  grid: {
    display: "grid",
    gap: space.xl,
    /*
     * Mobile first: one column. The gold rule is a left border on the text block
     * until 64rem, where it becomes the design's dedicated 2px column, and the
     * imagery moves from below the copy into a third column.
     *
     * The imagery track is `clamp()`ed rather than a fixed rem so the two
     * photographs keep scaling with the viewport instead of stopping dead at
     * 26rem on a 4K display - but it is deliberately bounded at both ends, since
     * widening it past ~29rem makes the image stack taller than the text column
     * and opens a hole under the copy.
     */
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: "2px minmax(0, 1fr) minmax(0, clamp(25rem, 27vw, 29rem))",
    },
    /*
     * Default `stretch` (not `start`) on purpose: every column is a flex/grid
     * child that fills the row, so the text block and the image stack share one
     * bottom baseline instead of leaving a ragged hole under the shorter one.
     */
    alignItems: "stretch",
  },
  rule: {
    display: {
      default: "none",
      [bp.xl]: "block",
    },
    minHeight: "26rem",
    height: "100%",
    backgroundImage: `linear-gradient(180deg, ${color.accent}, rgba(255, 178, 3, 0.08))`,
  },
  body: {
    display: "flex",
    flexDirection: "column",
    /*
     * Pins the "Explore our history" link to the foot of the column so it lands
     * level with the bottom of the offset photograph. Without this the shorter
     * text column stops mid-row and the space reads as a mistake rather than
     * as breathing room next to the full-height gold rule.
     */
    justifyContent: "space-between",
    height: "100%",
    minWidth: 0,
    // The rule the wide layout gets as its own column, phones get as a border.
    borderInlineStartWidth: {
      default: "2px",
      [bp.xl]: 0,
    },
    borderInlineStartStyle: "solid",
    borderInlineStartColor: color.accent,
    paddingInlineStart: {
      default: space.md,
      [bp.xl]: 0,
    },
  },
  headingSpacing: {
    marginBlock: `${space.sm} ${space.md}`,
  },
  stats: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.lg,
    marginBlock: space.xl,
  },
  stat: {
    // DOM order is <dt> then <dd> (the only valid order); the visual order the
    // design asks for - big figure above its label - comes from the reversal.
    display: "flex",
    flexDirection: "column-reverse",
    minWidth: "10rem",
  },
  statValue: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
  },
  statLabel: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightSemibold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurfaceSubtle,
  },
  gallery: {
    display: "flex",
    flexDirection: "column",
    /*
     * Both photographs are the same width, so their left and right edges line up
     * as one column. They still differ in height - 4 : 3 over 3 : 2, from
     * `aspectRatios` - so the pair reads as a primary and a secondary shot
     * rather than two identical boxes.
     *
     * `space-between` gives the same bottom baseline as the text column: at
     * every width the pair ends level with the "Explore our history" link.
     */
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: space.md,
    height: "100%",
    minWidth: 0,
  },
});

export const Heritage = ({
  intro = "For generations, St. Aloysius' College has shaped the minds and character of young men in the Southern Province - grounded in faith, discipline and the pursuit of excellence.",
  foundedYear = FOUNDED_YEAR,
  images,
  historyHref = "/about",
  eyebrow = "Our heritage",
  heading = "A Legacy of Excellence",
}: {
  intro?: string;
  foundedYear?: number;
  images?: readonly [ImageSource?, ImageSource?];
  historyHref?: string;
  eyebrow?: string;
  heading?: string;
}) => {
  const years = new Date().getFullYear() - foundedYear;

  return (
    <Section labelledBy="heritage-title" tone="surface">
      <Container>
        <div {...stylex.props(styles.grid)}>
          <div aria-hidden="true" {...stylex.props(styles.rule)} />

          <Reveal direction="up">
            <div {...stylex.props(styles.body)}>
              <div>
                <Eyebrow>{eyebrow}</Eyebrow>
                <Heading
                  id="heritage-title"
                  level={2}
                  style={styles.headingSpacing}
                >
                  {heading}
                </Heading>
                <Lead>{intro}</Lead>

                <dl {...stylex.props(styles.stats)}>
                  <div {...stylex.props(styles.stat)}>
                    <dt {...stylex.props(styles.statLabel)}>
                      Founded in Galle
                    </dt>
                    <dd {...stylex.props(styles.statValue)}>
                      Est. {foundedYear}
                    </dd>
                  </div>
                  <div {...stylex.props(styles.stat)}>
                    <dt {...stylex.props(styles.statLabel)}>
                      Of Aloysian tradition
                    </dt>
                    <dd {...stylex.props(styles.statValue)}>{years} years</dd>
                  </div>
                </dl>
              </div>

              <ArrowLink href={historyHref}>Explore our history</ArrowLink>
            </div>
          </Reveal>

          <Reveal delay={1} direction="up">
            <div {...stylex.props(styles.gallery)}>
              <Media
                placeholder="Archival photograph - early college years"
                ratio={aspectRatios.heritagePhoto}
                source={images?.[0]}
                zoom
              />
              <Media
                placeholder="Galle Fort architecture detail"
                ratio={aspectRatios.heritageDetail}
                source={images?.[1]}
                zoom
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
};
