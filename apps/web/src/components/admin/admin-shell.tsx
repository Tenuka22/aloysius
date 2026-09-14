import type { ShellNavItem } from "@aloysius/ui/components/shell";
import { Shell } from "@aloysius/ui/components/shell";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

export interface AdminShellProps {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  navItems: readonly ShellNavItem[];
  userName: string;
  userRole: string;
}

export const AdminShell = ({
  children,
  title,
  eyebrow,
  actions,
  navItems,
  userName,
  userRole,
}: AdminShellProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate({ to: "/sign-in" });
  };

  return (
    <Shell
      brandName="Admin"
      brandSub=""
      crestSrc="/logo.png"
      mainId="admin-main"
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
