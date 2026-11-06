import * as stylex from "@stylexjs/stylex";
import { useId, useMemo, useRef, useState } from "react";

import { formatNewsDate } from "../../content/home";
import type { NewsCategory } from "../../content/home";
import {
  ALL_CATEGORIES,
  NEWS_ARCHIVE_HEADING,
  NEWS_EMPTY_BODY,
  NEWS_EMPTY_HEADING,
  NEWS_FILTER_EMPTY_BODY,
  NEWS_FILTER_EMPTY_HEADING,
  NEWS_PAGE_SIZE,
} from "../../content/news";
import type { NewsStory } from "../../content/news";
import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";
import { DcInner, DcSection } from "../home/dc";
import { Media } from "../primitives/media";

/*
 * Measurements are the approved design's (News.dc.html): 90px section padding,
 * a three-column grid with 40px / 32px gaps, 230px photographs, a 25px serif
 * headline, and 40px square page buttons. One column on a phone, two from
 * 40rem, three from 64rem.
 */
const styles = stylex.create({
  section: {
    paddingBlock: "clamp(56px, 8vw, 90px)",
  },
  grid: {
    display: "grid",
    gap: "40px 32px",
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
    color: "inherit",
    textDecoration: "none",
  },
  photo: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    height: "230px",
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    margin: 0,
    marginBlock: "18px 10px",
    fontSize: "10.5px",
    letterSpacing: "0.14em",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  categoryGreen: {
    color: "#013405",
  },
  categoryCrimson: {
    color: "#A51919",
  },
  date: {
    color: "rgba(1, 52, 5, 0.45)",
  },
  cardTitle: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: "25px",
    lineHeight: 1.2,
    textWrap: "pretty",
    color: {
      default: "#013405",
      ":hover": "#A51919",
    },
  },

  empty: {
    // A bordered panel rather than a bare sentence, so an empty archive still
    // reads as a deliberate state instead of a broken section.
    borderWidth: "1px",
    borderStyle: "dashed",
    borderColor: "rgba(1, 52, 5, 0.15)",
    paddingBlock: "64px",
    paddingInline: "24px",
    textAlign: "center",
  },
  emptyHeading: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: "28px",
    lineHeight: 1.2,
  },
  emptyBody: {
    margin: 0,
    marginBlockStart: "12px",
    marginInline: "auto",
    maxWidth: "48ch",
    fontSize: "15px",
    lineHeight: 1.7,
    color: "rgba(1, 52, 5, 0.75)",
    textWrap: "pretty",
  },

  pagination: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "10px",
    marginBlockStart: "clamp(48px, 7vw, 80px)",
    marginBlockEnd: 0,
    marginInline: 0,
    padding: 0,
    listStyle: "none",
  },
  page: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    inlineSize: "40px",
    blockSize: "40px",
    padding: 0,
    borderWidth: "1px",
    borderStyle: "solid",
    fontFamily: font.body,
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    touchAction: "manipulation",
  },
  pageIdle: {
    backgroundColor: "transparent",
    borderColor: {
      default: "rgba(1, 52, 5, 0.25)",
      ":hover": "#013405",
    },
    color: "#013405",
  },
  pageActive: {
    backgroundColor: "#013405",
    borderColor: "#013405",
    color: "#FFB203",
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

export type Filter = typeof ALL_CATEGORIES | NewsCategory;

const FIRST_PAGE = 1;

/** Module-level so the default prop is referentially stable across renders. */
const NO_STORIES: readonly NewsStory[] = [];

/** Sports and Achievements are set in crimson, the rest in green, as designed. */
const CRIMSON_CATEGORIES: ReadonlySet<NewsCategory> = new Set([
  "Sports",
  "Achievements",
]);

export interface NewsArchiveProps {
  stories?: readonly NewsStory[];
  pageSize?: number;
  /**
   * The category chosen in the hero. The News page keeps the chips in its hero,
   * as in the design, and passes the choice down; it should also pass
   * `key={filter}`, so the page number resets when the category changes.
   */
  filter?: Filter;
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
  filter = ALL_CATEGORIES,
}: NewsArchiveProps) => {
  const [page, setPage] = useState(FIRST_PAGE);
  const resultsRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

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
    <DcSection
      id="stories"
      labelledBy={headingId}
      style={styles.section}
      tone="raised"
    >
      <DcInner>
        {/* The design has no visible heading here; the section still needs a
            name for the document outline and screen readers. */}
        <h2 id={headingId} {...stylex.props(styles.srOnly)}>
          {NEWS_ARCHIVE_HEADING}
        </h2>

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
                // No `/news/:slug` page exists yet, so a story without an
                // `href` is a plain card rather than a link to nowhere.
                const CardTag = story.href ? "a" : "div";
                return (
                  <li key={story.id} {...stylex.props(styles.card)}>
                    <CardTag
                      href={story.href || undefined}
                      {...stylex.props(styles.cardLink)}
                    >
                      <div {...stylex.props(styles.photo)}>
                        <Media
                          fill
                          placeholder={`${story.category} story photograph`}
                          source={story.image}
                        />
                      </div>
                      <p {...stylex.props(styles.meta)}>
                        <span
                          {...stylex.props(
                            CRIMSON_CATEGORIES.has(story.category)
                              ? styles.categoryCrimson
                              : styles.categoryGreen
                          )}
                        >
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
                      <h3 {...stylex.props(styles.cardTitle)}>{story.title}</h3>
                    </CardTag>
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

        {/* Pagination appears only when there is a second page. */}
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
      </DcInner>
    </DcSection>
  );
};
