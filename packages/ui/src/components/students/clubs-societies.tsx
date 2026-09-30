import * as stylex from "@stylexjs/stylex";

import {
  CLUBS,
  CLUBS_EYEBROW,
  CLUBS_HEADING,
  CLUBS_INTRO,
} from "../../content/students";
import type { Club } from "../../content/students";
import { aspectRatios } from "../../tokens/aspect-ratios";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import {
  Container,
  Eyebrow,
  Heading,
  Lead,
  Section,
} from "../primitives/layout";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  /*
   * The hairline rules between cells are drawn by a 1px grid gap over the
   * container's gold background rather than per-cell borders - that way the
   * lines never double up where two cells meet, at any column count.
   *
   * `auto-fit` + `minmax` rather than the mock's hard `repeat(4, 1fr)`, which
   * gives each of these eight cells ~56px at 320px. `min(100%, 15rem)` is what
   * stops the track floor exceeding the container on a narrow phone.
   */
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    marginBlockStart: space["2xl"],
    padding: 0,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15rem), 1fr))",
    gap: space.px,
    backgroundColor: color.borderAccent,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderAccent,
  },
  cell: {
    blockSize: "100%",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: space["3xs"],
    justifyContent: "center",
    blockSize: "100%",
    // Keeps every cell a comfortable band on touch displays and smart boards
    // even where a club has no description yet.
    minBlockSize: "5.5rem",
    padding: space.lg,
    backgroundColor: {
      default: color.surfaceInverse,
      ":hover": color.surfaceInverseDeep,
    },
    transitionProperty: "background-color",
    transitionDuration: motionToken.base,
  },
  /*
   * A card carrying a banner puts its text below the image rather than over it.
   * Overlaying would need a scrim, and a scrim over a photographer's chosen
   * image decides for them which parts of their photograph stay visible - which
   * is the one thing a cover banner should not do.
   */
  cardWithBanner: {
    justifyContent: "flex-start",
    padding: 0,
    overflow: "hidden",
  },
  bannerText: {
    display: "flex",
    flexDirection: "column",
    gap: space["3xs"],
    padding: space.lg,
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
  /*
   * The club's own cover banner, shown as a band across the top of its card.
   *
   * The card is a fixed-height row in a hairline grid, so the banner is a
   * reserved landscape box rather than a background: `object-fit: cover` on a
   * full-bleed background would crop a photographer's composition differently at
   * every card width, and the whole point of a club choosing this image is that
   * it represents the club. A club with no banner renders no box at all, which
   * keeps the grid tidy rather than showing a placeholder per card.
   */
  banner: {
    display: "block",
    width: "100%",
    objectFit: "cover",
  },
  /*
   * A card that links to the club's own page. The whole card becomes the hit
   * target and the name underlines on hover - the affordance a visitor expects
   * from a card that is also a link, without repainting the tile.
   */
  linkedCard: {
    textDecoration: "none",
    color: "inherit",
  },
  linkedName: {
    textDecoration: {
      default: "none",
      ":hover": "underline",
    },
  },
  // `Heading` and `Lead` both reset their margins, so the gap between them is
  // the caller's to supply.
  heading: {
    color: color.onInverse,
    marginBlockEnd: space.sm,
  },
});

/**
 * One club tile: a link when the club has its own page, a plain card when it
 * does not. Both render the same visual, so a linked club is discoverable by
 * the underline-on-hover affordance rather than by a different layout.
 */
const CardInner = ({ club }: { club: Club }) => {
  const body = (
    <>
      {club.coverImageUrl ? (
        // Decorative next to the club's name, which is right beside it,
        // so an empty alt is correct rather than a missed description.
        <img
          alt=""
          src={club.coverImageUrl}
          style={{ aspectRatio: aspectRatios.mosaicTile }}
          {...stylex.props(styles.banner)}
        />
      ) : null}
      <div
        {...stylex.props(club.coverImageUrl ? styles.bannerText : undefined)}
      >
        <h3
          {...stylex.props(
            styles.name,
            club.href ? styles.linkedName : undefined
          )}
        >
          {club.name}
        </h3>
        {/*
          No filler when the society has not published what it does:
          an empty slot is honest, `[CMS: description]` is not.
          */}
        {club.description ? (
          <p {...stylex.props(styles.description)}>{club.description}</p>
        ) : null}
      </div>
    </>
  );

  if (!club.href) {
    return (
      <div
        {...stylex.props(
          styles.card,
          club.coverImageUrl ? styles.cardWithBanner : undefined
        )}
      >
        {body}
      </div>
    );
  }

  return (
    <a
      href={club.href}
      {...stylex.props(
        styles.card,
        styles.linkedCard,
        club.coverImageUrl ? styles.cardWithBanner : undefined
      )}
    >
      {body}
    </a>
  );
};

export const ClubsSocieties = ({
  clubs = CLUBS,
}: {
  clubs?: readonly Club[];
}) => (
  <Section id="clubs" labelledBy="clubs-title" tone="inverseGradient">
    <Container>
      <Eyebrow inverse>{CLUBS_EYEBROW}</Eyebrow>
      <Heading id="clubs-title" level={2} style={styles.heading}>
        {CLUBS_HEADING}
      </Heading>
      <Lead inverse>{CLUBS_INTRO}</Lead>

      <ul {...stylex.props(styles.grid)}>
        {clubs.map((club) => (
          <li key={club.id} {...stylex.props(styles.cell)}>
            <Reveal direction="up" style={styles.cell}>
              <CardInner club={club} />
            </Reveal>
          </li>
        ))}
      </ul>
    </Container>
  </Section>
);
