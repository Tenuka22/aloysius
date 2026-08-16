import type { client } from "@/utils/orpc";

type ProcedureOutput<P> = P extends (...args: any[]) => any
  ? Awaited<ReturnType<P>>
  : never;
type ArrayElement<T> = T extends Array<infer E> ? E : never;
type ListRow<P> = ProcedureOutput<P> extends { rows: infer R }
  ? ArrayElement<R>
  : ArrayElement<ProcedureOutput<P>>;

// --- News ---
export type NewsDetail = ProcedureOutput<typeof client.news.get>;
export type NewsRow = ListRow<typeof client.news.list>;

// --- Events ---
export type EventDetail = ProcedureOutput<typeof client.events.get>;
export type EventRow = ListRow<typeof client.events.list>;
export type EventRecord = ProcedureOutput<typeof client.events.listRecords>[number];

// --- Announcements ---
export type AnnouncementDetail = ProcedureOutput<typeof client.announcements.get>;
export type AnnouncementRow = ListRow<typeof client.announcements.list>;

// --- Achievements ---
export type AchievementDetail = ProcedureOutput<typeof client.achievements.get>;
export type AchievementRow = ListRow<typeof client.achievements.list>;

// --- Student Works ---
export type StudentWorkDetail = ProcedureOutput<typeof client.studentWorks.get>;
export type StudentWorkRow = ListRow<typeof client.studentWorks.list>;

// --- Gallery ---
export type GalleryAlbumDetail = ProcedureOutput<typeof client.gallery.get>;
export type GalleryAlbumRow = ListRow<typeof client.gallery.list>;
export type GalleryImage = ListRow<typeof client.gallery.listImages>;

// --- Principals ---
export type PrincipalDetail = ProcedureOutput<typeof client.principals.get>;
export type PrincipalRow = ListRow<typeof client.principals.list>;

// --- Stats ---
export type StatItem = ListRow<typeof client.stats.list>;

// --- Activities ---
export type ActivityDetail = ProcedureOutput<typeof client.activities.get>;
export type ActivityRow = ListRow<typeof client.activities.list>;

// --- Big Matches ---
export type BigMatchDetail = ProcedureOutput<typeof client.bigMatches.get>;
export type BigMatchRow = ListRow<typeof client.bigMatches.list>;

// --- Exam Results ---
export type ExamResultRow = ListRow<typeof client.examResults.list>;

// --- Clubs ---
export type ClubMembership = ProcedureOutput<typeof client.clubs.membership>;
export type ClubMember = ProcedureOutput<typeof client.clubs.listMembers>[number];
export type ClubContentItem = NewsRow | EventRow | AnnouncementRow | StudentWorkRow;

// --- Club Albums ---
export type ClubAlbumRow = ListRow<typeof client.clubAlbums.list>;
export type ClubAlbumDetail = ProcedureOutput<typeof client.clubAlbums.get>;

// --- Old Boys ---
export type OBMember = ProcedureOutput<typeof client.ob.obMembers.list>[number];
export type OBMembership = ProcedureOutput<typeof client.ob.obMembers.myMembership>;
export type OBEvent = ProcedureOutput<typeof client.ob.obEvents.list>[number];
export type OBEventDetail = ProcedureOutput<typeof client.ob.obEvents.get>;
export type OBDonation = ProcedureOutput<typeof client.ob.obDonations.list>[number];
export type OBEventGallery = ProcedureOutput<
  typeof client.ob.obEventGalleries.list
>[number];
export type OBNews = ProcedureOutput<typeof client.ob.obNews.list>[number];
export type OBNewsDetail = ProcedureOutput<typeof client.ob.obNews.get>;
export type OBAnnouncement = ProcedureOutput<typeof client.ob.obAnnouncements.list>[number];
export type OBAnnouncementDetail = ProcedureOutput<typeof client.ob.obAnnouncements.get>;
export type OBGalleryRow = ProcedureOutput<typeof client.ob.obGallery.list>[number];

// --- Admin ---
export type PendingReviewItem = ProcedureOutput<
  typeof client.admin.clubs.listPendingContent
>[number];