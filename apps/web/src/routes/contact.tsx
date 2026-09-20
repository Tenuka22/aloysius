import { ContactPage } from "@aloysius/ui/components/contact/contact-page";
import { createFileRoute } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

const ContactContent = () => {
  const { data: session } = authClient.useSession();

  /*
   * Role-gated nav entries, mirroring `/`, `/about` and `/academics`. No
   * Suspense wrapper: this page has no CMS query to await, so it server-renders
   * in one pass.
   */
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

  /*
   * No `onSubmit` is passed: there is no enquiry endpoint, and no backend change
   * was in scope here. The form validates and then states plainly that the
   * message was not sent, pointing the visitor at the office details beside it -
   * rather than showing a success message for a message nobody received.
   */
  return <ContactPage extraNavItems={extraNavItems} />;
};

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "Contact St. Aloysius' College, Galle - College office address, telephone, email and office hours, with an enquiry form for admissions, academic and alumni questions.",
      },
    ],
  }),
  component: ContactContent,
});
