"use client";

import { Show, SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/tanstack-react-start";

function AdminLink() {
  const { sessionClaims } = useAuth();
  const role = sessionClaims?.metadata?.role;

  if (role !== "admin") return null;

  return (
    <a
      href="/admin"
      className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted transition-colors"
    >
      Admin
    </a>
  );
}

export function UserMenu() {
  return (
    <>
      <Show when="signed-in">
        <div className="flex items-center gap-2">
          <AdminLink />
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "size-8" } }} />
        </div>
      </Show>
      <Show when="signed-out">
        <div className="flex items-center gap-2">
          <SignInButton mode="modal">
            <button className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted transition-colors">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </Show>
    </>
  );
}
