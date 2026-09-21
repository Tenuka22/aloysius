import { StudentsPage } from "@aloysius/ui/components/pages/students-page";
import { blocksToStudentsProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

const StudentsContent = () => {
  const studentsQuery = orpc.cms.getStudents.queryOptions();
  const { data: students } = useSuspenseQuery(studentsQuery);
  const { data: session } = authClient.useSession();

  const cmsProps = students?.blocks
    ? blocksToStudentsProps(students.blocks)
    : {};

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

  return <StudentsPage {...cmsProps} extraNavItems={extraNavItems} />;
};

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Student Life | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "Discover the vibrant community, clubs and activities that make St. Aloysius' College a place to grow.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <StudentsContent />
    </Suspense>
  ),
});
