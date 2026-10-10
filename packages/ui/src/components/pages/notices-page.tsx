import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { color, font, space } from "../../tokens/tokens.stylex";
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
  hero: {
    paddingBlockStart: space["3xl"],
    paddingBlockEnd: space.xl,
    paddingInline: space.md,
    backgroundColor: color.surface,
    textAlign: "center",
  },
  eyebrow: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  heading: {
    margin: 0,
    marginBlockStart: space.sm,
    fontFamily: font.display,
    fontSize: font.size4xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    color: color.onSurface,
  },
  tagline: {
    margin: 0,
    marginBlockStart: space.sm,
    maxWidth: space.measure,
    marginInline: "auto",
    fontSize: font.sizeLg,
    lineHeight: font.leadingNormal,
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
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  /** The CMS announcements. Empty is a real state, not a placeholder. */
  notices?: readonly NoticeSummary[];
  /** Unused; kept for a stale caller. Was only printed inside placeholder text. */
  pinUrgent?: never;
  extraNavItems?: readonly NavItem[];
}

export interface NoticeSummary {
  id: string;
  title: string;
  body: string;
}

export const NoticesPage = ({
  eyebrow,
  heading = "Notices",
  tagline,
  heroImage,
  notices = NO_NOTICES,
  extraNavItems,
}: NoticesPageProps) => (
  <>
    <SiteHeader activeHref="/notices" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <section {...stylex.props(styles.hero)}>
        {eyebrow && <p {...stylex.props(styles.eyebrow)}>{eyebrow}</p>}
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
          <p {...stylex.props(styles.eyebrow)}>Announcements</p>
          <h2 {...stylex.props(styles.heading)}>Nothing to report</h2>
          <p>
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
