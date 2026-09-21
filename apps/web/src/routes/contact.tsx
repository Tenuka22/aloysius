import { ContactPage } from "@aloysius/ui/components/pages/contact-page";
import { blocksToContactProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

const ContactContent = () => {
  const contactQuery = orpc.cms.getContact.queryOptions();
  const { data: contact } = useSuspenseQuery(contactQuery);
  const { data: session } = authClient.useSession();

  const cmsProps = contact?.blocks ? blocksToContactProps(contact.blocks) : {};

  const extraNavItems = (() => {
    if (!session?.user) {
      return [];
    }
    const items = [];
    const { role } = session.user;
    if (role === "admin" || role === "cms") {
      items.push({ id: "cms", label: "CMS", href: "/cms" });
    }
    if (role === "admin" || role === "teacher") {
      items.push({
        id: "students-admin",
        label: "Manage Students",
        href: "/student-officer",
      });
    }
    if (role === "admin" || role === "teacher") {
      items.push({ id: "teachers-admin", label: "Staff", href: "/teacher" });
    }
    if (role === "admin") {
      items.push({ id: "admin", label: "Admin", href: "/admin" });
    }
    return items;
  })();

  return <ContactPage {...cmsProps} extraNavItems={extraNavItems} />;
};

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "Get in touch with St. Aloysius' College, Galle - admissions, inquiries and general information.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <ContactContent />
    </Suspense>
  ),
});
