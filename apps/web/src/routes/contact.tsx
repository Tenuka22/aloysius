import { ContactPage } from "@aloysius/ui/components/pages/contact-page";
import { blocksToContactProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

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

  return <ContactPage {...cmsProps} extraNavItems={extraNavItems} />;
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
