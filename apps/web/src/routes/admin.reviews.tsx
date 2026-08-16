"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
import { EntityDialog } from "@aloysius-web/ui/lib/form-builder";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { IconCheck, IconX, IconExternalLink } from "@tabler/icons-react";
import { orpc } from "@/utils/orpc";
import { toast } from "sonner";
import type { PendingReviewItem } from "@/lib/api-types";

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

type RejectFormValues = {
  reason: string;
};

const rejectFields: FieldEntry<RejectFormValues>[] = [
  {
    name: "reason",
    kind: "textarea",
    label: "Rejection Reason",
    placeholder: "Why is this being rejected?",
  },
];

const rejectConfig: FormConfig<RejectFormValues> = {
  fields: rejectFields,
  layout: [{ columns: [{ fields: ["reason"], span: 12 }] }],
};

function TagRow({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          #{t}
        </span>
      ))}
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="space-y-3 py-1">
      <div className="h-48 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
    </div>
  );
}

/**
 * Shows the full content of a pending item (cover image, body, and type-specific
 * metadata) inline, with Approve/Reject actions right there — so a reviewer never
 * has to leave the queue (or hit an unpublished-content 404 on the public site) to
 * see what they're deciding on.
 */
function ContentPreviewDialog({
  item,
  onOpenChange,
  onApprove,
  onReject,
  isPending,
}: {
  item: PendingReviewItem | null;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
}) {
  const open = !!item;
  const type = item?.type;
  const id = item?.id ?? "";

  const newsQuery = useQuery(
    orpc.news.get.queryOptions({ input: { id }, enabled: open && type === "news" }),
  );
  const eventQuery = useQuery(
    orpc.events.get.queryOptions({ input: { id }, enabled: open && type === "event" }),
  );
  const announcementQuery = useQuery(
    orpc.announcements.get.queryOptions({
      input: { id },
      enabled: open && type === "announcement",
    }),
  );
  const studentWorkQuery = useQuery(
    orpc.studentWorks.get.queryOptions({ input: { id }, enabled: open && type === "studentWork" }),
  );
  const albumQuery = useQuery(
    orpc.clubAlbums.get.queryOptions({ input: { id }, enabled: open && type === "album" }),
  );

  const isLoading =
    (type === "news" && newsQuery.isLoading) ||
    (type === "event" && eventQuery.isLoading) ||
    (type === "announcement" && announcementQuery.isLoading) ||
    (type === "studentWork" && studentWorkQuery.isLoading) ||
    (type === "album" && albumQuery.isLoading);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="w-[min(94vw,680px)] max-h-[85vh] overflow-y-auto">
        {item && (
          <>
            <DialogHeader>
              <div className="mb-1 flex flex-wrap items-center gap-2">
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
              <DialogTitle>{item.title}</DialogTitle>
              <DialogDescription>
                Submitted {new Date(item.createdAt).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            {isLoading ? (
              <PreviewSkeleton />
            ) : (
              <div className="space-y-4">
                {item.type === "news" && newsQuery.data && (
                  <>
                    {newsQuery.data.coverImage && (
                      <img
                        src={newsQuery.data.coverImage}
                        alt=""
                        className="aspect-video w-full rounded-md object-cover"
                      />
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {newsQuery.data.authorName && <span>By {newsQuery.data.authorName}</span>}
                      {newsQuery.data.authorType && (
                        <span className="capitalize">{newsQuery.data.authorType}</span>
                      )}
                    </div>
                    {newsQuery.data.excerpt && (
                      <p className="text-sm font-medium text-foreground/80">
                        {newsQuery.data.excerpt}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {newsQuery.data.content}
                    </p>
                    <TagRow tags={newsQuery.data.tags ?? []} />
                  </>
                )}

                {item.type === "event" && eventQuery.data && (
                  <>
                    {eventQuery.data.coverImage && (
                      <img
                        src={eventQuery.data.coverImage}
                        alt=""
                        className="aspect-video w-full rounded-md object-cover"
                      />
                    )}
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">When</dt>
                        <dd>
                          {new Date(eventQuery.data.startDate).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: eventQuery.data.isAllDay ? undefined : "short",
                          })}
                        </dd>
                      </div>
                      {eventQuery.data.location && (
                        <div>
                          <dt className="text-xs text-muted-foreground">Where</dt>
                          <dd>{eventQuery.data.location}</dd>
                        </div>
                      )}
                      {eventQuery.data.organizerName && (
                        <div>
                          <dt className="text-xs text-muted-foreground">Organizer</dt>
                          <dd>{eventQuery.data.organizerName}</dd>
                        </div>
                      )}
                      {eventQuery.data.purpose && (
                        <div>
                          <dt className="text-xs text-muted-foreground">Purpose</dt>
                          <dd>{eventQuery.data.purpose}</dd>
                        </div>
                      )}
                    </dl>
                    {eventQuery.data.excerpt && (
                      <p className="text-sm font-medium text-foreground/80">
                        {eventQuery.data.excerpt}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {eventQuery.data.content}
                    </p>
                    <TagRow tags={eventQuery.data.tags ?? []} />
                  </>
                )}

                {item.type === "announcement" && announcementQuery.data && (
                  <>
                    {announcementQuery.data.coverImage && (
                      <img
                        src={announcementQuery.data.coverImage}
                        alt=""
                        className="aspect-video w-full rounded-md object-cover"
                      />
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="capitalize">Audience: {announcementQuery.data.audience}</span>
                      {announcementQuery.data.addressedTo && (
                        <span>To: {announcementQuery.data.addressedTo}</span>
                      )}
                      {announcementQuery.data.authorName && (
                        <span>By {announcementQuery.data.authorName}</span>
                      )}
                    </div>
                    {announcementQuery.data.excerpt && (
                      <p className="text-sm font-medium text-foreground/80">
                        {announcementQuery.data.excerpt}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {announcementQuery.data.content}
                    </p>
                    <TagRow tags={announcementQuery.data.tags ?? []} />
                  </>
                )}

                {item.type === "studentWork" && studentWorkQuery.data && (
                  <>
                    {studentWorkQuery.data.coverImage && (
                      <img
                        src={studentWorkQuery.data.coverImage}
                        alt=""
                        className="aspect-video w-full rounded-md object-cover"
                      />
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="capitalize">Category: {studentWorkQuery.data.category}</span>
                      {studentWorkQuery.data.studentGrade && (
                        <span>Grade {studentWorkQuery.data.studentGrade}</span>
                      )}
                    </div>
                    {(studentWorkQuery.data.studentNames?.length ?? 0) > 0 && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">By </span>
                        {studentWorkQuery.data.studentNames!.join(", ")}
                      </p>
                    )}
                    {studentWorkQuery.data.description && (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {studentWorkQuery.data.description}
                      </p>
                    )}
                    {studentWorkQuery.data.contentUrl && (
                      <a
                        href={studentWorkQuery.data.contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline"
                      >
                        View submitted work <IconExternalLink className="size-3.5" />
                      </a>
                    )}
                    <TagRow tags={studentWorkQuery.data.tags ?? []} />
                  </>
                )}

                {item.type === "album" && albumQuery.data && (
                  <>
                    {albumQuery.data.album.description && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {albumQuery.data.album.description}
                      </p>
                    )}
                    {albumQuery.data.images.length === 0 ? (
                      <p className="text-sm italic text-muted-foreground">
                        No photos in this album yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {albumQuery.data.images.map((img) => (
                          <img
                            key={img.id}
                            src={img.url}
                            alt={img.caption || ""}
                            className="aspect-square w-full rounded-md object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" className="text-destructive" onClick={onReject} disabled={isPending}>
                <IconX className="mr-1 size-4" />
                Reject
              </Button>
              <Button onClick={onApprove} disabled={isPending}>
                <IconCheck className="mr-1 size-4" />
                Approve
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const Route = createFileRoute("/admin/reviews")({
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(orpc.admin.clubs.listPendingContent.queryOptions());
  },
  component: AdminReviews,
});

function AdminReviews() {
  const queryClient = useQueryClient();
  const [rejectItem, setRejectItem] = useState<PendingReviewItem | null>(null);
  const [previewItem, setPreviewItem] = useState<PendingReviewItem | null>(null);

  const { data: items } = useSuspenseQuery(orpc.admin.clubs.listPendingContent.queryOptions());

  const reviewMutation = useMutation(
    orpc.admin.clubs.reviewContent.mutationOptions({
      onSuccess: () => {
        toast.success("Review submitted");
        queryClient.invalidateQueries({ queryKey: orpc.admin.clubs.key() });
        setRejectItem(null);
        setPreviewItem(null);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const pending = items ?? [];

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Activity Reviews</h1>
      </header>
      <div className="flex-1 p-6">
        {pending.length === 0 ? (
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
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
                    No image
                  </div>
                )}
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
                      onClick={() => setPreviewItem(item)}
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
                    onClick={() => setRejectItem(item)}
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

        <EntityDialog<RejectFormValues>
          open={!!rejectItem}
          onOpenChange={(open) => !open && setRejectItem(null)}
          title={`Reject ${rejectItem ? typeLabels[rejectItem.type] : "Content"}`}
          description="The author will see this reason on their club page."
          config={rejectConfig}
          defaultValues={{ reason: "" }}
          onSubmit={async (values) => {
            if (!rejectItem) return;
            await reviewMutation.mutateAsync({
              type: rejectItem.type,
              id: rejectItem.id,
              action: "reject",
              reason: values.reason || undefined,
            });
          }}
          actionLabel="Reject"
        />

        <ContentPreviewDialog
          item={previewItem}
          onOpenChange={(open) => !open && setPreviewItem(null)}
          onApprove={() =>
            previewItem &&
            reviewMutation.mutate({ type: previewItem.type, id: previewItem.id, action: "approve" })
          }
          onReject={() => {
            if (!previewItem) return;
            setRejectItem(previewItem);
            setPreviewItem(null);
          }}
          isPending={reviewMutation.isPending}
        />
      </div>
    </div>
  );
}
