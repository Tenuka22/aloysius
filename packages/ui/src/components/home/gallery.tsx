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
   * Masonry via CSS multi-column, not grid.
   *
   * The alternatives all cost something this page has promised not to pay. A
   * JS layout has to measure the column width before it can place anything, so
   * the grid is built twice and the tiles shift; a fixed-row-unit grid needs
   * the tile's height in pixels to work out its row span, which is the same
   * measurement by another name; `grid-template-rows: masonry` is still not
   * broadly supported. Multi-column needs no measurement at all, so the box for
   * every tile is reserved by its own `aspect-ratio` before the first paint and
   * CLS stays at 0.
   *
   * The trade is visual order: columns fill top to bottom, so the second tile
   * sits below the first rather than beside it. Source order is untouched, so
   * the accessibility tree and the tab order are still the authored order.
   */
  grid: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    columnGap: space["2xs"],
    columnCount: {
      default: 2,
      [bp.md]: 3,
      [bp.xl]: 4,
    },
  },
  tile: {
    // Without this a tile can be split across a column break, which cuts a
    // photograph in half.
    breakInside: "avoid",
    // `column-gap` only spaces the columns; this spaces the tiles within one.
    marginBlockEnd: space["2xs"],
    minWidth: 0,
  },
});

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
          {items.map((item) => (
            <li key={item.id} {...stylex.props(styles.tile)}>
              {/*
               * Each tile sets its own crop from `aspectRatios`, which is what
               * gives the columns their differing heights.
               */}
              <Media
                placeholder={item.label}
                ratio={item.preferredRatio}
                source={item.image}
                zoom
              />
              {/*
               * Only when there is no real image. Once the CMS supplies one,
               * its `alt` already names the tile and this would make a screen
               * reader announce every tile's subject twice.
               */}
              {item.image ? null : (
                <VisuallyHidden>{item.label}</VisuallyHidden>
              )}
            </li>
          ))}
        </ul>
      </Reveal>
    </Container>
  </Section>
);
