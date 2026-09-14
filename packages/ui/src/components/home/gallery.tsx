import * as stylex from "@stylexjs/stylex";

import { GALLERY_ITEMS } from "../../content/home";
import type { GalleryItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { space } from "../../tokens/tokens.stylex";
import { ArrowLink } from "../primitives/button";
import {
  Container,
  Eyebrow,
  Heading,
  Section,
  SectionHeader,
  VisuallyHidden,
} from "../primitives/layout";
import { Media } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  /*
   * Two columns on a phone, four from 48rem. The tall-tile mosaic only applies
   * where there are four columns; below that a uniform grid is the honest
   * layout and never leaves a stranded half-height tile.
   */
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gap: space["2xs"],
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      [bp.lg]: "repeat(4, minmax(0, 1fr))",
    },
  },
  tile: {
    minWidth: 0,
  },
  tall: {
    gridRow: {
      default: "auto",
      [bp.lg]: "span 2",
    },
  },
  tallMedia: {
    height: {
      default: "auto",
      [bp.lg]: "100%",
    },
    aspectRatio: {
      default: "1 / 1",
      [bp.lg]: "auto",
    },
  },
});

const TALL_TILES = new Set(["campus", "sports"]);

export const Gallery = ({
  items = GALLERY_ITEMS,
  allHref = "/media/gallery",
}: {
  items?: readonly GalleryItem[];
  allHref?: string;
}) => (
  <Section labelledBy="gallery-title" tone="surface">
    <Container>
      <SectionHeader
        action={<ArrowLink href={allHref}>Full gallery</ArrowLink>}
      >
        <Eyebrow>Media</Eyebrow>
        <Heading id="gallery-title" level={2}>
          Gallery
        </Heading>
      </SectionHeader>

      <Reveal direction="up">
        <ul {...stylex.props(styles.grid)}>
          {items.map((item) => {
            const isTall = TALL_TILES.has(item.id);
            return (
              <li
                key={item.id}
                {...stylex.props(styles.tile, isTall && styles.tall)}
              >
                <Media
                  placeholder={item.label}
                  ratio="1:1"
                  source={item.image}
                  style={isTall && styles.tallMedia}
                  zoom
                />
                {/*
                  Only when there is no real image. Once the CMS supplies one,
                  its `alt` already names the tile and this would make a screen
                  reader announce every tile's subject twice.
                */}
                {item.image ? null : (
                  <VisuallyHidden>{item.label}</VisuallyHidden>
                )}
              </li>
            );
          })}
        </ul>
      </Reveal>
    </Container>
  </Section>
);
