"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
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
import { client } from "@/utils/orpc";
import { toast } from "sonner";

type Membership = {
  id: string;
  activityId: string;
  userId: string;
  name: string | null;
  role: "admin" | "member";
  status: "pending" | "approved" | "rejected" | "revoked";
  reason: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ContentItem = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  description?: string | null;
  coverImage: string | null;
  status: string;
  activityId: string | null;
  reviewStatus: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

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
  const { sessionClaims } = useAuth();
  const queryClient = useQueryClient();
  const isSiteAdmin = sessionClaims?.metadata?.role === "admin";

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

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["activities", id],
    queryFn: () => client.activities.get({ id }),
  });

  const { data: myMembership, isLoading: membershipLoading } = useQuery({
    queryKey: ["clubs", "membership", id],
    queryFn: () => client.clubs.membership({ activityId: id }),
  });

  const myStatus = myMembership?.status ?? null;
  const myRole = myMembership?.role ?? null;
  const isApproved = myStatus === "approved";
  const isClubAdmin = isSiteAdmin || (myRole === "admin" && myStatus === "approved");

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["clubs", "members", id],
    queryFn: () => client.clubs.listMembers({ activityId: id }),
    enabled: isApproved || isSiteAdmin,
  });

  const canViewContent = isApproved || isSiteAdmin;

  const { data: events } = useQuery({
    queryKey: ["events", "club", id],
    queryFn: () => client.events.list({ activityId: id, pageSize: 50 }),
    enabled: canViewContent,
  });

  const { data: announcements } = useQuery({
    queryKey: ["announcements", "club", id],
    queryFn: () => client.announcements.list({ activityId: id, pageSize: 50 }),
    enabled: canViewContent,
  });

  const { data: studentWorks } = useQuery({
    queryKey: ["studentWorks", "club", id],
    queryFn: () => client.studentWorks.list({ activityId: id, pageSize: 50 }),
    enabled: canViewContent,
  });

  const { data: news } = useQuery({
    queryKey: ["news", "club", id],
    queryFn: () => client.news.list({ activityId: id, pageSize: 50 }),
    enabled: canViewContent,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["clubs"] });
    queryClient.invalidateQueries({ queryKey: ["news"] });
    queryClient.invalidateQueries({ queryKey: ["events"] });
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
    queryClient.invalidateQueries({ queryKey: ["studentWorks"] });
  };

  const requestMembership = useMutation({
    mutationFn: () => client.clubs.requestMembership({ activityId: id }),
    onSuccess: () => {
      toast.success("Membership request sent for approval");
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const approveMember = useMutation({
    mutationFn: (membershipId: string) => client.clubs.approveMember({ id: membershipId }),
    onSuccess: () => {
      toast.success("Member approved");
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMember = useMutation({
    mutationFn: (membershipId: string) =>
      client.clubs.rejectMember({ id: membershipId, reason: rejectReason || undefined }),
    onSuccess: () => {
      toast.success("Application rejected");
      setRejectId(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const revokeMember = useMutation({
    mutationFn: (membershipId: string) => client.clubs.revokeMember({ id: membershipId }),
    onSuccess: () => {
      toast.success("Member access revoked");
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteContent = useMutation({
    mutationFn: ({
      type,
      itemId,
    }: {
      type: "news" | "event" | "announcement" | "studentWork";
      itemId: string;
    }) => {
      if (type === "news") return client.news.delete({ id: itemId });
      if (type === "event") return client.events.delete({ id: itemId });
      if (type === "announcement") return client.announcements.delete({ id: itemId });
      return client.studentWorks.delete({ id: itemId });
    },
    onSuccess: () => {
      toast.success("Content deleted");
      invalidateAll();
    },
    onError: (err) => toast.error(err.message),
  });

  const pendingMembers = (members ?? []).filter((m: Membership) => m.status === "pending");
  const approvedMembers = (members ?? []).filter((m: Membership) => m.status === "approved");

  const newsItems = (news?.rows ?? []) as unknown as ContentItem[];
  const eventItems = (events?.rows ?? []) as unknown as ContentItem[];
  const announcementItems = (announcements?.rows ?? []) as unknown as ContentItem[];
  const studentWorkItems = (studentWorks?.rows ?? []) as unknown as ContentItem[];

  const renderReviewBadge = (item: ContentItem) => (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        reviewStyles[item.reviewStatus] ?? reviewStyles.approved
      }`}
    >
      {reviewLabels[item.reviewStatus] ?? "Approved"}
    </span>
  );

  const renderContentRow = (
    item: ContentItem,
    type: "news" | "event" | "announcement" | "studentWork",
  ) => {
    const canEdit = isSiteAdmin || isClubAdmin || item.userId === myMembership?.userId;
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
              &larr; Back to My Clubs
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
                  onClick={() => requestMembership.mutate()}
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
                    onClick={() => requestMembership.mutate()}
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
                            {pendingMembers.map((m: Membership) => (
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
                                    onClick={() => approveMember.mutate(m.id)}
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
                            {approvedMembers.map((m: Membership) => (
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
                                    onClick={() => revokeMember.mutate(m.id)}
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
                onClick={() => rejectId && rejectMember.mutate(rejectId)}
                disabled={rejectMember.isPending}
              >
                Reject Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
