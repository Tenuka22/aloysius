"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@aloysius-web/ui/components/tabs";
import { EntityDialog } from "@aloysius-web/ui/lib/form-builder";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";
import {
  IconArrowLeft,
  IconCheck,
  IconCopy,
  IconKey,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";
import { orpc } from "@/utils/orpc";
import { toast } from "sonner";
import { Input } from "@aloysius-web/ui/components/input";
import { Card, CardContent } from "@aloysius-web/ui/components/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@aloysius-web/ui/components/alert-dialog";

type ContentType = "news" | "event" | "announcement" | "studentWork" | "album";

type ContentItem = {
  id: string;
  title: string;
  coverImage: string | null;
  status: string;
  reviewStatus: string | null;
  updatedAt: string;
};

type MemberItem = {
  id: string;
  userId: string;
  name: string | null;
  role: string;
  status: string;
  updatedAt: string;
};

const activityTypeLabels: Record<string, string> = {
  club: "Club",
  sport: "Sport",
  other: "Other",
};

const contentTypeLabels: Record<ContentType, string> = {
  news: "News",
  event: "Event",
  announcement: "Announcement",
  studentWork: "Student Work",
  album: "Photo Album",
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

function ContentList({
  items,
  isLoading,
  emptyLabel,
  onApprove,
  onReject,
  isMutating,
}: {
  items: ContentItem[];
  isLoading: boolean;
  emptyLabel: string;
  onApprove: (item: ContentItem) => void;
  onReject: (item: ContentItem) => void;
  isMutating: boolean;
}) {
  if (isLoading) return <SectionSkeleton />;

  if (items.length === 0) {
    return <div className="text-center text-muted-foreground py-8">{emptyLabel}</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-4 rounded-lg border bg-card p-3"
        >
          {item.coverImage ? (
            <img
              src={item.coverImage}
              alt=""
              className="h-16 w-16 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground">
              No image
            </div>
          )}
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
              <Button size="sm" onClick={() => onApprove(item)} disabled={isMutating}>
                <IconCheck className="mr-1 size-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={() => onReject(item)}
                disabled={isMutating}
              >
                <IconX className="mr-1 size-4" />
                Reject
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MembersList({ items, isLoading }: { items: MemberItem[]; isLoading: boolean }) {
  if (isLoading) return <SectionSkeleton />;

  if (items.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No members yet.</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between gap-4 rounded-lg border bg-card p-3"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{member.name || member.userId}</p>
            <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
          </div>
          <StatusBadge value={member.status} />
        </div>
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

export const Route = createFileRoute("/admin/activities_/$id")({
  component: ActivityContentPage,
});

function ActivityContentPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [rejectItem, setRejectItem] = useState<{
    type: ContentType;
    id: string;
    title: string;
  } | null>(null);

  const activityQuery = useQuery(orpc.activities.get.queryOptions({ input: { id } }));

  const newsQuery = useQuery(
    orpc.news.list.queryOptions({ input: { activityId: id, pageSize: 100 } }),
  );
  const eventsQuery = useQuery(
    orpc.events.list.queryOptions({ input: { activityId: id, pageSize: 100 } }),
  );
  const announcementsQuery = useQuery(
    orpc.announcements.list.queryOptions({ input: { activityId: id, pageSize: 100 } }),
  );
  const studentWorksQuery = useQuery(
    orpc.studentWorks.list.queryOptions({ input: { activityId: id, pageSize: 100 } }),
  );
  const albumsQuery = useQuery(
    orpc.clubAlbums.list.queryOptions({ input: { activityId: id, pageSize: 100 } }),
  );
  const membersQuery = useQuery(
    orpc.clubs.listMembers.queryOptions({ input: { activityId: id } }),
  );

  const reviewMutation = useMutation(
    orpc.admin.clubs.reviewContent.mutationOptions({
      onSuccess: () => {
        toast.success("Review submitted");
        queryClient.invalidateQueries({ queryKey: orpc.activities.key() });
        queryClient.invalidateQueries({ queryKey: orpc.news.key() });
        queryClient.invalidateQueries({ queryKey: orpc.announcements.key() });
        queryClient.invalidateQueries({ queryKey: orpc.studentWorks.key() });
        queryClient.invalidateQueries({ queryKey: orpc.clubAlbums.key() });
        queryClient.invalidateQueries({ queryKey: orpc.clubs.key() });
        setRejectItem(null);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const credentialsQuery = useQuery(
    orpc.admin.activities.getCredentials.queryOptions({ input: { id } }),
  );
  const rotateCredentialsMutation = useMutation(
    orpc.admin.activities.rotateCredentials.mutationOptions({
      onSuccess: (data) => {
        setLastPassword(data.password);
        toast.success("Password rotated");
        setRotateDialogOpen(false);
        setRotateConfirmText("");
        queryClient.invalidateQueries({ queryKey: orpc.admin.activities.key() });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [rotateConfirmText, setRotateConfirmText] = useState("");
  const [lastPassword, setLastPassword] = useState<string | null>(null);

  const activity = activityQuery.data;
  const credentials = credentialsQuery.data;
  const canRotate =
    !!activity && rotateConfirmText.trim() === activity.name;

  const copyPassword = async () => {
    if (!lastPassword) return;
    try {
      await navigator.clipboard.writeText(lastPassword);
      toast.success("Password copied");
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };
  const newsItems = (newsQuery.data?.rows ?? []) as ContentItem[];
  const eventItems = (eventsQuery.data?.rows ?? []) as ContentItem[];
  const announcementItems = (announcementsQuery.data?.rows ?? []) as ContentItem[];
  const studentWorkItems = (studentWorksQuery.data?.rows ?? []) as ContentItem[];
  const albumItems = (albumsQuery.data?.rows ?? []) as ContentItem[];
  const memberItems = (membersQuery.data ?? []) as MemberItem[];

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link to="/admin/activities" />}
          nativeButton={false}
        >
          <IconArrowLeft className="size-4" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold">{activity?.name ?? "Activity"}</h1>
          {activity && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {activityTypeLabels[activity.type] ?? activity.type}
              </span>
              <StatusBadge value={activity.status} />
            </div>
          )}
        </div>
      </header>
      <div className="flex-1 p-6">
        {activity && (
          <Card className="border-secondary/20 mb-6">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <IconShieldCheck className="size-4 text-primary shrink-0" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Admin Login Credentials
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground break-all mb-1.5">
                    {credentials?.email ?? "Generating…"}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The admin responsible for this {activity.type}&apos;s roster and content signs
                    in with these credentials to moderate submissions without being a site admin.
                    The password is auto-generated and can be rotated at any time.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-1">
                  {lastPassword && (
                    <div className="flex items-center gap-1.5 rounded-md border bg-muted/60 px-2.5 py-1.5">
                      <code className="font-mono text-sm text-foreground">{lastPassword}</code>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={copyPassword}
                        aria-label="Copy new password"
                        className="size-7"
                      >
                        <IconCopy className="size-3.5" />
                      </Button>
                    </div>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setRotateDialogOpen(true)}>
                    <IconKey className="mr-1.5 size-4" />
                    {credentials?.hasPassword ? "Rotate" : "Generate"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Tabs defaultValue="news">
          <TabsList variant="line">
            <TabsTrigger value="news">News ({newsItems.length})</TabsTrigger>
            <TabsTrigger value="events">Events ({eventItems.length})</TabsTrigger>
            <TabsTrigger value="announcements">
              Announcements ({announcementItems.length})
            </TabsTrigger>
            <TabsTrigger value="studentWorks">
              Student Works ({studentWorkItems.length})
            </TabsTrigger>
            <TabsTrigger value="albums">Gallery Albums ({albumItems.length})</TabsTrigger>
            <TabsTrigger value="members">Members ({memberItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="mt-4">
            <ContentList
              items={newsItems}
              isLoading={newsQuery.isLoading}
              emptyLabel="No news yet."
              onApprove={(item) =>
                reviewMutation.mutate({ type: "news", id: item.id, action: "approve" })
              }
              onReject={(item) => setRejectItem({ type: "news", id: item.id, title: item.title })}
              isMutating={reviewMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <ContentList
              items={eventItems}
              isLoading={eventsQuery.isLoading}
              emptyLabel="No events yet."
              onApprove={(item) =>
                reviewMutation.mutate({ type: "event", id: item.id, action: "approve" })
              }
              onReject={(item) =>
                setRejectItem({ type: "event", id: item.id, title: item.title })
              }
              isMutating={reviewMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="announcements" className="mt-4">
            <ContentList
              items={announcementItems}
              isLoading={announcementsQuery.isLoading}
              emptyLabel="No announcements yet."
              onApprove={(item) =>
                reviewMutation.mutate({ type: "announcement", id: item.id, action: "approve" })
              }
              onReject={(item) =>
                setRejectItem({ type: "announcement", id: item.id, title: item.title })
              }
              isMutating={reviewMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="studentWorks" className="mt-4">
            <ContentList
              items={studentWorkItems}
              isLoading={studentWorksQuery.isLoading}
              emptyLabel="No student works yet."
              onApprove={(item) =>
                reviewMutation.mutate({ type: "studentWork", id: item.id, action: "approve" })
              }
              onReject={(item) =>
                setRejectItem({ type: "studentWork", id: item.id, title: item.title })
              }
              isMutating={reviewMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="albums" className="mt-4">
            <ContentList
              items={albumItems}
              isLoading={albumsQuery.isLoading}
              emptyLabel="No gallery albums yet."
              onApprove={(item) =>
                reviewMutation.mutate({ type: "album", id: item.id, action: "approve" })
              }
              onReject={(item) =>
                setRejectItem({ type: "album", id: item.id, title: item.title })
              }
              isMutating={reviewMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <MembersList items={memberItems} isLoading={membersQuery.isLoading} />
          </TabsContent>
        </Tabs>

        <EntityDialog<RejectFormValues>
          open={!!rejectItem}
          onOpenChange={(open) => !open && setRejectItem(null)}
          title={`Reject ${rejectItem ? contentTypeLabels[rejectItem.type] : "Content"}`}
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

        <AlertDialog open={rotateDialogOpen} onOpenChange={setRotateDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {credentials?.hasPassword ? "Rotate admin password" : "Generate admin password"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {credentials?.hasPassword
                  ? "A new random password will be generated and the old one will stop working immediately. Type the activity name to confirm."
                  : "An auto-generated password will be created for the admin of this activity. Type the activity name to confirm."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div>
              <label className="text-xs font-medium text-foreground">
                Type <span className="font-mono">{activity?.name}</span> to confirm
              </label>
              <Input
                value={rotateConfirmText}
                onChange={(e) => setRotateConfirmText(e.target.value)}
                placeholder={activity?.name}
                className="mt-2"
                autoFocus
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={!canRotate || rotateCredentialsMutation.isPending}
                onClick={() => rotateCredentialsMutation.mutate({ id })}
              >
                {rotateCredentialsMutation.isPending
                  ? "Rotating…"
                  : credentials?.hasPassword
                    ? "Rotate password"
                    : "Generate password"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
