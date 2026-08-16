"use client";

import { createFileRoute, useParams } from "@tanstack/react-router";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { ClubAlbums } from "@/components-client/club-albums";

export const Route = createFileRoute("/activities-admin/$activityId/gallery")({
  component: ActivityAdminGallery,
});

function ActivityAdminGallery() {
  const { activityId } = useParams({ from: "/activities-admin/$activityId" });

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Gallery</h1>
      </header>
      <div className="flex-1 p-6">
        <ClubAlbums activityId={activityId} isSiteAdmin={false} isClubAdmin />
      </div>
    </div>
  );
}


