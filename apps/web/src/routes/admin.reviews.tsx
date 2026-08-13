"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { IconCheck, IconX } from "@tabler/icons-react";
import { client } from "@/utils/orpc";
import { toast } from "sonner";

type PendingItem = {
  type: "news" | "event" | "announcement" | "studentWork" | "album";
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  activityId: string | null;
  activityName: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

const typeLabels: Record<string, string> = {
  news: "News",
  event: "Event",
  announcement: "Announcement",
  studentWork: "Student Work",
  album: "Photo Album",
};

const typeStyles: Record<string, string> = {
  news: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  event: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  announcement: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  studentWork: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  album: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviews,
});

function AdminReviews() {
  const queryClient = useQueryClient();
  const [rejectItem, setRejectItem] = useState<PendingItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: items, isLoading } = useQuery({
    queryKey: ["reviews", "pending"],
    queryFn: () => client.clubs.listPendingContent(),
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      type,
      id,
      action,
      reason,
    }: {
      type: "news" | "event" | "announcement" | "studentWork" | "album";
      id: string;
      action: "approve" | "reject";
      reason?: string;
    }) => client.clubs.reviewContent({ type, id, action, reason }),
    onSuccess: () => {
      toast.success("Review submitted");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setRejectItem(null);
      setRejectReason("");
    },
    onError: (err) => toast.error(err.message),
  });

  const pending = (items ?? []) as PendingItem[];

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Club Content Review</h1>
      </header>
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rounded-lg border bg-card animate-pulse" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border border-dashed p-16 text-center">
            <h2 className="text-lg font-semibold mb-2">Nothing pending review</h2>
            <p className="text-muted-foreground text-sm">
              Content posted by club members appears here for approval before it is published.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        typeStyles[item.type] ?? typeStyles.event
                      }`}
                    >
                      {typeLabels[item.type] ?? item.type}
                    </span>
                    {item.activityName && (
                      <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        {item.activityName}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold mt-2">{item.title}</h3>
                  {item.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {item.excerpt}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Submitted {new Date(item.createdAt).toLocaleDateString()} · Updated{" "}
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        item.type === "news" ? (
                          <Link to="/news/$slug" params={{ slug: item.slug }} />
                        ) : item.type === "event" ? (
                          <Link to="/events/$slug" params={{ slug: item.slug }} />
                        ) : item.type === "announcement" ? (
                          <Link to="/announcements/$slug" params={{ slug: item.slug }} />
                        ) : item.type === "album" && item.activityId ? (
                          <Link to="/clubs/$id" params={{ id: item.activityId }} />
                        ) : (
                          <Link to="/student-works/$slug" params={{ slug: item.slug }} />
                        )
                      }
                      nativeButton={false}
                    >
                      View
                    </Button>
                    {item.type !== "album" && (
                      <Button
                        size="sm"
                        variant="outline"
                        render={
                          item.type === "news" ? (
                            <Link to="/admin/news/$id/edit" params={{ id: item.id }} />
                          ) : item.type === "event" ? (
                            <Link to="/admin/events/$id/edit" params={{ id: item.id }} />
                          ) : item.type === "announcement" ? (
                            <Link to="/admin/announcements/$id/edit" params={{ id: item.id }} />
                          ) : (
                            <Link to="/admin/student-works/$id/edit" params={{ id: item.id }} />
                          )
                        }
                        nativeButton={false}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      reviewMutation.mutate({ type: item.type, id: item.id, action: "approve" })
                    }
                    disabled={reviewMutation.isPending}
                  >
                    <IconCheck className="mr-1 size-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => {
                      setRejectItem(item);
                      setRejectReason("");
                    }}
                    disabled={reviewMutation.isPending}
                  >
                    <IconX className="mr-1 size-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!rejectItem} onOpenChange={(open) => !open && setRejectItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectItem ? typeLabels[rejectItem.type] : "Content"}</DialogTitle>
            <DialogDescription>
              The author will see this reason on their club page.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Why is this being rejected?"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                rejectItem &&
                reviewMutation.mutate({
                  type: rejectItem.type,
                  id: rejectItem.id,
                  action: "reject",
                  reason: rejectReason || undefined,
                })
              }
              disabled={reviewMutation.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
