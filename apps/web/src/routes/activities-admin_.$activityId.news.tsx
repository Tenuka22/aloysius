"use client";

import { useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { EntityDialog } from "@aloysius-web/ui/lib/form-builder";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";
import { IconPlus, IconCheck, IconX } from "@tabler/icons-react";
import { orpc } from "@/utils/orpc";
import { toast } from "sonner";
import { NewsForm } from "@/components-client/news-form";

type ContentItem = {
  id: string;
  title: string;
  coverImage: string | null;
  status: string;
  reviewStatus: string | null;
  updatedAt: string;
};

const badgeStyles: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  published: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  revoked: "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  draft: "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  archived: "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
        badgeStyles[value] ?? badgeStyles.draft
      }`}
    >
      {value}
    </span>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 rounded-lg border bg-card animate-pulse" />
      ))}
    </div>
  );
}

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

export const Route = createFileRoute("/activities-admin_/$activityId/news")({
  component: ActivityAdminNews,
});

function ActivityAdminNews() {
  const { activityId } = useParams({ from: "/activities-admin_/$activityId" });
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [rejectItem, setRejectItem] = useState<{ id: string; title: string } | null>(null);

  const newsQuery = useQuery(
    orpc.news.list.queryOptions({ input: { activityId, pageSize: 100 } }),
  );

  const reviewMutation = useMutation(
    orpc.admin.clubs.reviewContent.mutationOptions({
      onSuccess: () => {
        toast.success("Review submitted");
        queryClient.invalidateQueries({ queryKey: orpc.news.key() });
        setRejectItem(null);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const newsItems = (newsQuery.data?.rows ?? []) as ContentItem[];

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">News</h1>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <IconPlus className="mr-1 size-4" />
            New Article
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        {newsQuery.isLoading ? (
          <SectionSkeleton />
        ) : newsItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No news yet.</div>
        ) : (
          <div className="space-y-3">
            {newsItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{item.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge value={item.status} />
                    <StatusBadge value={item.reviewStatus} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                {item.reviewStatus === "pending" && (
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={() => reviewMutation.mutate({ type: "news", id: item.id, action: "approve" })} disabled={reviewMutation.isPending}>
                      <IconCheck className="mr-1 size-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => setRejectItem({ id: item.id, title: item.title })}
                      disabled={reviewMutation.isPending}
                    >
                      <IconX className="mr-1 size-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Article</DialogTitle>
          </DialogHeader>
          <NewsForm
            mode="create"
            activityId={activityId}
            onSuccess={() => {
              setCreateOpen(false);
              queryClient.invalidateQueries({ queryKey: orpc.news.key() });
            }}
          />
        </DialogContent>
      </Dialog>

      <EntityDialog<RejectFormValues>
        open={!!rejectItem}
        onOpenChange={(open) => !open && setRejectItem(null)}
        title={`Reject ${rejectItem ? "Article" : "Content"}`}
        description="The author will see this reason on their club page."
        config={rejectConfig}
        defaultValues={{ reason: "" }}
        onSubmit={async (values) => {
          if (!rejectItem) return;
          await reviewMutation.mutateAsync({
            type: "news",
            id: rejectItem.id,
            action: "reject",
            reason: values.reason || undefined,
          });
        }}
        actionLabel="Reject"
      />
    </div>
  );
}
