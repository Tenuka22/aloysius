"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
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
  IconCalendarEvent,
  IconNews,
  IconArrowRight,
  IconCircleCheck,
  IconUserPlus,
  IconFileText,
  IconReceipt2,
} from "@tabler/icons-react";
import { orpc } from "@/utils/orpc";
import type { OBMember, OBEvent, OBDonation, OBNews, OBAnnouncement } from "@/lib/api-types";

export const Route = createFileRoute("/ob-admin/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(orpc.ob.obMembers.list.queryOptions({ input: {} })),
      context.queryClient.prefetchQuery(orpc.ob.obEvents.list.queryOptions({ input: {} })),
      context.queryClient.prefetchQuery(orpc.ob.obDonations.list.queryOptions({ input: {} })),
      context.queryClient.prefetchQuery(orpc.ob.obNews.list.queryOptions({ input: {} })),
      context.queryClient.prefetchQuery(orpc.ob.obAnnouncements.list.queryOptions({ input: {} })),
    ]);
  },
  component: OBAdminDashboard,
});

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function OBAdminDashboard() {
  const { data: members = [] } = useSuspenseQuery(orpc.ob.obMembers.list.queryOptions({ input: {} }));
  const { data: events = [] } = useSuspenseQuery(orpc.ob.obEvents.list.queryOptions({ input: {} }));
  const { data: donations = [] } = useSuspenseQuery(
    orpc.ob.obDonations.list.queryOptions({ input: {} }),
  );
  const { data: news = [] } = useSuspenseQuery(orpc.ob.obNews.list.queryOptions({ input: {} }));
  const { data: announcements = [] } = useSuspenseQuery(
    orpc.ob.obAnnouncements.list.queryOptions({ input: {} }),
  );

  const visibleMembers = members.filter((m: OBMember) => m.role !== "ADMINISTRATOR");
  const pendingMembers = visibleMembers.filter((m: OBMember) => m.status === "pending");
  const publishedEvents = events.filter((e: OBEvent) => e.status === "published");
  const draftEvents = events.filter((e: OBEvent) => e.status === "draft");
  const confirmedDonations = donations.filter((d: OBDonation) => d.status === "confirmed");
  const pendingDonations = donations.filter((d: OBDonation) => d.status === "pending");
  const draftNews = news.filter((n: OBNews) => n.status === "draft");
  const draftAnnouncements = announcements.filter((a: OBAnnouncement) => a.status === "draft");
  const publishedContent =
    news.filter((n: OBNews) => n.status === "published").length +
    announcements.filter((a: OBAnnouncement) => a.status === "published").length;

  const attentionItems = [
    pendingMembers.length > 0 && {
      icon: IconUserPlus,
      label: `${pendingMembers.length} membership ${pendingMembers.length === 1 ? "request" : "requests"} to review`,
      to: "/ob-admin/members",
    },
    pendingDonations.length > 0 && {
      icon: IconReceipt2,
      label: `${pendingDonations.length} ${pendingDonations.length === 1 ? "donation" : "donations"} awaiting confirmation`,
      to: "/ob-admin/donations",
    },
    draftEvents.length > 0 && {
      icon: IconCalendarEvent,
      label: `${draftEvents.length} draft ${draftEvents.length === 1 ? "event" : "events"} not yet published`,
      to: "/ob-admin/events",
    },
    draftNews.length > 0 && {
      icon: IconNews,
      label: `${draftNews.length} draft news ${draftNews.length === 1 ? "article" : "articles"}`,
      to: "/ob-admin/news",
    },
    draftAnnouncements.length > 0 && {
      icon: IconFileText,
      label: `${draftAnnouncements.length} draft ${draftAnnouncements.length === 1 ? "announcement" : "announcements"}`,
      to: "/ob-admin/announcements",
    },
  ].filter(Boolean) as { icon: typeof IconUserPlus; label: string; to: string }[];

  const recentDonations = donations.slice(0, 5);

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </header>

      <div className="flex-1 space-y-6 p-6">
        {/* Stat strip - one cohesive bordered row, not repeated cards */}
        <div className="grid grid-cols-2 divide-x divide-y divide-border rounded-lg border sm:grid-cols-4 sm:divide-y-0">
          <div className="p-4">
            <div className="text-2xl font-bold text-foreground">{visibleMembers.length}</div>
            <div className="text-xs text-muted-foreground">Members</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-foreground">{publishedEvents.length}</div>
            <div className="text-xs text-muted-foreground">Published events</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-foreground">{confirmedDonations.length}</div>
            <div className="text-xs text-muted-foreground">Confirmed donations</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-foreground">{publishedContent}</div>
            <div className="text-xs text-muted-foreground">Published news &amp; announcements</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Needs your attention */}
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

          {/* Recent donations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent donations</CardTitle>
            </CardHeader>
            <CardContent>
              {recentDonations.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">No donations recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Donor</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDonations.map((d: OBDonation) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">
                          {d.isAnonymous ? "Anonymous" : d.donorName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{d.purpose || "-"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {d.amount ? `${d.currency} ${Number(d.amount).toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(d.donatedAt)}
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
                render={<Link to="/ob-admin/donations" />}
              >
                View all donations <IconArrowRight className="size-3.5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
