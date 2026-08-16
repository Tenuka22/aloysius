"use client";

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@aloysius-web/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@aloysius-web/ui/components/table";
import {
  IconUsers,
  IconCalendarEvent,
  IconNews,
  IconSpeakerphone,
  IconArrowRight,
  IconCircleCheck,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/activities-admin_/$activityId/")({
  component: ActivityAdminDashboard,
});

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ActivityAdminDashboard() {
  const { activityId } = useParams({ from: "/activities-admin_/$activityId" });
  const { data: members = [] } = useQuery(orpc.clubs.listMembers.queryOptions({ input: { activityId } }));
  const { data: eventsData } = useQuery(orpc.events.list.queryOptions({ input: { activityId, pageSize: 100 } }));
  const { data: newsData } = useQuery(orpc.news.list.queryOptions({ input: { activityId, pageSize: 100 } }));
  const { data: announcementsData } = useQuery(orpc.announcements.list.queryOptions({ input: { activityId, pageSize: 100 } }));
  const { data: albumsData } = useQuery(orpc.clubAlbums.list.queryOptions({ input: { activityId, pageSize: 100 } }));

  const events = (eventsData?.rows ?? []) as any[];
  const news = (newsData?.rows ?? []) as any[];
  const announcements = (announcementsData?.rows ?? []) as any[];
  const albums = (albumsData?.rows ?? []) as any[];

  const pendingMembers = members.filter((m: any) => m.status === "pending");
  const publishedEvents = events.filter((e: any) => e.status === "published");
  const draftEvents = events.filter((e: any) => e.status === "draft");
  const publishedNews = news.filter((n: any) => n.status === "published");
  const draftNews = news.filter((n: any) => n.status === "draft");
  const publishedAnnouncements = announcements.filter((a: any) => a.status === "published");
  const draftAnnouncements = announcements.filter((a: any) => a.status === "draft");
  const publishedAlbums = albums.filter((a: any) => a.status === "published");

  const attentionItems = [
    pendingMembers.length > 0 && {
      icon: IconUsers,
      label: `${pendingMembers.length} membership ${pendingMembers.length === 1 ? "request" : "requests"} to review`,
      to: `/activities-admin/${activityId}/members`,
    },
    draftEvents.length > 0 && {
      icon: IconCalendarEvent,
      label: `${draftEvents.length} draft ${draftEvents.length === 1 ? "event" : "events"} not yet published`,
      to: `/activities-admin/${activityId}/events`,
    },
    draftNews.length > 0 && {
      icon: IconNews,
      label: `${draftNews.length} draft news ${draftNews.length === 1 ? "article" : "articles"}`,
      to: `/activities-admin/${activityId}/news`,
    },
    draftAnnouncements.length > 0 && {
      icon: IconSpeakerphone,
      label: `${draftAnnouncements.length} draft ${draftAnnouncements.length === 1 ? "announcement" : "announcements"}`,
      to: `/activities-admin/${activityId}/announcements`,
    },
  ].filter(Boolean) as { icon: typeof IconUsers; label: string; to: string }[];

  const recentEvents = events.slice(0, 5);

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </header>

      <div className="flex-1 space-y-6 p-6">
        <div className="grid grid-cols-2 divide-x divide-y divide-border rounded-lg border sm:grid-cols-4 sm:divide-y-0">
          <div className="p-4">
            <div className="text-2xl font-bold text-foreground">{members.length}</div>
            <div className="text-xs text-muted-foreground">Members</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-foreground">{publishedEvents.length}</div>
            <div className="text-xs text-muted-foreground">Published events</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-foreground">{publishedNews.length + publishedAnnouncements.length}</div>
            <div className="text-xs text-muted-foreground">Published news & announcements</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-foreground">{publishedAlbums.length}</div>
            <div className="text-xs text-muted-foreground">Gallery albums</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Needs your attention</CardTitle>
            </CardHeader>
            <CardContent>
              {attentionItems.length === 0 ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <IconCircleCheck className="size-4 text-primary" />
                  All caught up - nothing pending review.
                </div>
              ) : (
                <ul className="divide-y divide-border -mx-(--card-spacing)">
                  {attentionItems.map((item) => (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        className="flex items-center gap-3 px-(--card-spacing) py-3 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <item.icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 text-foreground">{item.label}</span>
                        <IconArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent events</CardTitle>
            </CardHeader>
            <CardContent>
              {recentEvents.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">No events yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentEvents.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.title}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              e.status === "published"
                                ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}
                          >
                            {e.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(e.startDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full justify-between"
                render={<Link to="/activities-admin/$activityId/events" params={{ activityId }} />}
              >
                View all events <IconArrowRight className="size-3.5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
