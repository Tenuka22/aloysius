import * as stylex from "@stylexjs/stylex";

import {
  CONTACT_ADDRESS_NOTE,
  CONTACT_DEFAULT_ADDRESS,
  CONTACT_EMAIL_NOTE,
  CONTACT_HERO_INTRO,
  CONTACT_HERO_TITLE,
  CONTACT_HERO_TITLE_ACCENT,
  CONTACT_HOURS_NOTE,
  CONTACT_TELEPHONE_NOTE,
} from "../../content/contact";
import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";

/*
 * Measurements are the approved design's (Contact.dc.html): 110px top padding
 * with no bottom padding (the channel row closes the section), a 96px title
 * beside a 40ch intro, and four channels under a gold hairline. Fluid
 * `clamp()` only takes over below the design's desktop width.
 */
const styles = stylex.create({
  hero: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#013405",
    color: "#FFF8E7",
    paddingBlockStart: "clamp(64px, 9vw, 110px)",
    paddingBlockEnd: 0,
    paddingInline: "clamp(20px, 5vw, 48px)",
  },
  watermark: {
    position: "absolute",
    insetInlineEnd: "-110px",
    insetBlockStart: "-80px",
    height: "520px",
    width: "auto",
    opacity: 0.06,
    pointerEvents: "none",
    display: {
      default: "none",
      [bp.md]: "block",
    },
  },
  inner: {
    position: "relative",
    width: "100%",
    maxWidth: "1240px",
    marginInline: "auto",
  },
  breadcrumb: {
    margin: 0,
    marginBlockEnd: "26px",
    fontSize: "12px",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "rgba(255, 248, 231, 0.65)",
  },
  breadcrumbLink: {
    color: {
      default: "rgba(255, 248, 231, 0.65)",
      ":hover": "#FFB203",
    },
    textDecoration: "none",
  },
  breadcrumbCurrent: {
    color: "#FFB203",
  },
  headline: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "24px 40px",
  },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: "clamp(42px, 7vw, 96px)",
    lineHeight: 0.98,
  },
  accent: {
    fontWeight: 500,
    color: "#FFB203",
  },
  intro: {
    margin: 0,
    marginBlockEnd: "10px",
    maxWidth: "40ch",
    fontSize: "16px",
    lineHeight: 1.75,
    color: "rgba(255, 248, 231, 0.75)",
  },
  channels: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
    columnGap: "28px",
    margin: 0,
    marginBlockStart: "clamp(40px, 6vw, 70px)",
    padding: 0,
    borderBlockStartWidth: "1px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: "rgba(255, 178, 3, 0.25)",
  },
  channel: {
    paddingBlockStart: "30px",
    paddingBlockEnd: "34px",
    minWidth: 0,
  },
  channelLabel: {
    margin: 0,
    fontSize: "10.5px",
    letterSpacing: "0.24em",
    fontWeight: 800,
    color: "#FFB203",
    textTransform: "uppercase",
  },
  channelValue: {
    margin: 0,
    marginBlockStart: "12px",
    fontFamily: font.display,
    fontSize: "26px",
    fontWeight: 600,
    lineHeight: 1.2,
    overflowWrap: "anywhere",
  },
  channelLink: {
    color: {
      default: "inherit",
      ":hover": "#FFB203",
    },
    textDecoration: "none",
  },
  channelNote: {
    margin: 0,
    marginBlockStart: "8px",
    fontSize: "12.5px",
    lineHeight: 1.55,
    color: "rgba(255, 248, 231, 0.6)",
  },
});

/**
 * Strips spaces, brackets and hyphens for the `tel:` target while the visible
 * text keeps whatever formatting the CMS entered. `tel:` with spaces in it is
 * technically invalid and some Android dialers drop the call.
 */
const telHref = (telephone: string) =>
  `tel:${telephone.replaceAll(/[^+\d]/gu, "")}`;

interface Channel {
  id: string;
  label: string;
  value: string;
  note: string;
  /** `tel:`/`mailto:` target, when the value is actionable. */
  href?: string;
}

export interface ContactHeroProps {
  title?: string;
  intro?: string;
  telephone?: string;
  email?: string;
  /** Left unset until the office supplies it: a wrong set of hours misdirects. */
  officeHours?: string;
  address?: string;
  crestSrc?: string;
}

export const ContactHero = ({
  title = CONTACT_HERO_TITLE,
  intro = CONTACT_HERO_INTRO,
  telephone,
  email,
  officeHours,
  address = CONTACT_DEFAULT_ADDRESS,
  crestSrc = "/logo.png",
}: ContactHeroProps) => {
  const channels: Channel[] = [];
  if (telephone) {
    channels.push({
      id: "telephone",
      label: "Telephone",
      value: telephone,
      note: CONTACT_TELEPHONE_NOTE,
      href: telHref(telephone),
    });
  }
  if (email) {
    channels.push({
      id: "email",
      label: "Email",
      value: email,
      note: CONTACT_EMAIL_NOTE,
      href: `mailto:${email}`,
    });
  }
  if (officeHours) {
    channels.push({
      id: "hours",
      label: "Office hours",
      value: officeHours,
      note: CONTACT_HOURS_NOTE,
    });
  }
  channels.push({
    id: "address",
    label: "Address",
    value: address,
    note: CONTACT_ADDRESS_NOTE,
  });

  return (
    <section
      aria-labelledby="contact-hero-title"
      {...stylex.props(styles.hero)}
    >
      <img
        alt=""
        aria-hidden="true"
        decoding="async"
        loading="lazy"
        src={crestSrc}
        {...stylex.props(styles.watermark)}
      />
      <div {...stylex.props(styles.inner)}>
        <nav aria-label="Breadcrumb">
          <p {...stylex.props(styles.breadcrumb)}>
            <a href="/" {...stylex.props(styles.breadcrumbLink)}>
              Home
            </a>{" "}
            &nbsp;/&nbsp;{" "}
            <span {...stylex.props(styles.breadcrumbCurrent)}>Contact</span>
          </p>
        </nav>
        <div {...stylex.props(styles.headline)}>
          <h1 id="contact-hero-title" {...stylex.props(styles.title)}>
            {title === CONTACT_HERO_TITLE ? (
              <>
                {title.slice(0, -CONTACT_HERO_TITLE_ACCENT.length).trimEnd()}{" "}
                <br />
                <em {...stylex.props(styles.accent)}>
                  {CONTACT_HERO_TITLE_ACCENT}
                </em>
              </>
            ) : (
              title
            )}
          </h1>
          <p {...stylex.props(styles.intro)}>{intro}</p>
        </div>

        <dl {...stylex.props(styles.channels)}>
          {channels.map(({ id, label, value, note, href }) => (
            <div key={id} {...stylex.props(styles.channel)}>
              <dt {...stylex.props(styles.channelLabel)}>{label}</dt>
              <dd {...stylex.props(styles.channelValue)}>
                {href ? (
                  <a href={href} {...stylex.props(styles.channelLink)}>
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
              <dd {...stylex.props(styles.channelNote)}>{note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
