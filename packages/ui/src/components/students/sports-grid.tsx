import * as stylex from "@stylexjs/stylex";

import {
  MORE_SPORTS,
  MORE_SPORTS_TITLE,
  SPORTS_EYEBROW,
  SPORTS_HEADING,
  SPORT_TILES,
} from "../../content/students";
import type { SportTile } from "../../content/students";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Eyebrow, Heading, Section } from "../primitives/layout";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  /*
   * The design's mosaic is a fixed 6-column / 128px-row bento, which overflows
   * at any width below ~1024px and gives each photograph a different crop at
   * every viewport. Built up instead: a plain stack at 320px, two columns from
   * 40rem, and only at 64rem does it become the mosaic.
   *
   * `minmax(10rem, auto)` rather than the mock's hard `128px`: a tile can grow
   * when its label wraps, so nothing ever clips.
   */
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    marginBlockStart: space["2xl"],
    padding: 0,
    gap: space.sm,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.mdToXl]: "repeat(2, minmax(0, 1fr))",
      [bp.xl]: "repeat(6, minmax(0, 1fr))",
    },
    gridAutoRows: {
      default: "auto",
      [bp.xl]: "minmax(10rem, auto)",
    },
  },
  tile: {
    position: "relative",
    display: "flex",
    overflow: "hidden",
    minBlockSize: {
      default: "12rem",
      [bp.xl]: "auto",
    },
  },

  /** Cricket: the hero tile, two thirds of the row and two rows tall. */
  spanFeature: {
    gridColumn: { default: "auto", [bp.mdToXl]: "span 2", [bp.xl]: "span 4" },
    gridRow: { default: "auto", [bp.xl]: "span 2" },
    minBlockSize: {
      default: "16rem",
      [bp.xl]: "auto",
    },
  },
  spanThird: {
    gridColumn: { default: "auto", [bp.xl]: "span 2" },
  },

  photo: {
    position: "absolute",
    inset: 0,
    inlineSize: "100%",
    blockSize: "100%",
  },
  caption: {
    position: "relative",
    alignSelf: "flex-end",
    margin: space.sm,
    paddingBlock: space["3xs"],
    paddingInline: space["2xs"],
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
  },

  morePanel: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: space["2xs"],
    padding: space.md,
    textAlign: "center",
    backgroundColor: color.danger,
    color: color.onInverse,
  },
  moreTitle: {
    margin: 0,
    fontSize: font.sizeSm,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
  },
  /*
   * A real list rather than the mock's bullet-separated string, so assistive
   * tech announces the count instead of reading one run-on line.
   */
  moreList: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space["2xs"],
    margin: 0,
    padding: 0,
    listStyle: "none",
    fontSize: font.sizeXs,
    color: color.accentHover,
  },
});

export type SportImages = Readonly<Record<string, ImageSource>>;

const SPAN_STYLES = {
  feature: styles.spanFeature,
  half: styles.spanThird,
  third: styles.spanThird,
} as const;

export const SportsGrid = ({
  tiles = SPORT_TILES,
  moreSports = MORE_SPORTS,
  images,
}: {
  tiles?: readonly SportTile[];
  moreSports?: readonly string[];
  images?: SportImages;
}) => (
  <Section id="sports" labelledBy="sports-title" tone="surface">
    <Container>
      <Eyebrow>{SPORTS_EYEBROW}</Eyebrow>
      <Heading id="sports-title" level={2}>
        {SPORTS_HEADING}
      </Heading>

      <Reveal direction="up">
        <ul {...stylex.props(styles.grid)}>
          {tiles.map((tile) => (
            <li
              key={tile.id}
              {...stylex.props(styles.tile, SPAN_STYLES[tile.span])}
            >
              <Media
                fill
                placeholder={tile.placeholder}
                source={images?.[tile.id]}
                style={styles.photo}
                zoom
              />
              <h3 {...stylex.props(styles.caption)}>{tile.name}</h3>
            </li>
          ))}

          {moreSports.length > 0 ? (
            <li
              {...stylex.props(styles.tile, styles.morePanel, styles.spanThird)}
            >
              <h3 {...stylex.props(styles.moreTitle)}>{MORE_SPORTS_TITLE}</h3>
              <ul {...stylex.props(styles.moreList)}>
                {moreSports.map((sport) => (
                  <li key={sport}>{sport}</li>
                ))}
              </ul>
            </li>
          ) : null}
        </ul>
      </Reveal>
    </Container>
  </Section>
);
