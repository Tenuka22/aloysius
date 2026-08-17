"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { AuthProvider } from "@/components/auth/auth-provider";
import { queryClient } from "@/lib/query-client";

export function Providers({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <AuthProvider
      authClient={authClient}
      navigate={({ to, replace }) => navigate({ to, replace })}
      emailAndPassword={{ enabled: true }}
      Link={({ href, ...props }) => <Link to={href} {...props} />}
      queryClient={queryClient}
    >
      {children}
    </AuthProvider>
  );
}
