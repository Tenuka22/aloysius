"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "@/lib/auth-client";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { Button } from "@aloysius-web/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { Tabs, TabsList, TabsTrigger } from "@aloysius-web/ui/components/tabs";
import { EventForm } from "@/components-client/event-form";
import { AnnouncementForm } from "@/components-client/announcement-form";
import { StudentWorkForm } from "@/components-client/student-work-form";
import { NewsForm } from "@/components-client/news-form";
import { ClubAlbums } from "@/components-client/club-albums";
import { ActivitiesForm } from "@/components-client/activities-form";
import { IconPencil } from "@tabler/icons-react";
import { orpc } from "@/utils/orpc";
import { toast } from "sonner";
import type { ClubContentItem } from "@/lib/api-types";

const membershipStatusStyles: Record<string, string> = {
  approved: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  revoked: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const reviewStyles: Record<string, string> = {
  approved: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const reviewLabels: Record<string, string> = {
  approved: "Approved",
  pending: "Pending Review",
  rejected: "Rejected",
};

const typeLabels: Record<string, string> = {
  club: "Club",
  sport: "Sport",
  other: "Other",
};

function MembershipBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        membershipStatusStyles[status] ?? membershipStatusStyles.pending
      }`}
    >
      {status === "approved"
        ? "Member"
        : status === "pending"
          ? "Application Pending"
          : status === "rejected"
            ? "Application Rejected"
            : "Access Revoked"}
    </span>
  );
}

export const Route = createFileRoute("/clubs_/$id")({
  component: ClubPage,
});

function ClubPage() {
  const { id } = Route.useParams();
  const { user } = useAuthSession();
  const queryClient = useQueryClient();
  const isSiteAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<string>("events");
  const [createType, setCreateType] = useState<
    "news" | "event" | "announcement" | "studentWork" | null
  >(null);
  const [editItem, setEditItem] = useState<{
    type: "news" | "event" | "announcement" | "studentWork";
    id: string;
  } | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [editClubOpen, setEditClubOpen] = useState(false);

  const { data: activity, isLoading: activityLoading } = useQuery(
    orpc.activities.get.queryOptions({ input: { id } }),
  );

  const { data: myMembership, isLoading: membershipLoading } = useQuery(
    orpc.clubs.membership.queryOptions({ input: { activityId: id } }),
  );

  const myStatus = myMembership?.status ?? null;
  const isApproved = myStatus === "approved";
  const isClubAdmin = isSiteAdmin || myMembership?.isAdmin === true;

  const { data: members, isLoading: membersLoading } = useQuery(
    orpc.clubs.listMembers.queryOptions({
      input: { activityId: id },
      enabled: isApproved || isSiteAdmin,
    }),
  );

  const canViewContent = isApproved || isSiteAdmin;

  const { data: events } = useQuery(
    orpc.events.list.queryOptions({
      input: { activityId: id, pageSize: 50 },
      enabled: canViewContent,
    }),
  );

  const { data: announcements } = useQuery(
    orpc.announcements.list.queryOptions({
      input: { activityId: id, pageSize: 50 },
      enabled: canViewContent,
    }),
  );

  const { data: studentWorks } = useQuery(
    orpc.studentWorks.list.queryOptions({
      input: { activityId: id, pageSize: 50 },
      enabled: canViewContent,
    }),
  );

  const { data: news } = useQuery(
    orpc.news.list.queryOptions({
      input: { activityId: id, pageSize: 50 },
      enabled: canViewContent,
    }),
  );

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: orpc.clubs.key() });
    queryClient.invalidateQueries({ queryKey: orpc.news.key() });
    queryClient.invalidateQueries({ queryKey: orpc.events.key() });
    queryClient.invalidateQueries({ queryKey: orpc.announcements.key() });
    queryClient.invalidateQueries({ queryKey: orpc.studentWorks.key() });
  };

  const requestMembership = useMutation(
    orpc.clubs.requestMembership.mutationOptions({
      onSuccess: () => {
        toast.success("Membership request sent for approval");
        queryClient.invalidateQueries({ queryKey: orpc.clubs.key() });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const approveMember = useMutation(
    orpc.clubs.approveMember.mutationOptions({
      onSuccess: () => {
        toast.success("Member approved");
        queryClient.invalidateQueries({ queryKey: orpc.clubs.key() });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const rejectMember = useMutation(
    orpc.clubs.rejectMember.mutationOptions({
      onSuccess: () => {
        toast.success("Application rejected");
        setRejectId(null);
        setRejectReason("");
        queryClient.invalidateQueries({ queryKey: orpc.clubs.key() });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const revokeMember = useMutation(
    orpc.clubs.revokeMember.mutationOptions({
      onSuccess: () => {
        toast.success("Member access revoked");
        queryClient.invalidateQueries({ queryKey: orpc.clubs.key() });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const deleteContentOptions = {
    onSuccess: () => {
      toast.success("Content deleted");
      invalidateAll();
    },
    onError: (err: Error) => toast.error(err.message),
  };
  const deleteNews = useMutation(orpc.news.delete.mutationOptions(deleteContentOptions));
  const deleteEvent = useMutation(orpc.events.delete.mutationOptions(deleteContentOptions));
  const deleteAnnouncement = useMutation(
    orpc.announcements.delete.mutationOptions(deleteContentOptions),
  );
  const deleteStudentWork = useMutation(
    orpc.studentWorks.delete.mutationOptions(deleteContentOptions),
  );
  const deleteContent = {
    mutate: ({
      type,
      itemId,
    }: {
      type: "news" | "event" | "announcement" | "studentWork";
      itemId: string;
    }) => {
      if (type === "news") return deleteNews.mutate({ id: itemId });
      if (type === "event") return deleteEvent.mutate({ id: itemId });
      if (type === "announcement") return deleteAnnouncement.mutate({ id: itemId });
      return deleteStudentWork.mutate({ id: itemId });
    },
  };

  const pendingMembers = (members ?? []).filter((m) => m.status === "pending");
  const approvedMembers = (members ?? []).filter((m) => m.status === "approved");

  const newsItems = news?.rows ?? [];
  const eventItems = events?.rows ?? [];
  const announcementItems = announcements?.rows ?? [];
  const studentWorkItems = studentWorks?.rows ?? [];

  const renderReviewBadge = (item: ClubContentItem) => (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        reviewStyles[item.reviewStatus] ?? reviewStyles.approved
      }`}
    >
      {reviewLabels[item.reviewStatus] ?? "Approved"}
    </span>
  );

  const renderContentRow = (item: ClubContentItem, type: "news" | "event" | "announcement" | "studentWork") => {
    const canEdit =
      isSiteAdmin || isClubAdmin || ("userId" in item && item.userId === myMembership?.userId);
    return (
      <div
        key={item.id}
        className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium">{item.title}</h4>
            {renderReviewBadge(item)}
          </div>
          {item.rejectionReason && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Reason: {item.rejectionReason}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Updated {new Date(item.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canEdit && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditItem({ type, id: item.id })}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => deleteContent.mutate({ type, itemId: item.id })}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  if (activityLoading || membershipLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="px-4 sm:px-6 lg:px-8 pt-16 pb-16">
          <div className="mx-auto max-w-5xl space-y-4">
            <div className="h-10 w-1/3 rounded bg-muted animate-pulse" />
            <div className="h-40 rounded-xl bg-muted animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="px-4 py-16 text-center text-muted-foreground">Club not found.</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        {/* Hero */}
        <section className="px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="mx-auto max-w-5xl">
            <Link
              to="/clubs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Back to Clubs
            </Link>
            {activity.bannerUrl && (
              <div className="mt-4 overflow-hidden rounded-2xl border">
                <img
                  src={activity.bannerUrl}
                  alt={`${activity.name} banner`}
                  className="w-full aspect-[16/9] object-cover"
                />
              </div>
            )}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-6">
              {activity.logoUrl ? (
                <div className="w-40 h-40 rounded-2xl overflow-hidden shrink-0 border bg-card">
                  <img
                    src={activity.logoUrl}
                    alt={activity.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : activity.coverImage ? (
                <div className="w-40 h-40 rounded-2xl overflow-hidden shrink-0">
                  <img
                    src={activity.coverImage}
                    alt={activity.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-40 h-40 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                  <span className="text-5xl font-bold text-muted-foreground/30">
                    {activity.name.slice(0, 1)}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{activity.name}</h1>
                  {myMembership && <MembershipBadge status={myMembership.status} />}
                  {isClubAdmin && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      Club Admin
                    </span>
                  )}
                  {isClubAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditClubOpen(true)}
                    >
                      <IconPencil className="size-3.5 mr-1" /> Edit Club
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">
                  {typeLabels[activity.type] ?? activity.type}
                </p>
                {activity.description && (
                  <p className="text-muted-foreground mt-3 max-w-2xl">{activity.description}</p>
                )}
              </div>
            </div>

            {/* Membership actions */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {!myMembership && (
                <Button
                  onClick={() => requestMembership.mutate({ activityId: id })}
                  disabled={requestMembership.isPending}
                >
                  {requestMembership.isPending ? "Sending..." : "Request to Join"}
                </Button>
              )}
              {(myMembership?.status === "rejected" || myMembership?.status === "revoked") && (
                <>
                  {myMembership.reason && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {myMembership.status === "rejected" ? "Rejected" : "Revoked"}:{" "}
                      {myMembership.reason}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => requestMembership.mutate({ activityId: id })}
                    disabled={requestMembership.isPending}
                  >
                    Request Again
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Content */}
        {canViewContent ? (
          <section className="px-4 sm:px-6 lg:px-8 pb-16">
            <div className="mx-auto max-w-5xl">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <TabsList variant="line">
                    <TabsTrigger value="news">News ({newsItems.length})</TabsTrigger>
                    <TabsTrigger value="events">Events ({eventItems.length})</TabsTrigger>
                    <TabsTrigger value="announcements">
                      Announcements ({announcementItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="works">
                      Student Works ({studentWorkItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="albums">Albums</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                  </TabsList>
                  {activeTab === "news" && (
                    <Button size="sm" onClick={() => setCreateType("news")}>
                      New News
                    </Button>
                  )}
                  {activeTab === "events" && (
                    <Button size="sm" onClick={() => setCreateType("event")}>
                      New Event
                    </Button>
                  )}
                  {activeTab === "announcements" && (
                    <Button size="sm" onClick={() => setCreateType("announcement")}>
                      New Announcement
                    </Button>
                  )}
                  {activeTab === "works" && (
                    <Button size="sm" onClick={() => setCreateType("studentWork")}>
                      New Student Work
                    </Button>
                  )}
                </div>

                <div className="mt-6">
                  {activeTab === "news" && (
                    <div className="space-y-3">
                      {newsItems.length === 0 && (
                        <p className="text-center text-muted-foreground py-12">
                          No news yet. Share the latest from your club.
                        </p>
                      )}
                      {newsItems.map((item) => renderContentRow(item, "news"))}
                    </div>
                  )}
                  {activeTab === "events" && (
                    <div className="space-y-3">
                      {eventItems.length === 0 && (
                        <p className="text-center text-muted-foreground py-12">
                          No events yet. Create your club's first event.
                        </p>
                      )}
                      {eventItems.map((item) => renderContentRow(item, "event"))}
                    </div>
                  )}
                  {activeTab === "announcements" && (
                    <div className="space-y-3">
                      {announcementItems.length === 0 && (
                        <p className="text-center text-muted-foreground py-12">
                          No announcements yet.
                        </p>
                      )}
                      {announcementItems.map((item) => renderContentRow(item, "announcement"))}
                    </div>
                  )}
                  {activeTab === "works" && (
                    <div className="space-y-3">
                      {studentWorkItems.length === 0 && (
                        <p className="text-center text-muted-foreground py-12">
                          No student works yet.
                        </p>
                      )}
                      {studentWorkItems.map((item) => renderContentRow(item, "studentWork"))}
                    </div>
                  )}
                  {activeTab === "albums" && (
                    <ClubAlbums
                      activityId={id}
                      isSiteAdmin={isSiteAdmin}
                      isClubAdmin={isClubAdmin}
                      myUserId={myMembership?.userId}
                    />
                  )}
                  {activeTab === "members" && (
                    <div className="space-y-6">
                      {isClubAdmin && pendingMembers.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Pending Requests</h3>
                          <div className="space-y-2">
                            {pendingMembers.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4"
                              >
                                <div>
                                  <p className="font-medium">{m.name ?? m.userId}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Requested {new Date(m.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => approveMember.mutate({ id: m.id })}
                                    disabled={approveMember.isPending}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive"
                                    onClick={() => {
                                      setRejectId(m.id);
                                      setRejectReason("");
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="font-semibold mb-3">Members</h3>
                        {membersLoading ? (
                          <p className="text-sm text-muted-foreground">Loading...</p>
                        ) : approvedMembers.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No approved members yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {approvedMembers.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="size-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                    {(m.name ?? "?").slice(0, 1).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {m.name ?? m.userId}
                                      {m.role === "admin" && (
                                        <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                          Admin
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Member since{" "}
                                      {new Date(m.decidedAt ?? m.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                {isClubAdmin && m.role !== "admin" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive"
                                    onClick={() => revokeMember.mutate({ id: m.id })}
                                    disabled={revokeMember.isPending}
                                  >
                                    Revoke
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Tabs>
            </div>
          </section>
        ) : (
          <section className="px-4 sm:px-6 lg:px-8 pb-16">
            <div className="mx-auto max-w-5xl rounded-xl border border-dashed p-12 text-center">
              <h2 className="text-lg font-semibold mb-2">
                {myMembership?.status === "pending"
                  ? "Your application is pending approval"
                  : "Become a member to view club content"}
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {myMembership?.status === "pending"
                  ? "A club admin will review your request. You'll be able to post news, events, announcements, student works, and photo albums once approved."
                  : "Request to join this club to contribute news, events, announcements, student works, and photo albums."}
              </p>
            </div>
          </section>
        )}
      </main>
      <Footer />

      {/* Create dialogs */}
      <Dialog open={createType === "news"} onOpenChange={(open) => !open && setCreateType(null)}>
        <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New News Article</DialogTitle>
          </DialogHeader>
          <NewsForm
            mode="create"
            activityId={id}
            onSuccess={() => {
              setCreateType(null);
              invalidateAll();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={createType === "event"} onOpenChange={(open) => !open && setCreateType(null)}>
        <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Event</DialogTitle>
          </DialogHeader>
          <EventForm
            mode="create"
            activityId={id}
            onSuccess={() => {
              setCreateType(null);
              invalidateAll();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={createType === "announcement"}
        onOpenChange={(open) => !open && setCreateType(null)}
      >
        <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
          </DialogHeader>
          <AnnouncementForm
            mode="create"
            activityId={id}
            onSuccess={() => {
              setCreateType(null);
              invalidateAll();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={createType === "studentWork"}
        onOpenChange={(open) => !open && setCreateType(null)}
      >
        <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Student Work</DialogTitle>
          </DialogHeader>
          <StudentWorkForm
            mode="create"
            activityId={id}
            onSuccess={() => {
              setCreateType(null);
              invalidateAll();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialogs */}
      <Dialog
        open={editItem?.type === "news" && !!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
      >
        <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit News Article</DialogTitle>
          </DialogHeader>
          <NewsForm
            mode="edit"
            id={editItem?.id}
            onSuccess={() => {
              setEditItem(null);
              invalidateAll();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editItem?.type === "event" && !!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
      >
        <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <EventForm
            mode="edit"
            id={editItem?.id}
            onSuccess={() => {
              setEditItem(null);
              invalidateAll();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editItem?.type === "announcement" && !!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
      >
        <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          <AnnouncementForm
            mode="edit"
            id={editItem?.id}
            onSuccess={() => {
              setEditItem(null);
              invalidateAll();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editItem?.type === "studentWork" && !!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
      >
        <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student Work</DialogTitle>
          </DialogHeader>
          <StudentWorkForm
            mode="edit"
            id={editItem?.id}
            onSuccess={() => {
              setEditItem(null);
              invalidateAll();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Reject member dialog */}
      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium leading-none">Reason (optional)</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why are you rejecting this application?"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectId && rejectMember.mutate({ id: rejectId, reason: rejectReason || undefined })}
                disabled={rejectMember.isPending}
              >
                Reject Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit club branding dialog (club admin) */}
      <Dialog open={editClubOpen} onOpenChange={setEditClubOpen}>
        <DialogContent className="w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
          </DialogHeader>
          {editClubOpen && (
            <ActivitiesForm
              mode="edit"
              id={id}
              onSuccess={() => {
                setEditClubOpen(false);
                queryClient.invalidateQueries({ queryKey: orpc.activities.get.key({ input: { id } }) });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
