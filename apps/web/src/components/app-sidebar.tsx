"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@aloysius-web/ui/components/sidebar"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { IconDashboard, IconCalendarEvent, IconSchool, IconNews, IconSpeakerphone, IconTrophy, IconPhoto, IconChartBar, IconHome } from "@tabler/icons-react"

const overviewItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: <IconDashboard />,
    isActive: true,
  },
]

const publishingItems = [
  {
    title: "News",
    url: "/admin/news",
    icon: <IconNews />,
    items: [
      { title: "All News", url: "/admin/news" },
      { title: "New Article", url: "/admin/news/new" },
    ],
  },
  {
    title: "Announcements",
    url: "/admin/announcements",
    icon: <IconSpeakerphone />,
    items: [
      { title: "All Announcements", url: "/admin/announcements" },
      { title: "New Announcement", url: "/admin/announcements/new" },
    ],
  },
]

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
]

const cmsItems = [
  {
    title: "Homepage",
    url: "/admin/homepage",
    icon: <IconHome />,
  },
  {
    title: "Stats",
    url: "/admin/stats",
    icon: <IconChartBar />,
  },
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <a href="/" className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
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
  )
}
