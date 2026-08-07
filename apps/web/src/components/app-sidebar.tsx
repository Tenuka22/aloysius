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
import { IconDashboard, IconUsers, IconCalendarEvent, IconSchool, IconNews, IconSettings } from "@tabler/icons-react"

const adminNavItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: <IconDashboard />,
    isActive: true,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: <IconUsers />,
  },
  {
    title: "Events",
    url: "/admin/events",
    icon: <IconCalendarEvent />,
  },
  {
    title: "Student Works",
    url: "/admin/student-works",
    icon: <IconSchool />,
  },
  {
    title: "News",
    url: "/admin/news",
    icon: <IconNews />,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: <IconSettings />,
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
        <NavMain items={adminNavItems} label="Management" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
