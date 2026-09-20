import { StudentsPage } from "@aloysius/ui/components/students/students-page";
import { createFileRoute } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

const StudentsContent = () => {
  const { data: session } = authClient.useSession();

  /*
   * Role-gated nav entries, mirroring `/`, `/about` and `/academics`. No
   * Suspense wrapper here: like Academics this page has no CMS query to await -
   * its content is static, so it server-renders in one pass.
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

  return <StudentsPage extraNavItems={extraNavItems} />;
};

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Student Life | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "Sports, clubs and societies, the house system and the Prefects' Guild at St. Aloysius' College, Galle - life beyond the classroom for every Aloysian.",
      },
    ],
  }),
  component: StudentsContent,
});
