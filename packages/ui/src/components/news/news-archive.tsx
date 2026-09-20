import * as stylex from "@stylexjs/stylex";
import { useId, useMemo, useRef, useState } from "react";

import { formatNewsDate } from "../../content/home";
import type { NewsCategory } from "../../content/home";
import {
  ALL_CATEGORIES,
  categoriesPresentIn,
  NEWS_ARCHIVE_HEADING,
  NEWS_EMPTY_BODY,
  NEWS_EMPTY_HEADING,
  NEWS_FILTER_EMPTY_BODY,
  NEWS_FILTER_EMPTY_HEADING,
  NEWS_FILTER_LABEL,
  NEWS_PAGE_SIZE,
} from "../../content/news";
import type { NewsStory } from "../../content/news";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import { Container, Heading, Section } from "../primitives/layout";
import { Media } from "../primitives/media";

const MIN_TARGET = "2.75rem";

const styles = stylex.create({
  heading: {
    marginBlockEnd: space.lg,
  },

  /*
   * The mock's chips are `<span onClick>`: not focusable, not announced, no
   * pressed state. These are real buttons in a labelled group, and the row
   * wraps instead of overflowing - seven chips in a no-wrap row is ~700px.
   */
  filter: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
    // A fieldset ships with a UA border, padding and `min-inline-size:
    // min-content` - the last of which makes the row refuse to shrink below
    // its widest chip and overflow a 320px viewport. All four are reset.
    borderWidth: 0,
    borderStyle: "none",
    minInlineSize: 0,
    paddingBlock: 0,
    paddingInline: 0,
    marginBlockStart: 0,
    marginInline: 0,
    marginBlockEnd: space.xl,
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    // SC 2.5.8 everywhere, not only on coarse pointers: these are the page's
    // primary controls and they sit close together.
    minBlockSize: MIN_TARGET,
    paddingBlock: space["2xs"],
    paddingInline: space.md,
    borderWidth: space.px,
    borderStyle: "solid",
    fontFamily: font.body,
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    transitionProperty: "background-color, color, border-color",
    transitionDuration: motionToken.fast,
    transitionTimingFunction: motionToken.ease,
  },
  chipIdle: {
    backgroundColor: {
      default: "transparent",
      ":hover": color.surfaceSunken,
    },
    borderColor: color.borderStrong,
    // Crimson, not gold: gold on cream is ~1.9:1 and fails SC 1.4.3 outright.
    color: color.onSurface,
  },
  chipActive: {
    backgroundColor: color.accent,
    borderColor: color.accent,
    color: color.onAccent,
  },

  grid: {
    display: "grid",
    // The mock's hard `repeat(3, …)` overflows below ~900px. One column on a
    // phone, two from 40rem, three from 64rem.
    gap: space.xl,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.md]: "repeat(2, minmax(0, 1fr))",
      [bp.xl]: "repeat(3, minmax(0, 1fr))",
    },
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  card: {
    minWidth: 0,
  },
  cardLink: {
    display: "block",
    textDecoration: "none",
    color: "inherit",
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
    alignItems: "center",
    margin: 0,
    marginBlock: space.sm,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
  },
  category: {
    color: color.accentOnSurface,
  },
  date: {
    color: color.onSurfaceSubtle,
    textTransform: "none",
    letterSpacing: font.trackingWide,
  },
  cardTitle: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.sizeXl,
    lineHeight: font.leadingSnug,
    textWrap: "pretty",
    color: {
      default: color.onSurface,
      ":hover": color.accentOnSurface,
    },
    transitionProperty: "color",
    transitionDuration: motionToken.fast,
  },

  empty: {
    // A bordered panel rather than a bare sentence, so an empty archive still
    // reads as a deliberate state instead of a broken section.
    borderWidth: space.px,
    borderStyle: "dashed",
    borderColor: color.border,
    paddingBlock: space["2xl"],
    paddingInline: space.lg,
    textAlign: "center",
  },
  emptyHeading: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.sizeXl,
    lineHeight: font.leadingSnug,
  },
  emptyBody: {
    margin: 0,
    marginBlockStart: space.xs,
    marginInline: "auto",
    maxWidth: "48ch",
    fontSize: font.sizeMd,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },

  pagination: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space["2xs"],
    marginBlockStart: space["2xl"],
    padding: 0,
    listStyle: "none",
  },
  page: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minInlineSize: MIN_TARGET,
    minBlockSize: MIN_TARGET,
    borderWidth: space.px,
    borderStyle: "solid",
    fontFamily: font.body,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    transitionProperty: "background-color, color, border-color",
    transitionDuration: motionToken.fast,
  },
  pageIdle: {
    backgroundColor: {
      default: "transparent",
      ":hover": color.surfaceSunken,
    },
    borderColor: color.borderStrong,
    color: color.onSurface,
  },
  pageActive: {
    backgroundColor: color.surfaceInverse,
    borderColor: color.surfaceInverse,
    color: color.accentOnInverse,
  },
  pageDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  results: {
    // Focused programmatically after a page change, so it must not draw the
    // global focus ring around the whole grid.
    outline: {
      default: null,
      ":focus": "none",
    },
  },
  /** Local copy of the visually-hidden recipe: a live region must be a block
   * element, and `VisuallyHidden` renders a `<span>`. */
  srOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    margin: "-1px",
    padding: 0,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
});

type Filter = typeof ALL_CATEGORIES | NewsCategory;

const FIRST_PAGE = 1;

/** Module-level so the default prop is referentially stable across renders. */
const NO_STORIES: readonly NewsStory[] = [];

export interface NewsArchiveProps {
  stories?: readonly NewsStory[];
  pageSize?: number;
}

/**
 * The filterable, paginated story archive.
 *
 * Filtering and pagination are client state over data already in the document,
 * so both work without a round trip and the server-rendered HTML contains the
 * full first page - which is what search engines and no-JS visitors get.
 */
export const NewsArchive = ({
  stories = NO_STORIES,
  pageSize = NEWS_PAGE_SIZE,
}: NewsArchiveProps) => {
  const [filter, setFilter] = useState<Filter>(ALL_CATEGORIES);
  const [page, setPage] = useState(FIRST_PAGE);
  const resultsRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  const categories = useMemo(() => categoriesPresentIn(stories), [stories]);

  const filtered = useMemo(
    () =>
      filter === ALL_CATEGORIES
        ? stories
        : stories.filter((story) => story.category === filter),
    [stories, filter]
  );

  const totalPages = Math.max(
    FIRST_PAGE,
    Math.ceil(filtered.length / pageSize)
  );
  // Clamped rather than trusted: a filter change can shrink the result set
  // below the page the user was on.
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const selectFilter = (next: Filter) => {
    setFilter(next);
    setPage(FIRST_PAGE);
  };

  const goToPage = (next: number) => {
    setPage(next);
    // Without this the keyboard user is left focused on a pagination button at
    // the bottom of a grid that silently replaced itself above them.
    resultsRef.current?.focus();
  };

  const hasStories = stories.length > 0;
  const emptyHeading = hasStories
    ? NEWS_FILTER_EMPTY_HEADING
    : NEWS_EMPTY_HEADING;
  const emptyBody = hasStories ? NEWS_FILTER_EMPTY_BODY : NEWS_EMPTY_BODY;

  return (
    <Section id="stories" labelledBy={headingId} tone="raised">
      <Container>
        <Heading id={headingId} level={2} style={styles.heading}>
          {NEWS_ARCHIVE_HEADING}
        </Heading>

        {categories.length > 0 ? (
          /* A real <fieldset>/<legend> rather than role="group": the
             native element carries the grouping semantics, and the legend is
             the group's accessible name without an aria-label. */
          <fieldset {...stylex.props(styles.filter)}>
            <legend {...stylex.props(styles.srOnly)}>
              {NEWS_FILTER_LABEL}
            </legend>
            {[ALL_CATEGORIES, ...categories].map((category) => {
              const active = category === filter;
              return (
                <button
                  // `aria-pressed` rather than a tab list: these are toggles
                  // over one region, not separate panels.
                  aria-pressed={active}
                  key={category}
                  onClick={() => selectFilter(category as Filter)}
                  type="button"
                  {...stylex.props(
                    styles.chip,
                    active ? styles.chipActive : styles.chipIdle
                  )}
                >
                  {category}
                </button>
              );
            })}
          </fieldset>
        ) : null}

        <div ref={resultsRef} tabIndex={-1} {...stylex.props(styles.results)}>
          {/* Politely announces the new count after a filter or page change,
              which is otherwise a silent visual-only update. */}
          <output aria-live="polite" {...stylex.props(styles.srOnly)}>
            {filtered.length === 0
              ? "No stories match this filter."
              : `Showing ${visible.length} of ${filtered.length} stories, page ${currentPage} of ${totalPages}.`}
          </output>

          {visible.length > 0 ? (
            <ul {...stylex.props(styles.grid)}>
              {visible.map((story) => {
                const formattedDate = formatNewsDate(story.date);
                return (
                  <li key={story.id} {...stylex.props(styles.card)}>
                    <a href={story.href} {...stylex.props(styles.cardLink)}>
                      <Media
                        placeholder={`${story.category} story photograph`}
                        ratio="3:2"
                        source={story.image}
                        zoom
                      />
                      <p {...stylex.props(styles.meta)}>
                        <span {...stylex.props(styles.category)}>
                          {story.category}
                        </span>
                        {formattedDate ? (
                          <time
                            dateTime={story.date}
                            {...stylex.props(styles.date)}
                          >
                            {formattedDate}
                          </time>
                        ) : null}
                      </p>
                      {/* A heading, not the mock's styled div - this is the
                          only structure below the h2 across the whole grid. */}
                      <h3 {...stylex.props(styles.cardTitle)}>{story.title}</h3>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div {...stylex.props(styles.empty)}>
              <p {...stylex.props(styles.emptyHeading)}>{emptyHeading}</p>
              <p {...stylex.props(styles.emptyBody)}>{emptyBody}</p>
            </div>
          )}
        </div>

        {/* The mock ships three page buttons regardless of how many stories
            exist. Pagination appears only when there is a second page. */}
        {totalPages > FIRST_PAGE ? (
          <nav aria-label="Story archive pages">
            <ul {...stylex.props(styles.pagination)}>
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + FIRST_PAGE;
                const active = pageNumber === currentPage;
                return (
                  <li key={pageNumber}>
                    <button
                      aria-current={active ? "page" : undefined}
                      /* A bare "1" is not a destination when read out of
                         context. The visible text is contained in the label,
                         so SC 2.5.3 (label in name) still holds. */
                      aria-label={`Page ${pageNumber}`}
                      onClick={() => goToPage(pageNumber)}
                      type="button"
                      {...stylex.props(
                        styles.page,
                        active ? styles.pageActive : styles.pageIdle
                      )}
                    >
                      {pageNumber}
                    </button>
                  </li>
                );
              })}
              <li>
                <button
                  /* The mock's bare "→" has no accessible name at all. */
                  aria-label="Next page"
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  type="button"
                  {...stylex.props(
                    styles.page,
                    styles.pageIdle,
                    currentPage === totalPages && styles.pageDisabled
                  )}
                >
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </li>
            </ul>
          </nav>
        ) : null}
      </Container>
    </Section>
  );
};
