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
import { client } from "@/utils/orpc";
import {
  IconDashboard,
  IconCalendarEvent,
  IconSchool,
  IconNews,
  IconSpeakerphone,
  IconTrophy,
  IconPhoto,
  IconChartBar,
  IconHome,
  IconDevices,
  IconClipboardCheck,
  IconUserPlus,
  IconUser,
  IconReportAnalytics,
  IconUsers,
  IconHeart,
} from "@tabler/icons-react";

const overviewItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: <IconDashboard />,
    isActive: true,
  },
];

const publishingItems = [
  {
    title: "Announcements",
    url: "/admin/announcements",
    icon: <IconSpeakerphone />,
    items: [
      { title: "All Announcements", url: "/admin/announcements" },
      { title: "New Announcement", url: "/admin/announcements/new" },
    ],
  },
  {
    title: "Club Content Review",
    url: "/admin/reviews",
    icon: <IconClipboardCheck />,
    badge: <PendingReviewBadge />,
  },
];

/** Live count of club content awaiting site-admin approval. */
function PendingReviewBadge() {
  const { data } = useQuery({
    queryKey: ["reviews", "pending-count"],
    queryFn: () => client.clubs.pendingReviewCount(),
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: false,
  });
  const count = data ?? 0;
  if (count === 0) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

const contentItems = [
  {
    title: "Events",
    url: "/admin/events",
    icon: <IconCalendarEvent />,
    items: [
      { title: "All Events", url: "/admin/events" },
      { title: "Create Event", url: "/admin/events/new" },
    ],
  },
  {
    title: "Achievements",
    url: "/admin/achievements",
    icon: <IconTrophy />,
  },
  {
    title: "Gallery",
    url: "/admin/gallery",
    icon: <IconPhoto />,
  },
  {
    title: "Student Works",
    url: "/admin/student-works",
    icon: <IconSchool />,
    items: [
      { title: "All Works", url: "/admin/student-works" },
      { title: "Submit Work", url: "/admin/student-works/new" },
    ],
  },
];

const cmsItems = [
  {
    title: "Homepage",
    url: "/admin/homepage",
    icon: <IconHome />,
  },
  {
    title: "About",
    url: "/admin/about",
    icon: <IconSchool />,
  },
  {
    title: "Admissions",
    url: "/admin/admissions",
    icon: <IconUserPlus />,
  },
  {
    title: "Stats",
    url: "/admin/stats",
    icon: <IconChartBar />,
  },
  {
    title: "Exam Results",
    url: "/admin/exam-results",
    icon: <IconReportAnalytics />,
  },
  {
    title: "Activities",
    url: "/admin/activities",
    icon: <IconDevices />,
  },
  {
    title: "Big Matches",
    url: "/admin/big-matches",
    icon: <IconTrophy />,
  },
  {
    title: "Principals",
    url: "/admin/principals",
    icon: <IconUser />,
  },
  {
    title: "Old Boys",
    url: "/admin/ob",
    icon: <IconUsers />,
    items: [
      { title: "Members", url: "/admin/ob/members" },
      { title: "Events", url: "/admin/ob/events" },
      { title: "Donations", url: "/admin/ob/donations" },
    ],
  },
];

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <a href="/" className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="size-5"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Aloysius College</span>
            <span className="truncate text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={overviewItems} label="Overview" />
        <NavMain items={publishingItems} label="Publishing" />
        <NavMain items={contentItems} label="Content" />
        <NavMain items={cmsItems} label="CMS" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
