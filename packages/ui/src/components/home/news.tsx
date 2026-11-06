import * as stylex from "@stylexjs/stylex";

import { formatNewsDate } from "../../content/home";
import type { NewsItem } from "../../content/home";
import { font } from "../../tokens/tokens.stylex";
import { Reveal } from "../primitives/reveal";
import { DcEyebrow, DcHeading, DcInner, DcLink, DcSection, DcSlot } from "./dc";
import { dc } from "./dc-styles";

const styles = stylex.create({
  grid: {
    display: "grid",
    gap: "40px",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    alignItems: "start",
  },
  featured: {
    display: "block",
    textDecoration: "none",
    color: "#013405",
    minWidth: 0,
  },
  featuredPhoto: {
    width: "100%",
    height: "clamp(260px, 40vw, 380px)",
  },
  featuredTitle: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "32px",
    fontWeight: 600,
    lineHeight: 1.15,
    color: {
      default: "#013405",
      ":hover": "#A51919",
    },
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "14px",
    margin: 0,
    marginBlock: "20px 10px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  metaItem: {
    marginBlock: "0 8px",
    fontSize: "10.5px",
  },
  categoryCrimson: {
    color: "#A51919",
  },
  categoryGreen: {
    color: "#013405",
  },
  date: {
    color: "rgba(1, 52, 5, 0.45)",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    listStyle: "none",
    margin: 0,
    padding: 0,
    minWidth: 0,
  },
  item: {
    borderBlockEndWidth: "1px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "rgba(1, 52, 5, 0.12)",
  },
  itemLink: {
    display: "block",
    paddingBlock: "22px",
    textDecoration: "none",
    color: "#013405",
  },
  itemTitle: {
    margin: 0,
    fontSize: "16.5px",
    fontWeight: 700,
    lineHeight: 1.4,
    color: {
      default: "#013405",
      ":hover": "#A51919",
    },
  },
  empty: {
    margin: 0,
    paddingBlock: "48px",
    fontSize: "14px",
    textAlign: "center",
    color: "rgba(1, 52, 5, 0.68)",
  },
});

export const News = ({
  featured,
  items,
  allHref = "/news",
  heading = "Life at the College",
}: {
  featured?: NewsItem;
  items: readonly NewsItem[];
  allHref?: string;
  heading?: string;
}) => {
  const hasNothing = !featured && items.length === 0;

  return (
    <DcSection id="news" labelledBy="news-title" tone="raised">
      <DcInner>
        <div {...stylex.props(dc.header)}>
          <div>
            <DcEyebrow>News &amp; events</DcEyebrow>
            <DcHeading id="news-title">{heading}</DcHeading>
          </div>
          {hasNothing ? null : (
            <DcLink href={allHref}>
              View All News <span aria-hidden="true">→</span>
            </DcLink>
          )}
        </div>

        {/*
         * Both slots are fed from real tables, so the section can arrive with
         * nothing in it. The heading stays (hiding is the CMS toggle's call) and
         * a line explains the gap rather than leaving an empty list.
         */}
        {hasNothing ? (
          <p {...stylex.props(styles.empty)}>
            No stories have been published yet. Visit the news page for the
            latest from the College.
          </p>
        ) : (
          <div {...stylex.props(styles.grid)}>
            {featured ? (
              <Reveal direction="up">
                <a href={featured.href} {...stylex.props(styles.featured)}>
                  <DcSlot
                    placeholder="Featured story image"
                    source={featured.image}
                    style={styles.featuredPhoto}
                  />
                  <p {...stylex.props(styles.meta)}>
                    <span {...stylex.props(styles.categoryCrimson)}>
                      {featured.category}
                    </span>
                    {featured.date ? (
                      <time
                        dateTime={featured.date}
                        {...stylex.props(styles.date)}
                      >
                        {formatNewsDate(featured.date)}
                      </time>
                    ) : null}
                  </p>
                  <h3 {...stylex.props(styles.featuredTitle)}>
                    {featured.title}
                  </h3>
                </a>
              </Reveal>
            ) : null}

            <Reveal delay={1} direction="up">
              <ul {...stylex.props(styles.list)}>
                {items.map((item, index) => (
                  <li key={item.id} {...stylex.props(styles.item)}>
                    <a href={item.href} {...stylex.props(styles.itemLink)}>
                      <p {...stylex.props(styles.meta, styles.metaItem)}>
                        <span
                          {...stylex.props(
                            index % 2 === 0
                              ? styles.categoryGreen
                              : styles.categoryCrimson
                          )}
                        >
                          {item.category}
                        </span>
                        {item.date ? (
                          <time
                            dateTime={item.date}
                            {...stylex.props(styles.date)}
                          >
                            {formatNewsDate(item.date)}
                          </time>
                        ) : null}
                      </p>
                      <h3 {...stylex.props(styles.itemTitle)}>{item.title}</h3>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        )}
      </DcInner>
    </DcSection>
  );
};
