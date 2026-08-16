"use client";

import { Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@aloysius-web/ui/components/sidebar";
import { ActivitiesAdminSidebar } from "@/components/activities-admin-sidebar";

export function ActivitiesAdminLayout() {
  return (
    <SidebarProvider>
      <ActivitiesAdminSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
