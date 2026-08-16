"use client";

import { useNavigate, useParams } from "@tanstack/react-router";
import { IconSelector } from "@tabler/icons-react";

import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@aloysius-web/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@aloysius-web/ui/components/sidebar";
import { orpc } from "@/utils/orpc";

const typeIcons: Record<string, string> = {
  club: "🏛️",
  sport: "⚽",
  other: "📌",
};

const typeLabels: Record<string, string> = {
  club: "Club",
  sport: "Sport",
  other: "Other",
};

export function ActivitySwitcher() {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const { data: myClubs = [] } = useQuery(orpc.clubs.myClubs.queryOptions());

  const adminClubs = myClubs.filter((c: any) => c.membership?.isAdmin);
  const activeId = params.activityId;
  const active = adminClubs.find((c: any) => c.activity.id === activeId);

  const goto = (activityId: string) =>
    navigate({ to: "/activities-admin/$activityId", params: { activityId } });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <span className="text-sm font-bold">
                {active ? typeIcons[active.activity.type] ?? "📌" : "📌"}
              </span>
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {active?.activity.name ?? "Select activity"}
              </span>
              <span className="truncate text-xs">
                {active ? typeLabels[active.activity.type] ?? active.activity.type : "No activity selected"}
              </span>
            </div>
            <IconSelector className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Activities
              </DropdownMenuLabel>
              {adminClubs.map((club: any) => (
                <DropdownMenuItem
                  key={club.activity.id}
                  className="gap-2 p-2"
                  onClick={() => goto(club.activity.id)}
                >
                  <div className="flex aspect-square size-6 items-center justify-center rounded bg-muted text-xs">
                    {typeIcons[club.activity.type] ?? "📌"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">{club.activity.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {typeLabels[club.activity.type] ?? club.activity.type}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => navigate({ to: "/admin/activities" })}
              >
                <span className="text-muted-foreground font-medium">
                  Manage activities
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
