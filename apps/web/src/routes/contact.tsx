import { ContactPage } from "@aloysius/ui/components/contact/contact-page";
import { blocksToContactProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

/**
 * `/contact` - the College office's details and the enquiry form.
 *
 * This route used to render `components/pages/contact-page.tsx`, a much plainer
 * duplicate that had no form at all: the address, telephone and email were plain
 * text with no `tel:`/`mailto:` links, which on a contact page means the visitor
 * cannot actually make contact from the page they came to. The real page -
 * `components/contact/`, with a hero, the details list and a validated enquiry
 * form - was built and never imported.
 *
 * No `onSubmit` is passed: there is no enquiry endpoint in the backend yet, so
 * a valid submit says in the live region that the message was *not* sent and
 * points at the office details beside it. Wiring the endpoint up later is one
 * prop.
 */

const ContactContent = () => {
  const contactQuery = orpc.cms.getContact.queryOptions();
  const { data: contact } = useSuspenseQuery(contactQuery);
  const { data: session } = authClient.useSession();

  /* Always call the mapper so an unpublished page falls back to content/contact.ts. */
  const cmsProps = blocksToContactProps(contact?.blocks ?? []);

  const extraNavItems = (() => {
    if (!session?.user) {
      return [];
    }
    const items = [];
    const { role } = session.user;
    if (role === "admin" || role === "cms") {
      items.push({ id: "cms", label: "CMS", href: "/cms" });
    }
    if (role === "admin") {
      items.push({ id: "admin", label: "Admin", href: "/admin" });
    }
    return items;
  })();

  return (
    <ContactPage
      address={cmsProps.address}
      contact={{
        address: cmsProps.address,
        email: cmsProps.email,
        telephone: cmsProps.telephone,
        facebookUrl: cmsProps.facebookUrl,
        instagramUrl: cmsProps.instagramUrl,
        youtubeUrl: cmsProps.youtubeUrl,
      }}
      email={cmsProps.email}
      extraNavItems={extraNavItems}
      heading={cmsProps.heading}
      mapEmbedUrl={cmsProps.mapEmbedUrl}
      mapUrl={cmsProps.mapUrl}
      officeHours={cmsProps.officeHours}
      tagline={cmsProps.tagline}
      telephone={cmsProps.telephone}
    />
  );
};

export const Route = createFileRoute("/contact")({
  head: () =>
    pageHead({
      description:
        "Get in touch with St. Aloysius' College, Galle - admissions, inquiries and general information.",
      path: "/contact",
      title: "Contact | St. Aloysius' College, Galle",
    }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <ContactContent />
    </Suspense>
  ),
});
