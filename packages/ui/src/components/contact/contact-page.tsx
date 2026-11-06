import * as stylex from "@stylexjs/stylex";

import {
  CONTACT_FORM_CLOSED_NOTE,
  CONTACT_FORM_ENQUIRY_EYEBROW,
  CONTACT_FORM_ENQUIRY_HEADING_LINES,
  CONTACT_FORM_ENQUIRY_INTRO,
} from "../../content/contact";
import type { NavItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";
import { DcEyebrow, DcSection } from "../home/dc";
import { SkipLink } from "../primitives/layout";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { ContactForm } from "./contact-form";
import type { ContactFormProps } from "./contact-form";
import { ContactHero } from "./contact-hero";
import type { ContactHeroProps } from "./contact-hero";
import { ContactMap } from "./contact-map";
import type { ContactMapProps } from "./contact-map";

const MAIN_ID = "main-content";

const styles = stylex.create({
  // Same reasoning as the other pages: the skip-link target is focusable, so
  // suppress only its own focus ring.
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
  /*
   * Measurements are the approved design's (Contact.dc.html): a 120px green
   * section, a 1240px inner, and a two-column split that collapses at the
   * design's 340px track floor.
   */
  formSection: {
    paddingBlock: "clamp(64px, 10vw, 120px)",
  },
  watermark: {
    position: "absolute",
    insetInlineStart: "-140px",
    insetBlockEnd: "-180px",
    height: "560px",
    width: "auto",
    opacity: 0.05,
    pointerEvents: "none",
    display: {
      default: "none",
      [bp.md]: "block",
    },
  },
  formLayout: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: "clamp(40px, 6vw, 96px)",
    alignItems: "start",
    width: "100%",
    maxWidth: "1240px",
    marginInline: "auto",
  },
  eyebrow: {
    marginBlockEnd: "18px",
  },
  heading: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: "clamp(36px, 4.4vw, 52px)",
    lineHeight: 1.05,
  },
  intro: {
    margin: 0,
    marginBlock: "20px 32px",
    maxWidth: "38ch",
    fontSize: "15px",
    lineHeight: 1.75,
    color: "rgba(255, 248, 231, 0.7)",
    textWrap: "pretty",
  },
  facts: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    margin: 0,
    padding: 0,
    listStyle: "none",
    fontSize: "13.5px",
    color: "rgba(255, 248, 231, 0.75)",
  },
  fact: {
    display: "flex",
    alignItems: "baseline",
    gap: "12px",
  },
  diamond: {
    flexShrink: 0,
    inlineSize: "7px",
    blockSize: "7px",
    backgroundColor: "#FFB203",
    transform: "rotate(45deg)",
  },
});

export interface ContactPageProps
  extends ContactHeroProps, ContactMapProps, ContactFormProps {
  contact?: FooterContact;
  extraNavItems?: NavItem[];
}

export const ContactPage = ({
  address,
  contact,
  departments,
  email,
  extraNavItems,
  mapUrl,
  mapEmbedUrl,
  officeHours,
  onSubmit,
  intro,
  title,
  telephone,
}: ContactPageProps) => {
  const [firstLine, secondLine] = CONTACT_FORM_ENQUIRY_HEADING_LINES;
  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <SiteHeader activeHref="/contact" extraNavItems={extraNavItems} />
      <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
        <ContactHero
          address={address}
          email={email}
          intro={intro}
          officeHours={officeHours}
          telephone={telephone}
          title={title}
        />
        <ContactMap mapEmbedUrl={mapEmbedUrl} mapUrl={mapUrl} />
        <DcSection
          id="contact-form"
          labelledBy="contact-form-title"
          style={styles.formSection}
          tone="green"
        >
          <img
            alt=""
            aria-hidden="true"
            decoding="async"
            loading="lazy"
            src="/logo.png"
            {...stylex.props(styles.watermark)}
          />
          <div {...stylex.props(styles.formLayout)}>
            <div>
              <DcEyebrow gold style={styles.eyebrow}>
                {CONTACT_FORM_ENQUIRY_EYEBROW}
              </DcEyebrow>
              <h2 id="contact-form-title" {...stylex.props(styles.heading)}>
                {firstLine} <br />
                {secondLine}
              </h2>
              <p {...stylex.props(styles.intro)}>
                {CONTACT_FORM_ENQUIRY_INTRO}
              </p>
              <ul {...stylex.props(styles.facts)}>
                {officeHours ? (
                  <li {...stylex.props(styles.fact)}>
                    <span
                      aria-hidden="true"
                      {...stylex.props(styles.diamond)}
                    />
                    Office hours: {officeHours}
                  </li>
                ) : null}
                <li {...stylex.props(styles.fact)}>
                  <span aria-hidden="true" {...stylex.props(styles.diamond)} />
                  {CONTACT_FORM_CLOSED_NOTE}
                </li>
              </ul>
            </div>
            <ContactForm
              departments={departments}
              mailTo={email}
              onSubmit={onSubmit}
            />
          </div>
        </DcSection>
      </main>
      <SiteFooter contact={contact} />
    </>
  );
};
