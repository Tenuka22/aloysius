import * as stylex from "@stylexjs/stylex";

import {
  ALUMNI_ABOUT_BODY,
  ALUMNI_ABOUT_CAPTION,
  ALUMNI_ABOUT_HEADING,
  ALUMNI_BRANCHES,
  ALUMNI_BRANCHES_HEADING,
  ALUMNI_BRANCHES_INTRO,
  ALUMNI_EVENTS_LABEL,
  ALUMNI_HERO_INTRO,
  ALUMNI_HERO_TITLE,
  ALUMNI_LINKS_BODY,
  ALUMNI_LINKS_HEADING,
  ALUMNI_OBA_LABEL,
  ALUMNI_OFFER_HEADING,
  ALUMNI_OFFER_ITEMS,
} from "../../content/alumni";
import type { AlumniOfferItem } from "../../content/alumni";
import type { NavItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { ButtonLink } from "../primitives/button";
import {
  Container,
  Heading,
  Lead,
  Section,
  SkipLink,
} from "../primitives/layout";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { Reveal } from "../primitives/reveal";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";

/**
 * The Old Boys' Association page.
 *
 * Three bands: a compact cream masthead, the Association's own account of
 * itself set against its photograph, and a short "how to get back in touch"
 * close. The page used to render the masthead, one paragraph of body copy and a
 * pair of buttons - while `content/alumni.ts` carried two further headings and
 * three more paragraphs that nothing on the page ever read, so the page shipped
 * with less copy than the project had already written for it.
 *
 * The close sits on the deep-green band rather than a cream one, so the page
 * ends on the invitation instead of trailing off after a paragraph.
 */

const MAIN_ID = "main-content";

const styles = stylex.create({
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },

  /* ---- the masthead ---- */
  header: {
    paddingBlock: space["2xl"],
    paddingInline: space.gutter,
    backgroundColor: color.surface,
  },
  title: {
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

  /* ---- the Association ---- */
  /*
   * Text and photograph side by side from `lg`, stacking below it. The copy is
   * the point of this band, so it takes the wider track and holds its own
   * measure rather than stretching the full width of the container.
   */
  about: {
    display: "grid",
    gap: space.xl,
    alignItems: "start",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.lg]: "minmax(0, 1.2fr) minmax(0, 1fr)",
    },
    columnGap: space["2xl"],
  },
  body: {
    margin: 0,
    marginBlockStart: space.md,
    maxInlineSize: "62ch",
    fontSize: font.sizeMd,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  /* ---- what the Association does ---- */
  offerIntro: {
    marginBlockEnd: space.xl,
  },
  /*
   * A plain divided list rather than icon-plus-heading-plus-text cards: four
   * short facts restated from the paragraph above, not a fourth repetition of
   * the card grid this page already uses for its nav and footer.
   */
  offerGrid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    padding: 0,
    gap: space.xl,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.sm]: "repeat(2, minmax(0, 1fr))",
    },
    columnGap: space["2xl"],
  },
  offerItem: {
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.border,
    paddingBlockStart: space.md,
  },
  offerTitle: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeLg,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
  },
  offerBody: {
    margin: 0,
    marginBlockStart: space["2xs"],
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },

  /* ---- where to find the Association ---- */
  branchesHeading: {
    marginBlockEnd: space.sm,
  },
  branchesIntro: {
    marginBlockEnd: space.xl,
  },
  /*
   * The three branch names set as a single typographic line with interpunct
   * separators - exactly the fact the body copy already states ("Branches in
   * Galle, Colombo and overseas") - rather than three more matching cards.
   */
  branchesList: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  branchesItem: {
    display: "flex",
    alignItems: "baseline",
  },
  branchesName: {
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    color: color.onSurface,
  },
  branchesDot: {
    marginInline: space.md,
    fontSize: font.size2xl,
    color: color.borderAccent,
  },
  /* ---- the close ---- */
  closeHeading: {
    color: color.onInverse,
  },
  closeLead: {
    maxInlineSize: "52ch",
  },
  /*
   * Two buttons, side by side from `sm` and full-width on a phone. `fluid` on
   * each is what lets them stack cleanly rather than being squeezed to two
   * cramped halves at 320px.
   */
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.md,
    marginBlockStart: space.xl,
  },
  action: {
    /*
     * Pushed to the leading edge rather than stretched: these are two
     * destinations, not a form, and a full-bleed button each would read as the
     * page's only action.
     */
    flex: {
      default: "1 1 100%",
      [bp.sm]: "0 0 auto",
    },
  },
});

export interface AlumniPageProps {
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  /** The Association's own account of itself, under `aboutHeading`. */
  aboutHeading?: string;
  body?: string;
  image?: ImageSource;
  /** Caption for `image`, also its alt text. */
  imageCaption?: string;
  offerHeading?: string;
  /** Fixed facts restated from `body`; not independently CMS-editable. */
  offerItems?: readonly AlumniOfferItem[];
  branchesHeading?: string;
  branchesIntro?: string;
  branches?: readonly string[];
  linksHeading?: string;
  linksBody?: string;
  obaHref?: string;
  eventsHref?: string;
  obaLabel?: string;
  eventsLabel?: string;
  contact?: FooterContact;
  extraNavItems?: readonly NavItem[];
}

/** "What the Association Does", a fixed list restated from `body` copy. */
const OfferSection = ({
  heading,
  items,
}: {
  heading: string;
  items: readonly AlumniOfferItem[];
}) =>
  items.length > 0 ? (
    <Section id="offer" labelledBy="offer-title" tone="raised">
      <Container>
        <Heading id="offer-title" level={2} style={styles.offerIntro}>
          {heading}
        </Heading>
        <ul {...stylex.props(styles.offerGrid)}>
          {items.map((item) => (
            <li key={item.id} {...stylex.props(styles.offerItem)}>
              <h3 {...stylex.props(styles.offerTitle)}>{item.title}</h3>
              <p {...stylex.props(styles.offerBody)}>{item.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  ) : null;

/** "Where to Find the Association", the branches named in `body` copy. */
const BranchesSection = ({
  heading,
  intro,
  branches,
}: {
  heading: string;
  intro?: string;
  branches: readonly string[];
}) =>
  branches.length > 0 ? (
    <Section id="branches" labelledBy="branches-title" tone="surface">
      <Container>
        <Heading id="branches-title" level={2} style={styles.branchesHeading}>
          {heading}
        </Heading>
        {intro ? <Lead style={styles.branchesIntro}>{intro}</Lead> : null}
        <ul {...stylex.props(styles.branchesList)}>
          {branches.map((name, index) => (
            <li key={name} {...stylex.props(styles.branchesItem)}>
              <span {...stylex.props(styles.branchesName)}>{name}</span>
              {index < branches.length - 1 ? (
                <span aria-hidden="true" {...stylex.props(styles.branchesDot)}>
                  ·
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  ) : null;

/** The compact masthead: title, optional tagline, optional hero photograph. */
const AlumniMasthead = ({
  heading,
  tagline,
  heroImage,
}: {
  heading: string;
  tagline?: string;
  heroImage?: ImageSource;
}) => (
  <header {...stylex.props(styles.header)}>
    <Container>
      <h1 {...stylex.props(styles.title)}>{heading}</h1>
      {tagline ? <p {...stylex.props(styles.tagline)}>{tagline}</p> : null}
      {heroImage ? (
        <Media
          placeholder=""
          ratio="16:9"
          source={heroImage}
          style={styles.heroMedia}
        />
      ) : null}
    </Container>
  </header>
);

interface CloseAction {
  href: string;
  label: string;
  external: boolean;
  key: string;
}

/*
 * The close renders whenever there is guidance copy to show, and adds buttons
 * only for destinations that exist. Gating the whole band on `actions.length`
 * would hide "Members can update their details with the branch secretary..."
 * - copy the college has published - behind a missing URL field, which is the
 * same defect as a dead button.
 */
const CloseSection = ({
  heading,
  body,
  actions,
}: {
  heading: string;
  body?: string;
  actions: readonly CloseAction[];
}) =>
  body || actions.length > 0 ? (
    <Section id="connect" labelledBy="connect-title" tone="inverse">
      <Container>
        <Heading id="connect-title" level={2} style={styles.closeHeading}>
          {heading}
        </Heading>
        {body ? (
          <Lead inverse style={styles.closeLead}>
            {body}
          </Lead>
        ) : null}
        {actions.length > 0 ? (
          <Reveal direction="up">
            <div {...stylex.props(styles.actions)}>
              {actions.map((action) => (
                <ButtonLink
                  external={action.external}
                  fluid
                  href={action.href}
                  key={action.key}
                  style={styles.action}
                  variant="solid"
                >
                  {action.label}
                </ButtonLink>
              ))}
            </div>
          </Reveal>
        ) : null}
      </Container>
    </Section>
  ) : null;

export const AlumniPage = ({
  heading = ALUMNI_HERO_TITLE,
  tagline = ALUMNI_HERO_INTRO,
  heroImage,
  aboutHeading = ALUMNI_ABOUT_HEADING,
  body = ALUMNI_ABOUT_BODY,
  image,
  imageCaption = ALUMNI_ABOUT_CAPTION,
  offerHeading = ALUMNI_OFFER_HEADING,
  offerItems = ALUMNI_OFFER_ITEMS,
  branchesHeading = ALUMNI_BRANCHES_HEADING,
  branchesIntro = ALUMNI_BRANCHES_INTRO,
  branches = ALUMNI_BRANCHES,
  linksHeading = ALUMNI_LINKS_HEADING,
  linksBody = ALUMNI_LINKS_BODY,
  obaHref,
  eventsHref,
  obaLabel = ALUMNI_OBA_LABEL,
  eventsLabel = ALUMNI_EVENTS_LABEL,
  contact,
  extraNavItems,
}: AlumniPageProps) => {
  const actions = [
    ...(obaHref
      ? [{ href: obaHref, label: obaLabel, external: true, key: "oba" }]
      : []),
    /*
     * `/events` is the college's own diary, so the alumni-events destination is
     * internal unless a CMS editor points it somewhere else. `external` is
     * decided by whether the href leaves the site rather than assumed, because
     * an external link opened in the same tab is a dead end for the visitor.
     */
    ...(eventsHref
      ? [
          {
            href: eventsHref,
            label: eventsLabel,
            external: eventsHref.startsWith("http"),
            key: "events",
          },
        ]
      : []),
  ];

  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <SiteHeader activeHref="/alumni" extraNavItems={extraNavItems} />
      <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
        <AlumniMasthead
          heading={heading}
          heroImage={heroImage}
          tagline={tagline}
        />

        <Section id="oba" labelledBy="oba-title" tone="surface">
          <Container>
            <div {...stylex.props(styles.about)}>
              <div>
                <Heading id="oba-title" level={2}>
                  {aboutHeading}
                </Heading>
                {body ? <p {...stylex.props(styles.body)}>{body}</p> : null}
              </div>
              {/*
                The photograph carries its caption as its alt text, so a screen
                reader is told what the image is of rather than being left with
                a bare file. The visible caption is the CMS's own alt field, not
                a second string to keep in sync.
              */}
              {image ? (
                <Media
                  placeholder={imageCaption}
                  ratio="4:5"
                  source={image}
                  zoom
                />
              ) : null}
            </div>
          </Container>
        </Section>

        <OfferSection heading={offerHeading} items={offerItems} />

        <BranchesSection
          branches={branches}
          heading={branchesHeading}
          intro={branchesIntro}
        />

        <CloseSection
          actions={actions}
          body={linksBody}
          heading={linksHeading}
        />
      </main>
      <SiteFooter contact={contact} />
    </>
  );
};
