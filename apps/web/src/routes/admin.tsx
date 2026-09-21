import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";
import { authClient } from "@/lib/auth-client";

const md = "@media (min-width: 40rem)";

const styles = stylex.create({
  wrap: {
    paddingBlockStart: space.md,
    paddingBlockEnd: space.md,
    paddingInlineStart: space.md,
    paddingInlineEnd: space.md,
    [md]: {
      paddingBlockStart: space.lg,
      paddingBlockEnd: space.lg,
      paddingInlineStart: space.lg,
      paddingInlineEnd: space.lg,
    },
  },
  heading: {
    margin: 0,
    marginBlockEnd: space.md,
    fontSize: font.size2xl,
    fontWeight: font.weightBold,
    lineHeight: font.leadingTight,
    color: color.onSurface,
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: space.lg,
  },
  card: {
    padding: space.lg,
    borderRadius: space.sm,
    backgroundColor: color.surfaceRaised,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
  },
  cardTitle: {
    margin: 0,
    fontSize: font.sizeLg,
    fontWeight: font.weightSemibold,
    color: color.onSurface,
  },
  cardDesc: {
    margin: 0,
    marginBlockStart: space.xs,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
  },
});

const ADMIN_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/admin" },
  { id: "cms", label: "CMS", href: "/cms" },
  { id: "users", label: "Users", href: "/admin/users" },
] as const;

const AdminContent = () => {
  const { data: session } = authClient.useSession();

  return (
    <AdminShell
      title="Admin Panel"
      eyebrow="Administration"
      navItems={ADMIN_NAV_ITEMS}
      userName={session?.user?.name ?? "Admin"}
      userRole={session?.user?.role ?? "admin"}
    >
      <div {...stylex.props(styles.wrap)}>
        <h1 {...stylex.props(styles.heading)}>Admin Dashboard</h1>
        <div {...stylex.props(styles.cardGrid)}>
          <div {...stylex.props(styles.card)}>
            <h2 {...stylex.props(styles.cardTitle)}>CMS</h2>
            <p {...stylex.props(styles.cardDesc)}>
              Manage website content through the CMS editor.
            </p>
          </div>
          <div {...stylex.props(styles.card)}>
            <h2 {...stylex.props(styles.cardTitle)}>Users</h2>
            <p {...stylex.props(styles.cardDesc)}>
              Manage user accounts and roles.
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminContent,
});
