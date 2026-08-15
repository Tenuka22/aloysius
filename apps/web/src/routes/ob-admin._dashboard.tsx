"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { Card, CardContent } from "@aloysius-web/ui/components/card";
import { Link } from "@tanstack/react-router";
import { IconUsers, IconUserShield, IconCalendarEvent, IconArrowRight } from "@tabler/icons-react";
import { client } from "@/utils/orpc";

export function OBAdminDashboard() {
  const { data: members = [] } = useQuery({
    queryKey: ["ob-members"],
    queryFn: () => client.ob.obMembers.list({}),
  });

  const { data: events = [] } = useQuery({
    queryKey: ["ob-events"],
    queryFn: () => client.ob.obEvents.list({}),
  });

  const pendingMembers = members.filter(
    (m: any) => m.status === "pending" && m.role !== "ADMINISTRATOR",
  );
  const publishedEvents = events.filter((e: any) => e.status === "published");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">OB Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your Old Boys&apos; Association content and members.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/20">
                <IconUsers className="size-5 text-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {members.filter((m: any) => m.role !== "ADMINISTRATOR").length}
                </div>
                <div className="text-xs text-muted-foreground">Total Members</div>
              </div>
            </div>
            {pendingMembers.length > 0 && (
              <div className="mt-3 text-xs text-yellow-600 font-medium">
                {pendingMembers.length} pending approval
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 justify-between"
              render={<Link to="/ob-admin/members" />}
            >
              Manage Members <IconArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/20">
                <IconCalendarEvent className="size-5 text-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{publishedEvents.length}</div>
                <div className="text-xs text-muted-foreground">Published Events</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{events.length} total events</div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 justify-between"
              render={<Link to="/ob-admin/events" />}
            >
              Manage Events <IconArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/20">
                <IconUserShield className="size-5 text-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {
                    members.filter(
                      (m: any) => m.role !== "ADMINISTRATOR" && m.status === "approved",
                    ).length
                  }
                </div>
                <div className="text-xs text-muted-foreground">Active Committee</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Across all years</div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 justify-between"
              render={<Link to="/ob-admin/committee" />}
            >
              View Committee <IconArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
