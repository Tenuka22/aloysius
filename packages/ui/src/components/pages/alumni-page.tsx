import * as stylex from "@stylexjs/stylex";

import {
  ALUMNI_BRANCH_CARDS,
  ALUMNI_BRANCHES_EYEBROW,
  ALUMNI_BRANCHES_TITLE,
  ALUMNI_HERO_INTRO,
  ALUMNI_HERO_TITLE,
  ALUMNI_NOTABLES,
  ALUMNI_NOTABLES_EYEBROW,
  ALUMNI_NOTABLES_LABEL,
  ALUMNI_NOTABLES_TITLE,
  ALUMNI_OBA_LABEL,
  ALUMNI_OFFER_HEADING,
  ALUMNI_OFFER_ITEMS,
} from "../../content/alumni";
import type {
  AlumniBranch,
  AlumniOfferItem,
  DistinguishedAloysian,
} from "../../content/alumni";
import type { NavItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import {
  Container,
  Eyebrow,
  Heading,
  Section,
  SkipLink,
} from "../primitives/layout";
import { Media } from "../primitives/media";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";

const MAIN_ID = "main-content";

/** The default title breaks after "Aloysian,"; a CMS-edited title is shown as is. */
const DEFAULT_TITLE_BREAK = "Once an Aloysian,";

const styles = stylex.create({
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },

  /* ------------------------------------------------------------------ hero */
  hero: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    paddingBlock: space["3xl"],
    paddingInline: space.gutter,
  },
  watermark: {
    position: "absolute",
    insetInlineEnd: "-5.5rem",
    insetBlockStart: "-3.5rem",
    height: "30rem",
    width: "auto",
    opacity: 0.07,
    pointerEvents: "none",
    display: {
      default: "none",
      [bp.md]: "block",
    },
  },
  content: {
    position: "relative",
  },
  breadcrumb: {
    margin: 0,
    marginBlockEnd: space.md,
    fontSize: font.sizeXs,
    fontWeight: font.weightSemibold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onInverseSubtle,
  },
  breadcrumbLink: {
    display: "inline-flex",
    alignItems: "center",
    minBlockSize: {
      default: "1.5rem",
      [bp.touch]: "2.75rem",
    },
    color: {
      default: color.onInverseSubtle,
      ":hover": color.accentOnInverse,
    },
    textDecoration: "none",
  },
  breadcrumbCurrent: {
    color: color.accentOnInverse,
  },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.size4xl,
    lineHeight: font.leadingTight,
    letterSpacing: font.trackingTight,
    textWrap: "balance",
  },
  intro: {
    margin: 0,
    marginBlockStart: space.md,
    maxWidth: space.measure,
    fontSize: font.sizeLg,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseMuted,
    textWrap: "pretty",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.sm,
    marginBlockStart: space.xl,
  },
  outlineButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minBlockSize: "2.75rem",
    paddingBlock: space.xs,
    paddingInline: space.lg,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: "rgba(255, 248, 231, 0.6)",
      ":hover": color.accent,
    },
    color: {
      default: color.onInverse,
      ":hover": color.accentOnInverse,
    },
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    textDecoration: "none",
    transitionProperty: "color, border-color",
    transitionDuration: motionToken.fast,
  },

  /* ----------------------------------------------------------------- offer */
  offerGrid: {
    display: "grid",
    margin: 0,
    padding: 0,
    listStyle: "none",
    gap: space.lg,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.sm]: "repeat(2, minmax(0, 1fr))",
      [bp.xl]: "repeat(4, minmax(0, 1fr))",
    },
  },
  offerCard: {
    paddingBlock: space.lg,
    paddingInline: space.lg,
    backgroundColor: color.surfaceRaised,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
  },
  offerTitle: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeLg,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
  },
  offerBody: {
    margin: 0,
    marginBlockStart: space.xs,
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
  },

  /* -------------------------------------------------------------- branches */
  header: {
    marginBlockEnd: space.xl,
  },
  branchGrid: {
    display: "grid",
    margin: 0,
    padding: 0,
    listStyle: "none",
    gap: space.lg,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.md]: "repeat(2, minmax(0, 1fr))",
      [bp.xl]: "repeat(3, minmax(0, 1fr))",
    },
  },
  branchCard: {
    paddingBlock: space.lg,
    paddingInline: space.lg,
    backgroundColor: color.surfaceRaised,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    borderBlockStartWidth: "2px",
    borderBlockStartColor: color.accent,
  },
  branchName: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
  },
  branchContact: {
    margin: 0,
    marginBlockStart: space.xs,
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
  branchLink: {
    display: "inline-flex",
    alignItems: "center",
    minBlockSize: "2.75rem",
    marginBlockStart: space.sm,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    color: {
      default: color.onSurface,
      ":hover": color.accentOnSurface,
    },
    textDecoration: "none",
    borderBlockEndWidth: "2px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.accent,
  },

  /* --------------------------------------------------------- hall of fame */
  fame: {
    position: "relative",
    backgroundImage: `linear-gradient(135deg, #000000, ${color.surfaceInverse})`,
  },
  notableGrid: {
    display: "grid",
    margin: 0,
    padding: 0,
    listStyle: "none",
    gap: space.lg,
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      [bp.xl]: "repeat(4, minmax(0, 1fr))",
    },
  },
  notableRole: {
    margin: 0,
    marginBlockStart: space.sm,
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  notableName: {
    margin: 0,
    marginBlockStart: space.sm,
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
    color: color.onInverse,
  },
  notableNameTight: {
    marginBlockStart: space["3xs"],
  },
  notableField: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  notableFieldSpaced: {
    marginBlockStart: space.sm,
  },
});

export interface AlumniPageProps {
  heading?: string;
  tagline?: string;
  /** The Association's own site; adds a second hero button when set. */
  obaHref?: string;
  obaLabel?: string;
  offerItems?: readonly AlumniOfferItem[];
  branches?: readonly AlumniBranch[];
  notables?: readonly DistinguishedAloysian[];
  contact?: FooterContact;
  extraNavItems?: readonly NavItem[];
}

const OfferCard = ({ item }: { item: AlumniOfferItem }) => (
  <li {...stylex.props(styles.offerCard)}>
    <h3 {...stylex.props(styles.offerTitle)}>{item.title}</h3>
    <p {...stylex.props(styles.offerBody)}>{item.body}</p>
  </li>
);

const BranchCard = ({ branch }: { branch: AlumniBranch }) => (
  <li {...stylex.props(styles.branchCard)}>
    <h3 {...stylex.props(styles.branchName)}>{branch.name}</h3>
    {branch.contact ? (
      <p {...stylex.props(styles.branchContact)}>{branch.contact}</p>
    ) : null}
    {branch.href ? (
      <a href={branch.href} {...stylex.props(styles.branchLink)}>
        Branch Details &rarr;
      </a>
    ) : null}
  </li>
);

const NotableCard = ({ notable }: { notable: DistinguishedAloysian }) => (
  <li>
    <Media placeholder="Portrait" ratio="4:5" source={notable.image} />
    {notable.role ? (
      <p {...stylex.props(styles.notableRole)}>{notable.role}</p>
    ) : null}
    {notable.name ? (
      <p
        {...stylex.props(
          styles.notableName,
          Boolean(notable.role) && styles.notableNameTight
        )}
      >
        {notable.name}
      </p>
    ) : null}
    <p
      {...stylex.props(
        styles.notableField,
        !notable.name && !notable.role && styles.notableFieldSpaced
      )}
    >
      {notable.field}
    </p>
  </li>
);

export const AlumniPage = ({
  heading = ALUMNI_HERO_TITLE,
  tagline = ALUMNI_HERO_INTRO,
  obaHref,
  obaLabel = ALUMNI_OBA_LABEL,
  offerItems = ALUMNI_OFFER_ITEMS,
  branches = ALUMNI_BRANCH_CARDS,
  notables = ALUMNI_NOTABLES,
  contact,
  extraNavItems,
}: AlumniPageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="/alumni" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <section
        aria-labelledby="alumni-hero-title"
        {...stylex.props(styles.hero)}
      >
        <img
          alt=""
          aria-hidden="true"
          decoding="async"
          loading="lazy"
          src="/logo.png"
          {...stylex.props(styles.watermark)}
        />
        <Container>
          <div {...stylex.props(styles.content)}>
            <nav aria-label="Breadcrumb">
              <p {...stylex.props(styles.breadcrumb)}>
                <a href="/" {...stylex.props(styles.breadcrumbLink)}>
                  Home
                </a>{" "}
                /{" "}
                <span {...stylex.props(styles.breadcrumbCurrent)}>Alumni</span>
              </p>
            </nav>
            <h1 id="alumni-hero-title" {...stylex.props(styles.title)}>
              {heading === ALUMNI_HERO_TITLE ? (
                <>
                  {DEFAULT_TITLE_BREAK}
                  <br />
                  {heading.slice(DEFAULT_TITLE_BREAK.length).trim()}
                </>
              ) : (
                heading
              )}
            </h1>
            {tagline ? <p {...stylex.props(styles.intro)}>{tagline}</p> : null}
            <div {...stylex.props(styles.actions)}>
              {notables.length > 0 ? (
                <a
                  href="#distinguished"
                  {...stylex.props(styles.outlineButton)}
                >
                  {ALUMNI_NOTABLES_LABEL}
                </a>
              ) : null}
              {obaHref ? (
                <a
                  href={obaHref}
                  rel="noopener noreferrer"
                  target="_blank"
                  {...stylex.props(styles.outlineButton)}
                >
                  {obaLabel}
                </a>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      {offerItems.length > 0 ? (
        <Section id="offer" labelledBy="offer-title" tone="surface">
          <Container>
            <div {...stylex.props(styles.header)}>
              <Heading id="offer-title" level={2}>
                {ALUMNI_OFFER_HEADING}
              </Heading>
            </div>
            <ul {...stylex.props(styles.offerGrid)}>
              {offerItems.map((item) => (
                <OfferCard item={item} key={item.id} />
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {branches.length > 0 ? (
        <Section id="branches" labelledBy="branches-title" tone="surface">
          <Container>
            <div {...stylex.props(styles.header)}>
              <Eyebrow>{ALUMNI_BRANCHES_EYEBROW}</Eyebrow>
              <Heading id="branches-title" level={2}>
                {ALUMNI_BRANCHES_TITLE}
              </Heading>
            </div>
            <ul {...stylex.props(styles.branchGrid)}>
              {branches.map((branch) => (
                <BranchCard branch={branch} key={branch.id} />
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {notables.length > 0 ? (
        <Section
          id="distinguished"
          labelledBy="distinguished-title"
          tone="inverse"
          style={styles.fame}
        >
          <Container>
            <div {...stylex.props(styles.header)}>
              <Eyebrow inverse>{ALUMNI_NOTABLES_EYEBROW}</Eyebrow>
              <Heading id="distinguished-title" level={2}>
                {ALUMNI_NOTABLES_TITLE}
              </Heading>
            </div>
            <ul {...stylex.props(styles.notableGrid)}>
              {notables.map((notable) => (
                <NotableCard key={notable.id} notable={notable} />
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}
    </main>
    <SiteFooter contact={contact} />
  </>
);
