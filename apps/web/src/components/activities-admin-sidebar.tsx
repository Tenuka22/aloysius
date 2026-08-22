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
import { orpc } from "@/utils/orpc";
import {
  IconDashboard,
  IconUsers,
  IconCalendarEvent,
  IconNews,
  IconSpeakerphone,
  IconPhoto,
  IconSchool,
} from "@tabler/icons-react";

export function ActivitiesAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { activityId } = useParams({ from: "/activities-admin/$activityId" });
  const base = `/activities-admin/${activityId}`;

  const { data: activity } = useQuery(
    orpc.activities.get.queryOptions({ input: { id: activityId } }),
  );

  const capabilities = (activity?.capabilities as string[]) ?? [];

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

  const contentItems = [];

  if (capabilities.includes("manage_events")) {
    contentItems.push({
      title: "Events",
      url: `${base}/events`,
      icon: <IconCalendarEvent />,
    });
  }

  if (capabilities.includes("manage_news")) {
    contentItems.push({
      title: "News",
      url: `${base}/news`,
      icon: <IconNews />,
    });
  }

  if (capabilities.includes("manage_announcements")) {
    contentItems.push({
      title: "Club Announcements",
      url: `${base}/announcements`,
      icon: <IconSpeakerphone />,
    });
  }

  if (capabilities.includes("manage_announcements_global")) {
    contentItems.push({
      title: "Global Announcements",
      url: `${base}/announcements/global`,
      icon: <IconSchool />,
    });
  }

  if (capabilities.includes("manage_gallery")) {
    contentItems.push({
      title: "Gallery",
      url: `${base}/gallery`,
      icon: <IconPhoto />,
    });
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ActivitySwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={overviewItems} label="Overview" />
        <NavMain items={membershipItems} label="Membership" />
        {contentItems.length > 0 && (
          <NavMain items={contentItems} label="Content" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
