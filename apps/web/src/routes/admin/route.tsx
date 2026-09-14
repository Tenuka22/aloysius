import { Theme } from "@astryxdesign/core";
import { AppShell } from "@astryxdesign/core/AppShell";
import { LinkProvider } from "@astryxdesign/core/Link";
import {
  SideNav,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from "@astryxdesign/core/SideNav";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import {
  createFileRoute,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";

import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "@astryxdesign/theme-neutral/theme.css";

import { AstryxRouterLink } from "@/components/astryx-router-link";

const AdminLayout = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <Theme theme={neutralTheme}>
      <LinkProvider component={AstryxRouterLink}>
        <AppShell
          contentPadding={0}
          sideNav={
            <SideNav header={<SideNavHeading heading="Admin" />}>
              <SideNavSection title="Overview">
                <SideNavItem
                  href="/admin"
                  isSelected={pathname === "/admin"}
                  label="Dashboard"
                />
              </SideNavSection>
              <SideNavSection title="Staff">
                <SideNavItem
                  href="/admin/staff"
                  isSelected={pathname.startsWith("/admin/staff")}
                  label="Staff"
                />
              </SideNavSection>
            </SideNav>
          }
        >
          <Outlet />
        </AppShell>
      </LinkProvider>
    </Theme>
  );
};

export const Route = createFileRoute("/admin")({ component: AdminLayout });
