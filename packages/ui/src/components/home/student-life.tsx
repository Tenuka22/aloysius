import * as stylex from "@stylexjs/stylex";

import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Eyebrow, Heading, Section } from "../primitives/layout";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  /*
   * The design's bento grid is a fixed 6-column / 128px-row mosaic, which
   * collapses at any width below ~1024px. Here it is built up instead: a plain
   * stack at 320px, two columns from 40rem, and only at 64rem does it become
   * the mosaic. Rows are `minmax(8rem, auto)` so a long label can never clip.
   */
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gap: space.sm,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.mdToXl]: "repeat(2, minmax(0, 1fr))",
      [bp.xl]: "repeat(6, minmax(0, 1fr))",
    },
    gridAutoRows: {
      default: "auto",
      [bp.xl]: "minmax(8rem, auto)",
    },
  },
  tile: {
    position: "relative",
    display: "flex",
    minHeight: {
      default: "12rem",
      [bp.xl]: "auto",
    },
    overflow: "hidden",
  },

  spanSports: {
    gridColumn: { default: "auto", [bp.xl]: "span 3" },
    gridRow: { default: "auto", [bp.xl]: "span 3" },
  },
  spanMusic: {
    gridColumn: { default: "auto", [bp.mdToXl]: "span 2", [bp.xl]: "span 3" },
    gridRow: { default: "auto", [bp.xl]: "span 2" },
  },
  spanTwo: {
    gridColumn: { default: "auto", [bp.xl]: "span 2" },
  },
  spanOne: {
    gridColumn: "auto",
  },

  photo: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
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

  panel: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: space["3xs"],
    padding: space.sm,
    textAlign: "center",
  },
  panelGreen: {
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
  },
  panelCrimson: {
    backgroundColor: color.danger,
    color: color.onInverse,
  },
  panelGold: {
    backgroundColor: color.accent,
    color: color.onAccent,
  },
  panelTitle: {
    margin: 0,
    fontSize: font.sizeSm,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
  },
  panelSub: {
    margin: 0,
    fontSize: font.sizeXs,
    color: color.accentOnInverse,
  },
  panelSubDark: {
    color: color.onAccent,
  },
  headingSpacing: {
    marginBlock: `${space.sm} ${space.xl}`,
  },
});

interface PhotoTile {
  id: string;
  label: string;
  placeholder: string;
  image?: ImageSource;
}

const renderPhoto = (tile: PhotoTile, span: stylex.StyleXStyles) => (
  <li key={tile.id} {...stylex.props(styles.tile, span)}>
    <Media
      fill
      placeholder={tile.placeholder}
      source={tile.image}
      style={styles.photo}
      zoom
    />
    <h3 {...stylex.props(styles.caption)}>{tile.label}</h3>
  </li>
);

export const StudentLife = ({
  photos,
}: {
  photos?: Partial<
    Record<"sports" | "music" | "scouts" | "faith", ImageSource>
  >;
}) => {
  const photoTiles = {
    sports: {
      id: "sports",
      label: "Sports",
      placeholder: "Sports - action photograph",
      image: photos?.sports,
    },
    music: {
      id: "music",
      label: "Music & Drama",
      placeholder: "Music and drama",
      image: photos?.music,
    },
    scouts: {
      id: "scouts",
      label: "Scouts & Cadets",
      placeholder: "Scouts and cadets",
      image: photos?.scouts,
    },
    faith: {
      id: "faith",
      label: "Faith & Service",
      placeholder: "Chapel and service",
      image: photos?.faith,
    },
  } satisfies Record<string, PhotoTile>;

  return (
    <Section labelledBy="student-life-title" tone="surface">
      <Container>
        <Eyebrow>Student life</Eyebrow>
        <Heading
          id="student-life-title"
          level={2}
          style={styles.headingSpacing}
        >
          The Aloysian Experience
        </Heading>

        <Reveal direction="up">
          <ul {...stylex.props(styles.grid)}>
            {renderPhoto(photoTiles.sports, styles.spanSports)}
            {renderPhoto(photoTiles.music, styles.spanMusic)}

            <li
              {...stylex.props(
                styles.tile,
                styles.panel,
                styles.panelGreen,
                styles.spanTwo
              )}
            >
              <h3 {...stylex.props(styles.panelTitle)}>
                Clubs &amp; Societies
              </h3>
              <p {...stylex.props(styles.panelSub)}>
                Debate &bull; Science &bull; Media &bull; and more
              </p>
            </li>

            <li
              {...stylex.props(
                styles.tile,
                styles.panel,
                styles.panelCrimson,
                styles.spanOne
              )}
            >
              <h3 {...stylex.props(styles.panelTitle)}>Houses</h3>
            </li>

            {renderPhoto(photoTiles.scouts, styles.spanTwo)}
            {renderPhoto(photoTiles.faith, styles.spanTwo)}

            <li
              {...stylex.props(
                styles.tile,
                styles.panel,
                styles.panelGold,
                styles.spanTwo
              )}
            >
              <h3 {...stylex.props(styles.panelTitle)}>Prefects</h3>
            </li>
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
};
