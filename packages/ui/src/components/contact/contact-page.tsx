import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { space } from "../../tokens/tokens.stylex";
import { Container, Section, SkipLink } from "../primitives/layout";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { ContactDetails } from "./contact-details";
import type { ContactDetailsProps } from "./contact-details";
import { ContactForm } from "./contact-form";
import type { ContactFormProps } from "./contact-form";
import { ContactHero } from "./contact-hero";

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
   * Details and form share a row only from 64rem (1024px). The mock put them
   * side by side unconditionally at `420px 1fr`; below ~900px that leaves the
   * form under 420px wide with a two-column field grid inside it. Stacking
   * until there is genuinely room for both is what keeps every field usable on
   * tablets in portrait.
   *
   * `minmax(0, …)` on both tracks, not `420px 1fr`: a fixed first track cannot
   * shrink, so a long email address in the details list would push the grid
   * wider than the viewport.
   */
  layout: {
    display: "grid",
    gridTemplateColumns: {
      default: "1fr",
      [bp.xl]: "minmax(0, 24rem) minmax(0, 1fr)",
      [bp.xxl]: "minmax(0, 26rem) minmax(0, 1fr)",
    },
    gap: space.xl,
    alignItems: "start",
  },
});

export interface ContactPageProps
  extends ContactDetailsProps, ContactFormProps {
  contact?: FooterContact;
  extraNavItems?: readonly NavItem[];
}

export const ContactPage = ({
  address,
  contact,
  email,
  extraNavItems,
  mapImage,
  mapUrl,
  officeHours,
  onSubmit,
  telephone,
}: ContactPageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="/contact" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <ContactHero />
      <Section id="contact-details" tone="surface">
        <Container>
          <div {...stylex.props(styles.layout)}>
            <ContactDetails
              address={address}
              email={email}
              mapImage={mapImage}
              mapUrl={mapUrl}
              officeHours={officeHours}
              telephone={telephone}
            />
            <ContactForm onSubmit={onSubmit} />
          </div>
        </Container>
      </Section>
    </main>
    <SiteFooter contact={contact} />
  </>
);
