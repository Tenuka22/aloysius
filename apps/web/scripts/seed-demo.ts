/**
 * Seeds the dev database with realistic content across every CMS-direct and
 * club-submitted content type, using real photographs (via picsum.photos'
 * seeded endpoint, which serves real stock photography with no API key
 * required - Pexels needs one this environment doesn't have).
 *
 * Destructive, on purpose, and scoped on purpose: it clears every row in
 * `gallery`, `club_photo`, `announcement`, `event`, `news_post` and
 * `achievement` before inserting its own, so re-running it gives a clean,
 * predictable demo state instead of accumulating duplicates. It does not
 * touch `user`, `session`, `files`, or any CMS page-block content - running
 * it never signs anyone out or disturbs the Homepage/About/etc. editors.
 *
 * Run from `apps/web`:
 *   bun x varlock run -- bun run scripts/seed-demo.ts
 *
 * Requires the `cms` and `photography-admin` seats to already exist
 * (ensureServerBootstrap seeds `cms` on server start; `photography-admin` is
 * created by whichever flow first provisions the club seat - sign in once,
 * or see HANDOVER.md).
 */

import { createClubCredential } from "@aloysius/auth";
import { announcement } from "@aloysius/db/schema/announcements";
import { user } from "@aloysius/db/schema/auth";
import { clubPhoto, gallery } from "@aloysius/db/schema/club-photos";
import { files } from "@aloysius/db/schema/files";
import { newsPost } from "@aloysius/db/schema/news-posts";
import { achievement, event } from "@aloysius/db/schema/root-content";
import { eq } from "drizzle-orm";

import { auth, getDb, getStorage } from "../src/services";

const db = getDb();
const storage = getStorage();

/**
 * The club seat this seeder needs as the submitter on club-proposed galleries.
 * Created on demand by `requireUserId` below.
 */
const CLUB_SEAT_USERNAME = "photography-admin";
const CLUB_SEAT_PASSWORD = "photography-seat-dev-password";

/**
 * Resolve a seat's user id, provisioning the club seat if it does not exist yet.
 *
 * `photography-admin` is the one seat nothing else creates: `createClubCredential`
 * is exported from @aloysius/auth but has no caller in the application (the
 * /admin screen only resets passwords for seats that already exist), so there is
 * no UI path that produces it. The seeder needs it as the submitter on the
 * club-proposed galleries, so it creates it rather than failing.
 *
 * `cms` is different - it is seeded by `ensureServerBootstrap` on every server
 * start, so it is always present and a missing one really is a problem.
 */
const requireUserId = async (username: string): Promise<string> => {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, username))
    .limit(1)
    .get();
  if (existing) {
    return existing.id;
  }

  if (username === CLUB_SEAT_USERNAME) {
    const created = await createClubCredential(auth, {
      username: CLUB_SEAT_USERNAME,
      password: CLUB_SEAT_PASSWORD,
      name: "Photography Club Administrator",
      role: "club-admin",
    });
    console.log(`Created the missing "${username}" seat.`);
    return created.id;
  }

  throw new Error(
    `No seeded "${username}" account - start the server once (it seeds this seat on boot) and try again.`
  );
};

/** A real photograph from picsum.photos' seeded endpoint, stable across
 * runs (the same `seedName` always returns the same image), stored through
 * the same storage layer `/api/files` uses. */
const uploadSeedImage = async (
  seedName: string,
  width: number,
  height: number,
  uploaderId: string
): Promise<string> => {
  const response = await fetch(
    `https://picsum.photos/seed/${encodeURIComponent(seedName)}/${width}/${height}`
  );
  if (!response.ok) {
    throw new Error(
      `Could not fetch seed image "${seedName}": ${response.status}`
    );
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const id = crypto.randomUUID();
  const key = `admin/${id}.jpg`;

  await storage.put(key, buffer, "image/jpeg");
  await db.insert(files).values({
    id,
    name: `${seedName}.jpg`,
    size: buffer.length,
    type: "image/jpeg",
    key,
    userId: uploaderId,
  });

  return id;
};

const slugify = (title: string, id: string) =>
  `${title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/(?<edgeDash>^-|-$)/gu, "")
    .slice(0, 60)}-${id.slice(0, 8)}`;

const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

/** `count` real photos from one seed prefix, uploaded in parallel. */
const makeGalleryPhotos = async (
  seedPrefix: string,
  count: number,
  uploaderId: string
) => {
  const indices = Array.from({ length: count }, (_, index) => index);
  const fileIds = await Promise.all(
    indices.map((index) =>
      uploadSeedImage(`${seedPrefix}-${index}`, 1200, 1200, uploaderId)
    )
  );
  return fileIds.map((fileId, index) => ({
    fileId,
    caption: `Photo ${index + 1}`,
    altText: `${seedPrefix.replaceAll("-", " ")}, photo ${index + 1}`,
  }));
};

const ACHIEVEMENT_ROWS = [
  {
    category: "Academic",
    title: "National Science Olympiad - Gold Medal",
    detail:
      "Grade 11 student Ashen Perera placed first nationally in the Physics category of the 2026 National Science Olympiad.",
    seed: "achievement-science",
  },
  {
    category: "Sports",
    title: "Southern Province Rugby Champions",
    detail:
      "The U19 rugby team won the Southern Province inter-schools championship for the third consecutive year.",
    seed: "achievement-rugby",
  },
  {
    category: "Arts",
    title: "National Choir Festival - Best Choir",
    detail:
      "The college choir was awarded Best Choir at the National Schools' Choir Festival in Colombo.",
    seed: "achievement-choir",
  },
  {
    category: "Debate",
    title: "All-Island Schools Debate - Runners Up",
    detail:
      "The senior debate team reached the final of the All-Island Schools English Debating Championship.",
    seed: "achievement-debate",
  },
] as const;

const ANNOUNCEMENT_ROWS = [
  {
    title: "Admissions for Grade 1 (2027) now open",
    body: "Applications for Grade 1 admission in 2027 are now being accepted through the college office. Closing date is 31 January 2027.",
    audience: "all" as const,
    severity: "urgent" as const,
    isPinned: true,
    seed: "ann-admissions",
  },
  {
    title: "Mid-term examination timetable released",
    body: "The mid-term examination timetable for all grades has been published. Please check the notice board or the Academics section for details.",
    audience: "students" as const,
    severity: "important" as const,
    isPinned: false,
    seed: "ann-exams",
  },
  {
    title: "Parent-teacher meeting - Grade 6 to 9",
    body: "A parent-teacher meeting for Grades 6 to 9 will be held in the main hall this Saturday from 9am.",
    audience: "parents" as const,
    severity: "info" as const,
    isPinned: false,
    seed: "ann-ptm",
  },
  {
    title: "Old Boys' Reunion 2026 - registrations open",
    body: "Registrations for this year's Old Boys' Reunion are now open. Alumni from all batches are warmly invited.",
    audience: "alumni" as const,
    severity: "info" as const,
    isPinned: false,
    seed: "ann-reunion",
  },
] as const;

const EVENT_ROWS = [
  {
    title: "Inter-House Athletics Meet",
    description:
      "The annual inter-house athletics meet, with track and field events for all grades.",
    location: "College Grounds",
    startsAt: daysFromNow(14),
    seed: "event-athletics",
  },
  {
    title: "Science Exhibition 2026",
    description:
      "Student-led science exhibition showcasing projects from Grades 6 to 13.",
    location: "Main Hall",
    startsAt: daysFromNow(28),
    seed: "event-science-fair",
  },
  {
    title: "Inter-School Chess Tournament",
    description:
      "The college hosts the Southern Province inter-school chess tournament.",
    location: "Library Block",
    startsAt: daysFromNow(10),
    seed: "event-chess",
  },
] as const;

const NEWS_ROWS = [
  {
    title: "College wins Southern Province rugby title",
    summary:
      "The U19 rugby team secured the Southern Province championship for the third year running.",
    body: "In a closely fought final, the college's U19 rugby team defeated their long-time rivals 24-18 to claim the Southern Province inter-schools championship.",
    category: "sports" as const,
    seed: "news-rugby",
  },
  {
    title: "Students shine at National Science Olympiad",
    summary:
      "Three students represented the college at the National Science Olympiad, with Ashen Perera taking gold in Physics.",
    body: "The college's science department continues its strong record at national level, with three Grade 11 and 12 students representing the school at this year's Olympiad.",
    category: "academic" as const,
    seed: "news-science",
  },
  {
    title: "New library wing officially opened",
    summary:
      "The newly built library wing was opened by the Chief Guest, adding over 5,000 new titles to the collection.",
    body: "The college's new library wing, funded in part by the Old Boys' Association, was officially declared open this week.",
    category: "general" as const,
    seed: "news-library",
  },
] as const;

const seedAchievements = async (cmsUserId: string) => {
  const ids: Record<string, string> = {};
  await Promise.all(
    ACHIEVEMENT_ROWS.map(async (row) => {
      const id = crypto.randomUUID();
      const imageId = await uploadSeedImage(row.seed, 1200, 800, cmsUserId);
      await db.insert(achievement).values({
        id,
        category: row.category,
        title: row.title,
        detail: row.detail,
        imageId,
        publishedAt: new Date(),
      });
      ids[row.seed] = id;
    })
  );
  return ids;
};

const seedAnnouncements = (cmsUserId: string) =>
  Promise.all(
    ANNOUNCEMENT_ROWS.map(async (row) => {
      const id = crypto.randomUUID();
      const imageId = await uploadSeedImage(row.seed, 1600, 1000, cmsUserId);
      const now = new Date();
      await db.insert(announcement).values({
        id,
        club: null,
        slug: slugify(row.title, id),
        title: row.title,
        body: row.body,
        audience: row.audience,
        severity: row.severity,
        isPinned: row.isPinned,
        imageId,
        authorId: cmsUserId,
        status: "approved",
        reviewedById: cmsUserId,
        reviewedAt: now,
        publishedAt: now,
      });
    })
  );

const seedEvents = async (cmsUserId: string) => {
  const ids: Record<string, string> = {};
  await Promise.all(
    EVENT_ROWS.map(async (row) => {
      const id = crypto.randomUUID();
      const coverImageId = await uploadSeedImage(
        row.seed,
        1600,
        1000,
        cmsUserId
      );
      const now = new Date();
      await db.insert(event).values({
        id,
        club: null,
        slug: slugify(row.title, id),
        title: row.title,
        description: row.description,
        location: row.location,
        startsAt: row.startsAt,
        coverImageId,
        submittedById: cmsUserId,
        status: "approved",
        reviewedById: cmsUserId,
        reviewedAt: now,
        publishedAt: now,
      });
      ids[row.seed] = id;
    })
  );
  return ids;
};

const seedNewsPosts = (cmsUserId: string) =>
  Promise.all(
    NEWS_ROWS.map(async (row) => {
      const id = crypto.randomUUID();
      const coverImageId = await uploadSeedImage(
        row.seed,
        1600,
        1000,
        cmsUserId
      );
      const now = new Date();
      await db.insert(newsPost).values({
        id,
        club: null,
        slug: slugify(row.title, id),
        title: row.title,
        summary: row.summary,
        body: row.body,
        category: row.category,
        coverImageId,
        submittedById: cmsUserId,
        status: "approved",
        reviewedById: cmsUserId,
        reviewedAt: now,
        publishedAt: now,
      });
    })
  );

interface GalleryPlan {
  title: string;
  description: string;
  coverSeed: string;
  photoSeedPrefix: string;
  photoCount: number;
  club: "photography" | null;
  creatorId: string;
  status: "pending" | "approved";
  linkedKind?: "event" | "achievement";
  linkedId?: string | null;
}

const seedGallery = async (plan: GalleryPlan, cmsUserId: string) => {
  const id = crypto.randomUUID();
  const now = new Date();
  const [coverImageId, photos] = await Promise.all([
    uploadSeedImage(plan.coverSeed, 1200, 1200, plan.creatorId),
    makeGalleryPhotos(plan.photoSeedPrefix, plan.photoCount, plan.creatorId),
  ]);

  await db.insert(gallery).values({
    id,
    club: plan.club,
    slug: slugify(plan.title, id),
    title: plan.title,
    description: plan.description,
    coverImageId,
    createdById: plan.creatorId,
    status: plan.status,
    reviewedById: plan.status === "approved" ? cmsUserId : null,
    reviewedAt: plan.status === "approved" ? now : null,
    publishedAt: plan.status === "approved" ? now : null,
    linkedKind: plan.linkedKind ?? null,
    linkedEventId: plan.linkedKind === "event" ? plan.linkedId : null,
    linkedAchievementId:
      plan.linkedKind === "achievement" ? plan.linkedId : null,
  });

  await db.insert(clubPhoto).values(
    photos.map((photo) => ({
      id: crypto.randomUUID(),
      galleryId: id,
      fileId: photo.fileId,
      caption: photo.caption,
      altText: photo.altText,
      submittedById: plan.creatorId,
    }))
  );
};

const seedGalleriesForDemo = async (
  cmsUserId: string,
  clubUserId: string,
  eventIds: Record<string, string>,
  achievementIds: Record<string, string>
) => {
  const plans: GalleryPlan[] = [
    {
      title: "Chess Tournament Highlights",
      description:
        "Moments from the Southern Province inter-school chess tournament.",
      coverSeed: "gallery-chess-cover",
      photoSeedPrefix: "gallery-chess",
      photoCount: 4,
      club: null,
      creatorId: cmsUserId,
      status: "approved",
      linkedKind: "event",
      linkedId: eventIds["event-chess"] ?? null,
    },
    {
      title: "National Choir Festival",
      description:
        "The college choir performing at the National Schools' Choir Festival.",
      coverSeed: "gallery-choir-cover",
      photoSeedPrefix: "gallery-choir",
      photoCount: 5,
      club: null,
      creatorId: cmsUserId,
      status: "approved",
      linkedKind: "achievement",
      linkedId: achievementIds["achievement-choir"] ?? null,
    },
    {
      title: "Inter-House Athletics Meet",
      description: "Photos from the annual inter-house athletics meet.",
      coverSeed: "gallery-athletics-cover",
      photoSeedPrefix: "gallery-athletics",
      photoCount: 5,
      club: "photography",
      creatorId: clubUserId,
      status: "approved",
      linkedKind: "event",
      linkedId: eventIds["event-athletics"] ?? null,
    },
    {
      title: "Science Exhibition 2026",
      description:
        "Candid shots from this year's science exhibition - awaiting review.",
      coverSeed: "gallery-science-fair-cover",
      photoSeedPrefix: "gallery-science-fair",
      photoCount: 3,
      club: "photography",
      creatorId: clubUserId,
      status: "pending",
    },
  ];

  await Promise.all(plans.map((plan) => seedGallery(plan, cmsUserId)));
};

const main = async () => {
  const cmsUserId = await requireUserId("cms");
  const clubUserId = await requireUserId("photography-admin");

  console.log("Clearing existing seeded content...");
  await db.delete(clubPhoto).run();
  await db.delete(gallery).run();
  await db.delete(announcement).run();
  await db.delete(event).run();
  await db.delete(newsPost).run();
  await db.delete(achievement).run();

  console.log("Seeding achievements...");
  const achievementIds = await seedAchievements(cmsUserId);

  console.log("Seeding announcements, events and news posts...");
  const [, eventIds] = await Promise.all([
    seedAnnouncements(cmsUserId),
    seedEvents(cmsUserId),
    seedNewsPosts(cmsUserId),
  ]);

  console.log("Seeding galleries...");
  await seedGalleriesForDemo(cmsUserId, clubUserId, eventIds, achievementIds);

  console.log("Done. Seeded:");
  console.log(`  ${ACHIEVEMENT_ROWS.length} achievements`);
  console.log(`  ${ANNOUNCEMENT_ROWS.length} announcements`);
  console.log(`  ${EVENT_ROWS.length} events`);
  console.log(`  ${NEWS_ROWS.length} news posts`);
  console.log(
    "  4 galleries (2 CMS-direct, 1 club-submitted approved, 1 club-submitted pending)"
  );
};

await main();
process.exit(0);
