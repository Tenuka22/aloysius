import type { ShellNavItem } from "@aloysius/ui/components/shell";
import { Shell } from "@aloysius/ui/components/shell";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

/**
 * The frame around every signed-in workspace: the CMS, the administration panel
 * and the club portal.
 *
 * One wrapper for all three because they are the same screen with different
 * words in it - a sidebar, a topbar and a sign-out. Each surface supplies its
 * own `brandName`/`brandSub` and its own nav, which is the only thing that
 * actually differs between them. Splitting this per surface is how the three
 * drift apart.
 */
export interface WorkspaceShellProps {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  navItems: readonly ShellNavItem[];
  userName: string;
  userRole: string;
  /** Sidebar heading, e.g. "Admin" or "Photography Club". */
  brandName: string;
  /** Optional sub-label under the brand, e.g. "Content manager". */
  brandSub?: string;
  /** Id of the `<main>` landmark, so the skip link has a target. */
  mainId: string;
}

export const WorkspaceShell = ({
  actions,
  brandName,
  brandSub,
  children,
  eyebrow,
  mainId,
  navItems,
  title,
  userName,
  userRole,
}: WorkspaceShellProps) => {
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await authClient.signOut();
    navigate({ to: "/sign-in" });
  };

  return (
    <Shell
      brandName={brandName}
      brandSub={brandSub}
      crestSrc="/logo.png"
      mainId={mainId}
      navItems={navItems}
      onNavigate={(href) => navigate({ to: href })}
      onSignOut={handleSignOut}
      title={title}
      eyebrow={eyebrow}
      userName={userName}
      userRole={userRole}
      actions={actions}
    >
      {children}
    </Shell>
  );
};
