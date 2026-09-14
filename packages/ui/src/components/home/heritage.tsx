import * as stylex from "@stylexjs/stylex";

import { FOUNDED_YEAR } from "../../content/home";
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
     */
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: "2px minmax(0, 1fr) minmax(0, 26rem)",
    },
    alignItems: "start",
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
    gap: space.sm,
    minWidth: 0,
  },
  galleryOffset: {
    // The deliberate 75%-width offset image from the design, but only once
    // there is room for it to read as intentional rather than broken.
    width: {
      default: "100%",
      [bp.md]: "75%",
    },
    alignSelf: "flex-end",
  },
});

export const Heritage = ({
  intro = "For generations, St. Aloysius' College has shaped the minds and character of young men in the Southern Province - grounded in faith, discipline and the pursuit of excellence.",
  foundedYear = FOUNDED_YEAR,
  images,
  historyHref = "/about",
}: {
  intro?: string;
  foundedYear?: number;
  images?: readonly [ImageSource?, ImageSource?];
  historyHref?: string;
}) => {
  const years = new Date().getFullYear() - foundedYear;

  return (
    <Section labelledBy="heritage-title" tone="surface">
      <Container>
        <div {...stylex.props(styles.grid)}>
          <div aria-hidden="true" {...stylex.props(styles.rule)} />

          <Reveal direction="up">
            <div {...stylex.props(styles.body)}>
              <Eyebrow>Our heritage</Eyebrow>
              <Heading
                id="heritage-title"
                level={2}
                style={styles.headingSpacing}
              >
                A Legacy of Excellence
              </Heading>
              <Lead>{intro}</Lead>

              <dl {...stylex.props(styles.stats)}>
                <div {...stylex.props(styles.stat)}>
                  <dt {...stylex.props(styles.statLabel)}>Founded in Galle</dt>
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

              <ArrowLink href={historyHref}>Explore our history</ArrowLink>
            </div>
          </Reveal>

          <Reveal delay={1} direction="up">
            <div {...stylex.props(styles.gallery)}>
              <Media
                placeholder="Archival photograph - early college years"
                ratio="4:3"
                source={images?.[0]}
                zoom
              />
              <Media
                placeholder="Galle Fort architecture detail"
                ratio="3:2"
                source={images?.[1]}
                style={styles.galleryOffset}
                zoom
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
};
