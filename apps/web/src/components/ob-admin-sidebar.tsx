"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@aloysius-web/ui/components/sidebar";
import { useQuery } from "@tanstack/react-query";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { orpc } from "@/utils/orpc";
import {
  IconDashboard,
  IconUsers,
  IconUserShield,
  IconCalendarEvent,
  IconHeart,
  IconNews,
  IconSpeakerphone,
  IconPhoto,
} from "@tabler/icons-react";

const overviewItems = [
  {
    title: "Dashboard",
    url: "/ob-admin",
    icon: <IconDashboard />,
    isActive: true,
  },
];

/** Live count of membership requests awaiting the OB admin's decision. */
function PendingMembersBadge() {
  const { data } = useQuery(
    orpc.ob.obMembers.list.queryOptions({
      input: { status: "pending" },
      refetchInterval: 30_000,
      staleTime: 15_000,
    }),
  );
  const count = (data ?? []).filter((m: any) => m.role !== "ADMINISTRATOR").length;
  if (count === 0) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

const membershipItems = [
  {
    title: "Members",
    url: "/ob-admin/members",
    icon: <IconUsers />,
    badge: <PendingMembersBadge />,
  },
  {
    title: "Committee",
    url: "/ob-admin/committee",
    icon: <IconUserShield />,
  },
];

const contentItems = [
  {
    title: "Events",
    url: "/ob-admin/events",
    icon: <IconCalendarEvent />,
  },
  {
    title: "Donations",
    url: "/ob-admin/donations",
    icon: <IconHeart />,
  },
  {
    title: "Gallery",
    url: "/ob-admin/gallery",
    icon: <IconPhoto />,
  },
  {
    title: "News",
    url: "/ob-admin/news",
    icon: <IconNews />,
  },
  {
    title: "Announcements",
    url: "/ob-admin/announcements",
    icon: <IconSpeakerphone />,
  },
];

export function OBAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <a href="/ob" className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <IconUserShield className="size-5" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Old Boys&apos; Association</span>
            <span className="truncate text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={overviewItems} label="Overview" />
        <NavMain items={membershipItems} label="Membership" />
        <NavMain items={contentItems} label="Content" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
