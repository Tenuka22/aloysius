import * as stylex from "@stylexjs/stylex";

import {
  CONTACT_FORM_ENQUIRY_EYEBROW,
  CONTACT_FORM_ENQUIRY_HEADING,
  CONTACT_FORM_ENQUIRY_INTRO,
} from "../../content/contact";
import type { NavItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import {
  Container,
  Eyebrow,
  Heading,
  Section,
  SkipLink,
} from "../primitives/layout";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { ContactDepartments } from "./contact-departments";
import { ContactDetails } from "./contact-details";
import type { ContactDetailsProps } from "./contact-details";
import { ContactForm } from "./contact-form";
import type { ContactFormProps } from "./contact-form";
import { ContactHero } from "./contact-hero";
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
   * The enquiry form sits on its own deep-green section, as in the design. The
   * card keeps its cream surface, so it stays the one raised object on the
   * page; `minmax(0, …)` stops a long error message widening the track.
   */
  formLayout: {
    position: "relative",
    display: "grid",
    gap: space["2xl"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: "minmax(0, 1fr) minmax(0, 1.4fr)",
    },
    alignItems: "start",
  },
  formIntro: {
    margin: 0,
    marginBlockStart: space.sm,
    maxWidth: "38ch",
    fontSize: font.sizeMd,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseMuted,
    textWrap: "pretty",
  },
  formFacts: {
    margin: 0,
    marginBlockStart: space.lg,
    padding: 0,
    listStyle: "none",
    fontSize: font.sizeSm,
    color: color.onInverseMuted,
  },
  formFact: {
    display: "flex",
    alignItems: "baseline",
    gap: space.xs,
  },
  diamond: {
    flexShrink: 0,
    inlineSize: "0.45rem",
    blockSize: "0.45rem",
    backgroundColor: color.accent,
    transform: "rotate(45deg)",
  },
  watermark: {
    position: "absolute",
    insetInlineStart: "-8rem",
    insetBlockEnd: "-11rem",
    height: "35rem",
    width: "auto",
    opacity: 0.05,
    pointerEvents: "none",
    display: {
      default: "none",
      [bp.md]: "block",
    },
  },
});

export interface ContactPageProps
  extends ContactDetailsProps, ContactMapProps, ContactFormProps {
  contact?: FooterContact;
  /** CMS `contact-header` copy; falls back to the page's own constants. */
  heading?: string;
  tagline?: string;
  extraNavItems?: NavItem[];
}

export const ContactPage = ({
  address,
  contact,
  email,
  extraNavItems,
  heading,
  mapImage,
  mapUrl,
  mapEmbedUrl,
  officeHours,
  onSubmit,
  tagline,
  telephone,
}: ContactPageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="/contact" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      {/*
        `heading` and `tagline` are the CMS `contact-header` block. They were
        resolved by the route and then dropped, because `ContactHero` was
        rendered with no props at all - so an editor who changed them saw no
        change on the page.
      */}
      <ContactHero intro={tagline} title={heading}>
        <ContactDetails
          address={address}
          email={email}
          officeHours={officeHours}
          telephone={telephone}
        />
      </ContactHero>
      <ContactMap
        address={address}
        mapEmbedUrl={mapEmbedUrl}
        mapImage={mapImage}
        mapUrl={mapUrl}
      />
      <ContactDepartments />
      <Section id="contact-form" labelledBy="contact-form-title" tone="inverse">
        <Container>
          <div {...stylex.props(styles.formLayout)}>
            <img
              alt=""
              aria-hidden="true"
              decoding="async"
              loading="lazy"
              src="/logo.png"
              {...stylex.props(styles.watermark)}
            />
            <div>
              <Eyebrow inverse>{CONTACT_FORM_ENQUIRY_EYEBROW}</Eyebrow>
              <Heading id="contact-form-title" level={2}>
                {CONTACT_FORM_ENQUIRY_HEADING}
              </Heading>
              <p {...stylex.props(styles.formIntro)}>
                {CONTACT_FORM_ENQUIRY_INTRO}
              </p>
              {officeHours ? (
                <ul {...stylex.props(styles.formFacts)}>
                  <li {...stylex.props(styles.formFact)}>
                    <span
                      aria-hidden="true"
                      {...stylex.props(styles.diamond)}
                    />
                    Office hours: {officeHours}
                  </li>
                </ul>
              ) : null}
            </div>
            <ContactForm mailTo={email} onSubmit={onSubmit} />
          </div>
        </Container>
      </Section>
    </main>
    <SiteFooter contact={contact} />
  </>
);
