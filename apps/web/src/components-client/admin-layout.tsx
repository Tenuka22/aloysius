"use client";

import { Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@aloysius-web/ui/components/sidebar";
import { AdminSidebar } from "@/components/app-sidebar";

export function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
