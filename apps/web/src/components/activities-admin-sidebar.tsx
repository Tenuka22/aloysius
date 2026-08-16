"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@aloysius-web/ui/components/sidebar";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { ActivitySwitcher } from "@/components/activity-switcher";
import {
  IconDashboard,
  IconUsers,
  IconCalendarEvent,
  IconNews,
  IconSpeakerphone,
  IconPhoto,
} from "@tabler/icons-react";

const overviewItems = [
  {
    title: "Dashboard",
    url: "/activities-admin/$activityId",
    icon: <IconDashboard />,
    isActive: true,
  },
];

const membershipItems = [
  {
    title: "Members",
    url: "/activities-admin/$activityId/members",
    icon: <IconUsers />,
  },
];

const contentItems = [
  {
    title: "Events",
    url: "/activities-admin/$activityId/events",
    icon: <IconCalendarEvent />,
  },
  {
    title: "News",
    url: "/activities-admin/$activityId/news",
    icon: <IconNews />,
  },
  {
    title: "Announcements",
    url: "/activities-admin/$activityId/announcements",
    icon: <IconSpeakerphone />,
  },
  {
    title: "Gallery",
    url: "/activities-admin/$activityId/gallery",
    icon: <IconPhoto />,
  },
];

export function ActivitiesAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ActivitySwitcher />
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
