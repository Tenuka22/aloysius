import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { color, font, space } from "../../tokens/tokens.stylex";
import { SkipLink } from "../primitives/layout";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { SiteFooter } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";

const MAIN_ID = "main-content";
/** Module-level so the default is referentially stable across renders. */
const NO_NOTICES: readonly NoticeSummary[] = [];

const styles = stylex.create({
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
  /*
   * A compact left-aligned masthead, matching the other archive pages. It was a
   * centred block at `4xl` with an eyebrow above it; a list of notices wants the
   * list to be the loudest thing on the page.
   */
  hero: {
    paddingBlock: space["2xl"],
    paddingInline: space.gutter,
    backgroundColor: color.surface,
  },
  heading: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    letterSpacing: font.trackingTight,
    color: color.onSurface,
    textWrap: "balance",
  },
  tagline: {
    margin: 0,
    marginBlockStart: space["2xs"],
    maxInlineSize: space.measure,
    fontSize: font.sizeLg,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  heroMedia: {
    marginBlockStart: space.lg,
  },
  content: {
    paddingBlock: space.xl,
    paddingInline: space.md,
    maxWidth: space.measure,
    marginInline: "auto",
  },
  emptyHeading: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
  },
  emptyBody: {
    margin: 0,
    marginBlockStart: space["2xs"],
    maxInlineSize: space.measure,
    fontSize: font.sizeMd,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  noticeList: {
    display: "flex",
    flexDirection: "column",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  noticeItem: {
    paddingBlock: space.md,
    borderBottomWidth: space.px,
    borderBottomStyle: "solid",
    borderBottomColor: color.border,
  },
  noticeTitle: {
    margin: 0,
    fontWeight: font.weightBold,
    fontSize: font.sizeLg,
    color: color.onSurface,
  },
  noticeBody: {
    margin: 0,
    marginBlockStart: space.xs,
    maxWidth: space.measure,
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
});

export interface NoticesPageProps {
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  /** The CMS announcements. Empty is a real state, not a placeholder. */
  notices?: readonly NoticeSummary[];
  extraNavItems?: readonly NavItem[];
}

export interface NoticeSummary {
  id: string;
  title: string;
  body: string;
}

export const NoticesPage = ({
  heading = "Notices",
  tagline,
  heroImage,
  notices = NO_NOTICES,
  extraNavItems,
}: NoticesPageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="/notices" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <section {...stylex.props(styles.hero)}>
        <h1 {...stylex.props(styles.heading)}>{heading}</h1>
        {tagline && <p {...stylex.props(styles.tagline)}>{tagline}</p>}
        {heroImage && (
          <Media
            placeholder=""
            ratio="16:9"
            source={heroImage}
            style={styles.heroMedia}
          />
        )}
      </section>
      {/*
       * Announcements are rows the CMS creates (cms.listAnnouncements), not
       * blocks. This section used to render "Notices will be displayed here once
       * published" unconditionally; it now points at the announcements the route
       * already fetches, and shows nothing when there are genuinely none.
       */}
      {notices.length === 0 && (
        <section {...stylex.props(styles.content)}>
          <h2 {...stylex.props(styles.emptyHeading)}>Nothing to report</h2>
          <p {...stylex.props(styles.emptyBody)}>
            There are no notices at the moment. Anything urgent is pinned to the
            top of this page, so an empty list here means the College office has
            published nothing.
          </p>
        </section>
      )}
      {notices.length > 0 && (
        <section {...stylex.props(styles.content)}>
          <ul {...stylex.props(styles.noticeList)}>
            {notices.map((notice) => (
              <li key={notice.id} {...stylex.props(styles.noticeItem)}>
                <p {...stylex.props(styles.noticeTitle)}>{notice.title}</p>
                <p {...stylex.props(styles.noticeBody)}>{notice.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
    <SiteFooter />
  </>
);
