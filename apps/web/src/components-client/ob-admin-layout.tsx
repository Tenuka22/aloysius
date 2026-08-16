"use client";

import { Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@aloysius-web/ui/components/sidebar";
import { OBAdminSidebar } from "@/components/ob-admin-sidebar";

export function OBAdminLayout() {
  return (
    <SidebarProvider>
      <OBAdminSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
