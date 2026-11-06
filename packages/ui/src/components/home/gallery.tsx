import * as stylex from "@stylexjs/stylex";

import { GALLERY_ITEMS, GALLERY_STRIP_LIMIT } from "../../content/home";
import type { GalleryItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { VisuallyHidden } from "../primitives/layout";
import { Reveal } from "../primitives/reveal";
import { DcEyebrow, DcHeading, DcInner, DcLink, DcSection, DcSlot } from "./dc";
import { dc } from "./dc-styles";

/*
 * The design's gallery is a fixed six-tile bento: four columns of 150px rows
 * with a 14px gap, tiles 1 and 3 two rows tall. Under 40rem the four columns
 * would be thumbnails, so it drops to two columns of equal tiles.
 */
const styles = stylex.create({
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gap: "14px",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      [bp.md]: "repeat(4, minmax(0, 1fr))",
    },
    gridAutoRows: {
      default: "9rem",
      [bp.md]: "150px",
    },
  },
  tile: {
    position: "relative",
    minWidth: 0,
    overflow: "hidden",
  },
  tall: {
    gridRow: {
      default: "auto",
      [bp.md]: "span 2",
    },
  },
  fill: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  },
  link: {
    position: "absolute",
    inset: 0,
    display: "block",
    textDecoration: "none",
    ":focus-visible": {
      outlineOffset: "-4px",
    },
  },
  linkLabel: {
    position: "absolute",
    insetInlineStart: "12px",
    insetBlockEnd: "12px",
    paddingBlock: "4px",
    paddingInline: "8px",
    backgroundColor: "#013405",
    color: "#FFF8E7",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    pointerEvents: "none",
  },
  empty: {
    margin: 0,
    paddingBlock: "48px",
    fontSize: "14px",
    textAlign: "center",
    color: "rgba(1, 52, 5, 0.68)",
  },
});

const isTallTile = (index: number) => index === 0 || index === 2;

export const Gallery = ({
  items = GALLERY_ITEMS,
  allHref = "/media/gallery",
  eyebrow = "Media",
  heading = "Gallery",
}: {
  items?: readonly GalleryItem[];
  allHref?: string;
  eyebrow?: string;
  heading?: string;
}) => (
  <DcSection labelledBy="gallery-title" tone="cream">
    <DcInner>
      <div {...stylex.props(dc.header)}>
        <div>
          <DcEyebrow>{eyebrow}</DcEyebrow>
          <DcHeading id="gallery-title">{heading}</DcHeading>
        </div>
        <DcLink href={allHref}>
          Full Gallery <span aria-hidden="true">→</span>
        </DcLink>
      </div>

      {items.length === 0 ? (
        <p {...stylex.props(styles.empty)}>
          No photographs have been published yet. Visit the media page for
          pictures from College life.
        </p>
      ) : (
        <Reveal direction="up">
          <ul {...stylex.props(styles.grid)}>
            {items.slice(0, GALLERY_STRIP_LIMIT).map((item, index) => {
              const photo = (
                <DcSlot
                  placeholder={item.label}
                  source={item.image}
                  style={styles.fill}
                />
              );
              return (
                <li
                  key={item.id}
                  {...stylex.props(
                    styles.tile,
                    isTallTile(index) && styles.tall
                  )}
                >
                  {/* Once a real image is present its `alt` names the tile. */}
                  {item.image ? null : (
                    <VisuallyHidden>{item.label}</VisuallyHidden>
                  )}
                  {item.href ? (
                    <a
                      href={item.href}
                      rel="noopener noreferrer"
                      target="_blank"
                      {...stylex.props(styles.link)}
                    >
                      <span aria-hidden="true">{photo}</span>
                      <VisuallyHidden>
                        {`${item.label}. ${item.hrefLabel ?? "Open"}`}
                      </VisuallyHidden>
                      {item.hrefLabel ? (
                        <span
                          aria-hidden="true"
                          {...stylex.props(styles.linkLabel)}
                        >
                          {item.hrefLabel}
                        </span>
                      ) : null}
                    </a>
                  ) : (
                    photo
                  )}
                </li>
              );
            })}
          </ul>
        </Reveal>
      )}
    </DcInner>
  </DcSection>
);
