import * as stylex from "@stylexjs/stylex";

import { EXAM_CARDS } from "../../content/home";
import type { ExamCard } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import { ArrowLink } from "../primitives/button";
import {
  Container,
  Eyebrow,
  Heading,
  Lead,
  Section,
  SectionHeader,
} from "../primitives/layout";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  /*
   * `auto-fit` + `minmax` instead of a hard `repeat(3, 1fr)`: one card per row
   * at 320px, two on a tablet, three on a laptop, and it keeps filling sensibly
   * on an ultra-wide monitor without another breakpoint.
   */
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gap: space.md,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 17rem), 1fr))",
  },
  item: {
    display: "flex",
  },
  card: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    inlineSize: "100%",
    overflow: "hidden",
    textDecoration: "none",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: color.borderAccent,
      ":hover": color.accent,
      ":focus-visible": color.accent,
    },
    transitionProperty: "border-color",
    transitionDuration: motionToken.base,
  },
  photo: {
    position: "relative",
  },
  scrim: {
    position: "absolute",
    insetInline: 0,
    insetBlockEnd: 0,
    blockSize: "55%",
    backgroundImage:
      "linear-gradient(180deg, rgba(1,52,5,0), rgba(1,52,5,0.95))",
    pointerEvents: "none",
  },
  mark: {
    position: "absolute",
    insetInlineStart: space.md,
    insetBlockEnd: space.sm,
    margin: 0,
    fontFamily: font.display,
    fontSize: "clamp(2.75rem, 2rem + 2vw, 3.5rem)",
    fontWeight: font.weightSemibold,
    lineHeight: 0.85,
    color: color.accentOnInverse,
    pointerEvents: "none",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: space["2xs"],
    padding: space.md,
  },
  level: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
  },
  description: {
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseMuted,
  },
  stats: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.md,
    margin: 0,
    marginBlockStart: "auto",
    paddingBlockStart: space.sm,
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.borderInverse,
  },
  stat: {
    display: "flex",
    flexDirection: "column-reverse",
    gap: space["3xs"],
  },
  statValue: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: 1,
    color: color.onInverse,
  },
  statLabel: {
    margin: 0,
    fontSize: font.size2xs,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.onInverseMuted,
  },
  cta: {
    marginBlockStart: space["2xs"],
    fontSize: font.sizeXs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  heading: {
    color: color.onInverse,
  },
  action: {
    // Keeps the "All results" link aligned with the heading baseline on wide
    // screens and on its own row below 40rem.
    flexShrink: 0,
  },
  intro: {
    marginBlockStart: space.sm,
    maxWidth: {
      default: space.measure,
      [bp.xl]: "52ch",
    },
  },
});

export type ExamPhotos = Readonly<Record<string, ImageSource>>;

const ExamCardItem = ({
  card,
  photo,
}: {
  card: ExamCard;
  photo?: ImageSource;
}) => {
  const knownStats = card.stats.filter((stat) => Boolean(stat.value));
  return (
    <li {...stylex.props(styles.item)}>
      <a href={card.href} {...stylex.props(styles.card)}>
        <div {...stylex.props(styles.photo)}>
          <Media
            inverse
            placeholder={card.photoHint}
            ratio={16 / 10}
            source={photo}
          />
          <div aria-hidden="true" {...stylex.props(styles.scrim)} />
          <p aria-hidden="true" {...stylex.props(styles.mark)}>
            {card.mark}
          </p>
        </div>
        <div {...stylex.props(styles.body)}>
          <p {...stylex.props(styles.level)}>{card.level}</p>
          <h3 {...stylex.props(styles.title)}>{card.title}</h3>
          <p {...stylex.props(styles.description)}>{card.description}</p>
          {knownStats.length > 0 ? (
            <dl {...stylex.props(styles.stats)}>
              {knownStats.map((stat) => (
                <div key={stat.label} {...stylex.props(styles.stat)}>
                  <dt {...stylex.props(styles.statLabel)}>{stat.label}</dt>
                  <dd {...stylex.props(styles.statValue)}>{stat.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <span {...stylex.props(styles.cta)}>
            {card.cta} <span aria-hidden="true">&rarr;</span>
          </span>
        </div>
      </a>
    </li>
  );
};

export const Academics = ({
  cards = EXAM_CARDS,
  photos,
  allHref = "/results",
}: {
  cards?: readonly ExamCard[];
  /** Photographs keyed by card id, from the CMS. */
  photos?: ExamPhotos;
  allHref?: string;
}) => (
  <Section id="academics" labelledBy="academics-title" tone="inverseGradient">
    <Container>
      <SectionHeader
        action={
          <span {...stylex.props(styles.action)}>
            <ArrowLink href={allHref} inverse>
              All results
            </ArrowLink>
          </span>
        }
      >
        <Eyebrow inverse>Academics</Eyebrow>
        <Heading id="academics-title" level={2} style={styles.heading}>
          Academic Excellence
        </Heading>
        <Lead inverse style={styles.intro}>
          Results at every national examination &mdash; from the Grade 5
          Scholarship to the G.C.E. Advanced Level.
        </Lead>
      </SectionHeader>

      <Reveal direction="up">
        <ul {...stylex.props(styles.grid)}>
          {cards.map((card) => (
            <ExamCardItem card={card} key={card.id} photo={photos?.[card.id]} />
          ))}
        </ul>
      </Reveal>
    </Container>
  </Section>
);
