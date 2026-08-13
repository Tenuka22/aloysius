"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Show, SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/tanstack-react-start";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@aloysius-web/ui/components/dropdown-menu";
import { IconBell, IconCheck } from "@tabler/icons-react";
import { cn } from "@aloysius-web/ui/lib/utils";
import { client } from "@/utils/orpc";

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

/** Shown in the navbar when the signed-in user belongs to one or more clubs. */
function MyClubsLink() {
  const { isSignedIn } = useAuth();

  const { data } = useQuery({
    queryKey: ["clubs", "my"],
    queryFn: () => client.clubs.myClubs(),
    enabled: isSignedIn,
    staleTime: 60_000,
  });

  if (!isSignedIn || !data || data.length === 0) return null;

  return (
    <a
      href="/clubs"
      className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted transition-colors"
    >
      My Clubs
    </a>
  );
}

/** Bell icon with unread badge; dropdown lists recent notifications. */
function NotificationsBell() {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => client.notifications.myNotifications({ limit: 15 }),
    enabled: isSignedIn,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => client.notifications.markRead({ id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => client.notifications.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!isSignedIn) return null;

  const unread = data?.unread ?? 0;
  const rows = data?.rows ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          />
        }
      >
        <IconBell className="size-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(90vw,360px)]">
        <div className="flex items-center justify-between px-1.5 py-1">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unread > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <IconCheck className="size-3.5" />
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {rows.length === 0 ? (
          <p className="px-1.5 py-6 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          rows.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={cn("flex-col items-start gap-0.5 py-2", !n.read && "bg-muted/50")}
              onClick={async () => {
                if (!n.read) {
                  try {
                    await markRead.mutateAsync(n.id);
                  } catch {
                    // ignore — navigation should still proceed
                  }
                }
                if (n.link) window.location.href = n.link;
              }}
            >
              <span className="text-sm font-medium">{n.title}</span>
              {n.body && <span className="text-xs text-muted-foreground">{n.body}</span>}
              <span className="text-[10px] text-muted-foreground/70">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UserMenu() {
  return (
    <>
      <Show when="signed-in">
        <div className="flex items-center gap-2">
          <NotificationsBell />
          <MyClubsLink />
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
