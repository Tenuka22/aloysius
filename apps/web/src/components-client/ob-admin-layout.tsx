"use client";

import { Outlet, Link, useLocation } from "@tanstack/react-router";
import { Button } from "@aloysius-web/ui/components/button";
import { Separator } from "@aloysius-web/ui/components/separator";
import {
  IconUsers,
  IconUserShield,
  IconArrowLeft,
  IconCalendarEvent,
  IconHeart,
} from "@tabler/icons-react";
import { OBAdminDashboard } from "@/routes/ob-admin._dashboard";

export function OBAdminLayout() {
  const location = useLocation();
  const isRoot = location.pathname === "/ob-admin" || location.pathname === "/ob-admin/";

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b bg-green-dark text-cream">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-2 px-4 sm:px-6 lg:px-12">
          <Button
            variant="ghost"
            size="sm"
            className="text-cream/80 hover:text-cream hover:bg-green-dark/60"
            render={<Link to="/ob" />}
            nativeButton={false}
          >
            <IconArrowLeft className="mr-1 size-4" />
            OB Page
          </Button>
          <Separator orientation="vertical" className="mr-2 h-4 bg-cream/20" />
          <div className="flex items-center gap-1">
            <IconUserShield className="size-5 text-gold" />
            <span className="font-heading font-semibold text-cream">OB</span>
          </div>
          <nav className="ml-auto flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="text-cream/80 hover:text-cream hover:bg-green-dark/60"
              render={<Link to="/ob-admin/members" />}
              nativeButton={false}
            >
              <IconUsers className="mr-1.5 size-4" />
              Members
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-cream/80 hover:text-cream hover:bg-green-dark/60"
              render={<Link to="/ob-admin/committee" />}
              nativeButton={false}
            >
              <IconUserShield className="mr-1.5 size-4" />
              Committee Members
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-cream/80 hover:text-cream hover:bg-green-dark/60"
              render={<Link to="/ob-admin/events" />}
              nativeButton={false}
            >
              <IconCalendarEvent className="mr-1.5 size-4" />
              Events
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-cream/80 hover:text-cream hover:bg-green-dark/60"
              render={<Link to="/ob-admin/donations" />}
              nativeButton={false}
            >
              <IconHeart className="mr-1.5 size-4" />
              Donations
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-12">
        {isRoot ? <OBAdminDashboard /> : <Outlet />}
      </main>
    </div>
  );
}
