import * as stylex from "@stylexjs/stylex";

import { formatNewsDate } from "../../content/home";
import type { NewsItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import { ArrowLink } from "../primitives/button";
import {
  Container,
  Eyebrow,
  Heading,
  Section,
  SectionHeader,
} from "../primitives/layout";
import { Media } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  grid: {
    display: "grid",
    gap: space.xl,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: "minmax(0, 1.4fr) minmax(0, 1fr)",
    },
    alignItems: "start",
  },
  featured: {
    display: "block",
    textDecoration: "none",
    color: "inherit",
    minWidth: 0,
  },
  featuredTitle: {
    margin: 0,
    marginBlockStart: space["2xs"],
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    textWrap: "pretty",
    color: {
      default: color.onSurface,
      ":hover": color.accentOnSurface,
    },
    transitionProperty: "color",
    transitionDuration: motionToken.fast,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
    alignItems: "center",
    marginBlockStart: space.sm,
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
    // Normal case reads better than uppercase for a date.
    textTransform: "none",
    letterSpacing: font.trackingWide,
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
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  itemLink: {
    display: "block",
    paddingBlock: space.sm,
    textDecoration: "none",
    color: "inherit",
  },
  itemTitle: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
    lineHeight: font.leadingNormal,
    textWrap: "pretty",
    color: {
      default: color.onSurface,
      ":hover": color.accentOnSurface,
    },
    transitionProperty: "color",
    transitionDuration: motionToken.fast,
  },
  itemMeta: {
    marginBlockStart: 0,
  },
});

export const News = ({
  featured,
  items,
  allHref = "/news",
}: {
  featured?: NewsItem;
  items: readonly NewsItem[];
  allHref?: string;
}) => (
  <Section id="news" labelledBy="news-title" tone="raised">
    <Container>
      <SectionHeader
        action={<ArrowLink href={allHref}>View all news</ArrowLink>}
      >
        <Eyebrow>News &amp; events</Eyebrow>
        <Heading id="news-title" level={2}>
          Life at the College
        </Heading>
      </SectionHeader>

      <div {...stylex.props(styles.grid)}>
        {featured ? (
          <Reveal direction="up">
            <a href={featured.href} {...stylex.props(styles.featured)}>
              <Media
                placeholder="Featured story image"
                ratio="3:2"
                source={featured.image}
                zoom
              />
              <p {...stylex.props(styles.meta)}>
                <span {...stylex.props(styles.category)}>
                  {featured.category}
                </span>
                {featured.date ? (
                  <time dateTime={featured.date} {...stylex.props(styles.date)}>
                    {formatNewsDate(featured.date)}
                  </time>
                ) : null}
              </p>
              <h3 {...stylex.props(styles.featuredTitle)}>{featured.title}</h3>
            </a>
          </Reveal>
        ) : null}

        <Reveal delay={1} direction="up">
          <ul {...stylex.props(styles.list)}>
            {items.map((item) => (
              <li key={item.id} {...stylex.props(styles.item)}>
                <a href={item.href} {...stylex.props(styles.itemLink)}>
                  <p {...stylex.props(styles.meta, styles.itemMeta)}>
                    <span {...stylex.props(styles.category)}>
                      {item.category}
                    </span>
                    {item.date ? (
                      <time dateTime={item.date} {...stylex.props(styles.date)}>
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
    </Container>
  </Section>
);
