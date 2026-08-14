"use client";

import { Outlet, Link } from "@tanstack/react-router";
import { Button } from "@aloysius-web/ui/components/button";
import { Separator } from "@aloysius-web/ui/components/separator";
import { IconUsers, IconUserShield, IconArrowLeft } from "@tabler/icons-react";

export function OBAdminLayout() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b bg-green-dark text-cream">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-2 px-4 sm:px-6 lg:px-12">
          <Button
            variant="ghost"
            size="sm"
            className="text-cream/80 hover:text-cream hover:bg-green-dark/60"
            render={<Link to="/ob" />}
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
            >
              <IconUsers className="mr-1.5 size-4" />
              Members
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-cream/80 hover:text-cream hover:bg-green-dark/60"
              render={<Link to="/ob-admin/committee" />}
            >
              <IconUserShield className="mr-1.5 size-4" />
              Committee Members
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-12">
        <Outlet />
      </main>
    </div>
  );
}
