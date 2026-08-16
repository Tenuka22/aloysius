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
import { ActivitySwitcher } from "@/components/activity-switcher";
import { useParams } from "@tanstack/react-router";
import {
  IconDashboard,
  IconUsers,
  IconCalendarEvent,
  IconNews,
  IconSpeakerphone,
  IconPhoto,
} from "@tabler/icons-react";

export function ActivitiesAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { activityId } = useParams({ from: "/activities-admin/$activityId" });
  const base = `/activities-admin/${activityId}`;

  const overviewItems = [
    {
      title: "Dashboard",
      url: base,
      icon: <IconDashboard />,
      isActive: true,
    },
  ];

  const membershipItems = [
    {
      title: "Members",
      url: `${base}/members`,
      icon: <IconUsers />,
    },
  ];

  const contentItems = [
    {
      title: "Events",
      url: `${base}/events`,
      icon: <IconCalendarEvent />,
    },
    {
      title: "News",
      url: `${base}/news`,
      icon: <IconNews />,
    },
    {
      title: "Announcements",
      url: `${base}/announcements`,
      icon: <IconSpeakerphone />,
    },
    {
      title: "Gallery",
      url: `${base}/gallery`,
      icon: <IconPhoto />,
    },
  ];

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
