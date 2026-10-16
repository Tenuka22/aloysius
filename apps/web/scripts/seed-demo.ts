/**
 * Seeds the dev database with realistic content across every CMS-direct and
 * club-submitted content type, using real photographs (via picsum.photos'
 * seeded endpoint, which serves real stock photography with no API key
 * required - Pexels needs one this environment doesn't have).
 *
 * Destructive, on purpose, and scoped on purpose: it clears every row in
 * `gallery`, `club_photo`, `announcement`, `event`, `news_post`, `achievement`,
 * `results_year` and `content_version` before inserting its own, so re-running
 * it gives a clean, predictable demo state instead of accumulating duplicates.
 * It never touches `user` or `session`, so it never signs anyone out.
 *
 * It covers two kinds of content, because the site's pages are built from two
 * kinds. The tables above are the structured content - posts, events, clubs,
 * galleries. `content_version` is the other kind: the block copy and
 * photographs behind `/`, `/about`, `/academics`, `/students`, `/news`,
 * `/alumni`, `/media`, `/contact` and the global Principal block, which is
 * what each page's editor at `/cms/*` writes. Both are cleared and both are
 * reseeded; a run that only seeded the tables left every page rendering its
 * shipped defaults with its photographs missing, which is most of the site.
 *
 * It does delete the `files` rows **it uploaded itself** - the images behind the
 * content being cleared. Leaving those behind leaked badly: every run uploaded
 * ~35 images, and because the old rows were never removed, re-running twice
 * left 70 files and 35 unreferenced objects in the bucket for the 35 content
 * rows that survived. Only objects this script created are touched, tracked by
 * the `demo/` key prefix, so a photo a person uploaded through the app is never
 * at risk.
 *
 * Run from `apps/web`:
 *   bun run seed:demo
 *
 * Needs the `cms` seat, which `ensureServerBootstrap` creates on server start -
 * so start the dev server once first. The `photography-admin` club seat is
 * created here on demand; see `requireUserId`.
 */

import { setTimeout as sleep } from "node:timers/promises";

import { createClubCredential } from "@aloysius/auth";
import { announcement } from "@aloysius/db/schema/announcements";
import { user } from "@aloysius/db/schema/auth";
import { clubPhoto, gallery } from "@aloysius/db/schema/club-photos";
import { club } from "@aloysius/db/schema/clubs";
import { contentVersion } from "@aloysius/db/schema/cms";
import { files } from "@aloysius/db/schema/files";
import { newsPost } from "@aloysius/db/schema/news-posts";
import {
  resultsAlRanker,
  resultsNineA,
  resultsNineABand,
  resultsScholarship,
  resultsYear,
} from "@aloysius/db/schema/results";
import { achievement, event, person } from "@aloysius/db/schema/root-content";
import { FACILITIES } from "@aloysius/ui/content/academics";
import type { PageBlock } from "@aloysius/ui/content/cms";
import {
  ACADEMICS_BLOCKS,
  ABOUT_BLOCKS,
  ALUMNI_BLOCKS,
  CONTACT_BLOCKS,
  GALLERIES_BLOCKS,
  HOMEPAGE_BLOCKS,
  MEDIA_BLOCKS,
  NEWS_BLOCKS,
  NOTICES_BLOCKS,
  PRINCIPAL_BLOCKS,
  RESULTS_BLOCKS,
  STUDENTS_BLOCKS,
  facilityImageFieldId,
} from "@aloysius/ui/content/cms";
import type { AspectRatioKey } from "@aloysius/ui/tokens/aspect-ratios";
import { aspectRatios } from "@aloysius/ui/tokens/aspect-ratios";
import { eq, like } from "drizzle-orm";

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

/**
 * Every object this script uploads carries this prefix, which is what makes it
 * safe to delete them again on the next run. Real uploads use the `admin/`
 * prefix and are never touched.
 */
const SEED_KEY_PREFIX = "demo/";

/**
 * Where a seeded image lives, given its `files.id`.
 *
 * The single definition of the key format, because two places need it: the
 * upload that writes the object, and the CMS field that points at it. Deriving
 * the URL from the id rather than returning both from `uploadSeedImage` keeps
 * the key in one place; a CMS field whose URL disagreed with the object it
 * named would render as a broken image with no error anywhere.
 */
const seedImageKey = (fileId: string): string =>
  `${SEED_KEY_PREFIX}${fileId}.jpg`;

/** The url `/api/files` serves a seeded image at, as a CMS field stores it. */
const seedImageUrl = (fileId: string): string =>
  `/api/files/${seedImageKey(fileId)}`;

/**
 * How hard to try before giving up on one photograph, and how long to wait
 * between attempts.
 *
 * This script clears the database before it seeds it, so a run that dies
 * half-way leaves a demo that is missing most of its content. picsum.photos
 * rate-limits bursts - this run asks for around sixty images, most of them
 * concurrently - and a single 429 used to abort the whole seed at whatever
 * point it had reached. Retrying turns the one common, entirely transient
 * failure into a slightly slower run; only a genuinely unreachable host still
 * stops it, which is the failure worth hearing about.
 */
const SEED_IMAGE_ATTEMPTS = 4;
const SEED_IMAGE_RETRY_MS = 750;

/** One photograph from picsum, retried while the response is not a success. */
const fetchSeedImage = async (
  seedName: string,
  width: number,
  height: number,
  attempt = 1
): Promise<Buffer> => {
  const response = await fetch(
    `https://picsum.photos/seed/${encodeURIComponent(seedName)}/${width}/${height}`
  );

  if (response.ok) {
    return Buffer.from(await response.arrayBuffer());
  }

  if (attempt >= SEED_IMAGE_ATTEMPTS) {
    throw new Error(
      `Could not fetch seed image "${seedName}": ${response.status} after ${attempt} attempts`
    );
  }

  await sleep(SEED_IMAGE_RETRY_MS * attempt);
  return fetchSeedImage(seedName, width, height, attempt + 1);
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
  const buffer = await fetchSeedImage(seedName, width, height);
  const id = crypto.randomUUID();
  const key = seedImageKey(id);

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

/**
 * Delete the images previous runs of this script uploaded, both the `files` rows
 * and the objects behind them.
 *
 * Scoped to `SEED_KEY_PREFIX` on purpose. A blanket "delete all files" would
 * destroy anything a person uploaded through the app, and a row-only delete
 * would leave the objects in the bucket - which is the leak this replaces.
 *
 * `storage.remove` failures are tolerated on purpose: the content rows are
 * going regardless, and a bucket that is unreachable must not stop the reseed.
 */
const deletePreviouslySeededImages = async () => {
  const orphans = await db
    .select({ id: files.id, key: files.key })
    .from(files)
    .where(like(files.key, `${SEED_KEY_PREFIX}%`))
    .all();

  // Independent per object, so they run concurrently rather than one at a time.
  // Failures are tolerated per object: the content rows go regardless, and an
  // unreachable bucket must not stop the reseed.
  await Promise.all(
    orphans.map((orphan) =>
      storage.remove(orphan.key).catch(() => {
        // Object already gone, or the bucket is down. The row still goes.
      })
    )
  );

  await db
    .delete(files)
    .where(like(files.key, `${SEED_KEY_PREFIX}%`))
    .run();
  return orphans.length;
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

/** `hours` past a given moment - an event's end, not its start. */
const hoursAfter = (from: Date, hours: number): Date =>
  new Date(from.getTime() + hours * 60 * 60 * 1000);

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

/**
 * The clubs the college runs.
 *
 * Seeded rather than derived from a constant because the club list is data now
 * - a CMS editor adds one through `/cms/clubs`. `photography` must exist because
 * the `photography-admin` seat is bound to that slug, so it is seeded even
 * though nothing in this file attributes content to it.
 *
 * Declared above the content rows because those rows name clubs by slug: a
 * `const` used before its declaration is a temporal-dead-zone crash at import,
 * and this file runs top to bottom on every seed.
 */
const CLUB_ROWS = [
  {
    slug: "photography",
    name: "Photography Club",
    role: "media" as const,
    description:
      "Runs the college's newsroom and curates the photographs published in the gallery.",
  },
  {
    slug: "debating",
    name: "Debating Society",
    role: "society" as const,
    description:
      "Prepares teams for inter-school and Southern Province debate.",
  },
  {
    slug: "science",
    name: "Science Society",
    role: "society" as const,
    description:
      "Supports the science exhibition and the teams that enter the Olympiad.",
  },
  {
    slug: "media",
    name: "Media Unit",
    role: "media" as const,
    description: "Records assemblies and publishes the school's video archive.",
  },
  {
    slug: "interact",
    name: "Interact Club",
    role: "society" as const,
    description:
      "Runs the college's service projects with the wider community.",
  },
  {
    slug: "scouts",
    name: "Scouts",
    role: "society" as const,
    description: "Trains weekly and maintains the college's outdoor programme.",
  },
  {
    slug: "cadets",
    name: "Cadets",
    role: "cadet_corps" as const,
    description: "Drills and parade training for the senior school.",
  },
  {
    slug: "choir",
    name: "Choir & Eastern Band",
    role: "band" as const,
    description:
      "Rehearses weekly for the school assemblies and the annual concerts.",
  },
  {
    slug: "environment",
    name: "Environmental Society",
    role: "society" as const,
    description:
      "Leads the college's sustainability work and its beach clean-ups.",
  },
] as const;

const seedClubs = async () => {
  await Promise.all(
    CLUB_ROWS.map((row) =>
      // Upsert by slug: a re-run updates the seeded club's name and role
      // rather than failing on the unique index.
      db
        .insert(club)
        .values({
          id: crypto.randomUUID(),
          slug: row.slug,
          name: row.name,
          role: row.role,
          description: row.description,
          publishedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: club.slug,
          set: {
            name: row.name,
            role: row.role,
            description: row.description,
            publishedAt: new Date(),
          },
        })
        .run()
    )
  );
  return CLUB_ROWS.length;
};

/**
 * Fail loudly when a content row names a club that was never seeded.
 *
 * The `club in (...)` CHECK constraint is gone now that the club list is data,
 * so a typo here would produce a row that joins to nothing: invisible on the
 * public page, unattributable in the CMS, and no error anywhere. Same reasoning
 * as `linkedId` below - this seeder's job is to be predictable.
 */
const requireClubSlug = async (slug: string | null, owner: string) => {
  if (slug === null) {
    return;
  }
  const exists = await db
    .select({ id: club.id })
    .from(club)
    .where(eq(club.slug, slug))
    .limit(1)
    .get();
  if (!exists) {
    throw new Error(
      `${owner} is attributed to club "${slug}", which was not seeded.`
    );
  }
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
    club: null,
    seed: "ann-admissions",
  },
  {
    title: "Mid-term examination timetable released",
    body: "The mid-term examination timetable for all grades has been published. Please check the notice board or the Academics section for details.",
    audience: "students" as const,
    severity: "important" as const,
    isPinned: false,
    club: null,
    seed: "ann-exams",
  },
  {
    title: "Parent-teacher meeting - Grade 6 to 9",
    body: "A parent-teacher meeting for Grades 6 to 9 will be held in the main hall this Saturday from 9am.",
    audience: "parents" as const,
    severity: "info" as const,
    isPinned: false,
    club: null,
    seed: "ann-ptm",
  },
  {
    title: "Old Boys' Reunion 2026 - registrations open",
    body: "Registrations for this year's Old Boys' Reunion are now open. Alumni from all batches are warmly invited.",
    audience: "alumni" as const,
    severity: "info" as const,
    isPinned: false,
    club: null,
    seed: "ann-reunion",
  },
  {
    title: "Interact Club: coastal clean-up volunteers wanted",
    body: "The Interact Club is running a coastal clean-up on Saturday morning. Volunteers should meet at the college gate by 7:30am.",
    audience: "students" as const,
    severity: "info" as const,
    isPinned: false,
    club: "interact" as const,
    seed: "ann-interact",
  },
  {
    title: "Scouts: badge assessment weekend",
    body: "Badge assessment takes place across the weekend at the college grounds. Scouts should arrive in full uniform on Saturday morning.",
    audience: "students" as const,
    severity: "info" as const,
    isPinned: false,
    club: "scouts" as const,
    seed: "ann-scouts",
  },
] as const;

const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

/**
 * Events that have already run.
 *
 * The `/events` page splits on the server's "now", so without these the "Recently"
 * band renders nothing and the page is a to-do list rather than a diary - a
 * returning visitor has nothing to find. `linkedKind` on the gallery plans is
 * what makes a past event's photographs actually appear beside it.
 */
const PAST_EVENT_ROWS = [
  {
    title: "Old Boys' Cricket Match",
    description:
      "The annual fixture against the Old Boys' XI, played over two days on the college ground.",
    location: "College Grounds",
    startsAt: daysAgo(21),
    endsInHours: 6,
    club: "photography" as const,
    seed: "event-past-cricket",
  },
  {
    title: "Inter-School Debating Finals",
    description:
      "The senior debate team hosted the Southern Province final against three visiting schools.",
    location: "Assembly Hall",
    startsAt: daysAgo(35),
    endsInHours: 4,
    club: "debating" as const,
    seed: "event-past-debate",
  },
  {
    title: "National Schools' Choir Festival",
    description:
      "The choir and Eastern Band travelled to Colombo for the National Schools' Choir Festival.",
    location: "Colombo",
    startsAt: daysAgo(48),
    endsInHours: 9,
    club: "choir" as const,
    seed: "event-past-choir",
  },
] as const;

const EVENT_ROWS = [
  {
    title: "Inter-House Athletics Meet",
    description:
      "The annual inter-house athletics meet, with track and field events for all grades.",
    location: "College Grounds",
    startsAt: daysFromNow(14),
    endsInHours: 6,
    club: "cadets" as const,
    seed: "event-athletics",
  },
  {
    title: "Science Exhibition 2026",
    description:
      "Student-led science exhibition showcasing projects from Grades 6 to 13.",
    location: "Main Hall",
    startsAt: daysFromNow(28),
    endsInHours: 8,
    club: "science" as const,
    seed: "event-science-fair",
  },
  {
    title: "Inter-School Chess Tournament",
    description:
      "The college hosts the Southern Province inter-school chess tournament.",
    location: "Library Block",
    startsAt: daysFromNow(10),
    endsInHours: 5,
    club: "debating" as const,
    seed: "event-chess",
  },
  {
    title: "Choir & Eastern Band Autumn Concert",
    description:
      "The choir and Eastern Band perform a programme of sacred and folk repertoire in the main hall.",
    location: "Main Hall",
    startsAt: daysFromNow(40),
    endsInHours: 3,
    club: "choir" as const,
    seed: "event-choir-concert",
  },
  {
    title: "Coastal Clean-up",
    description:
      "The Environmental Society's quarterly beach clean-up. Meet at the college gate; gloves and bags provided.",
    location: "Kahandama Beach",
    startsAt: daysFromNow(21),
    endsInHours: 4,
    club: "environment" as const,
    seed: "event-cleanup",
  },
  {
    title: "Cadet Annual Parade",
    description:
      "The annual cadet parade in full uniform, reviewed by the Chief Guest.",
    location: "College Grounds",
    startsAt: daysFromNow(60),
    endsInHours: 2,
    club: "cadets" as const,
    seed: "event-cadet-parade",
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
      await requireClubSlug(row.club, `Announcement "${row.title}"`);

      const id = crypto.randomUUID();
      const imageId = await uploadSeedImage(row.seed, 1600, 1000, cmsUserId);
      const now = new Date();
      await db.insert(announcement).values({
        id,
        club: row.club,
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

/**
 * Both lists in one pass.
 *
 * The public events page splits on the server's "now", so the past and future
 * rows are seeded together here rather than by two seeders that could drift
 * apart. Each row already carries its own `startsAt`, so the split happens
 * where it happens for a reader.
 */
const seedEvents = async (cmsUserId: string) => {
  const ids: Record<string, string> = {};
  const rows = [...PAST_EVENT_ROWS, ...EVENT_ROWS];
  await Promise.all(
    rows.map(async (row) => {
      await requireClubSlug(row.club, `Event "${row.title}"`);

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
        club: row.club,
        slug: slugify(row.title, id),
        title: row.title,
        description: row.description,
        location: row.location,
        startsAt: row.startsAt,
        endsAt: hoursAfter(row.startsAt, row.endsInHours),
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
  club: string | null;
  creatorId: string;
  status: "pending" | "approved";
  linkedKind?: "event" | "achievement";
  linkedId?: string | null;
}

const seedGallery = async (plan: GalleryPlan, cmsUserId: string) => {
  await requireClubSlug(plan.club, `Gallery "${plan.title}"`);

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

/**
 * Resolve a seed key to its row id, or fail loudly.
 *
 * The gallery plans below reference events and achievements by their seed key.
 * A missed lookup used to fall back to `null`, which produced a gallery whose
 * `linkedKind` said "event" while `linkedEventId` was null - a link to nothing,
 * with no error anywhere. The seeder's whole job is to be predictable, so a
 * missing reference should stop it rather than quietly ship a broken row.
 */
const linkedId = (
  ids: Record<string, string>,
  key: string,
  kind: string
): string => {
  const id = ids[key];
  if (!id) {
    throw new Error(
      `No seeded ${kind} with key "${key}" - it was not created, so the gallery linking to it would dangle.`
    );
  }
  return id;
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
      linkedId: linkedId(eventIds, "event-chess", "event"),
    },
    {
      title: "National Choir Festival",
      description:
        "The college choir performing at the National Schools' Choir Festival.",
      coverSeed: "gallery-choir-cover",
      photoSeedPrefix: "gallery-choir",
      photoCount: 5,
      club: "choir",
      creatorId: cmsUserId,
      status: "approved",
      linkedKind: "achievement",
      linkedId: linkedId(achievementIds, "achievement-choir", "achievement"),
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
      linkedId: linkedId(eventIds, "event-athletics", "event"),
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
    {
      title: "Old Boys' Cricket Match",
      description: "Day two of the annual fixture against the Old Boys' XI.",
      coverSeed: "gallery-past-cricket-cover",
      photoSeedPrefix: "gallery-past-cricket",
      photoCount: 4,
      club: "photography",
      creatorId: clubUserId,
      status: "approved",
      linkedKind: "event",
      linkedId: linkedId(eventIds, "event-past-cricket", "event"),
    },
    {
      title: "Debating Finals",
      description: "The senior team in the Southern Province final.",
      coverSeed: "gallery-past-debate-cover",
      photoSeedPrefix: "gallery-past-debate",
      photoCount: 3,
      club: null,
      creatorId: cmsUserId,
      status: "approved",
      linkedKind: "event",
      linkedId: linkedId(eventIds, "event-past-debate", "event"),
    },
  ];

  await Promise.all(plans.map((plan) => seedGallery(plan, cmsUserId)));
  return plans.length;
};

/* ------------------------------------------------------- CMS page content */

/**
 * One image field the CMS registry leaves empty for a human to fill, and the
 * stock photograph that stands in for it in a demo.
 */
interface SeedImage {
  /** The field id, exactly as the page's registry declares it. */
  fieldId: string;
  /** picsum seed - the same seed always returns the same photograph. */
  seed: string;
  /** The crop this field is composed for, from `tokens/aspect-ratios`. */
  ratio: AspectRatioKey;
}

/**
 * One page's worth of CMS block content.
 *
 * The block and field list is not written out here: it is read from the page's
 * own registry in `@aloysius/ui/content/cms`, which is the same list the CMS
 * editor builds its form from. Copying those ids into this file would make a
 * second source of truth, and a field renamed in one and not the other would
 * seed a row the editor cannot show and the page cannot read.
 */
interface SeedPage {
  /** The `content_version.page` key. */
  page: string;
  registry: readonly PageBlock[];
  images: readonly SeedImage[];
  /**
   * Values for the fields the registry ships empty, keyed by field id.
   *
   * Empty is a deliberate control in the registries: the office hours, the
   * social links, the house names and the map url are blank because the
   * college has not published them, and every mapper falls back to a default
   * (or to nothing) when a field is blank. Those are left blank here for the
   * same reason. The leadership names are the exception - see `SEED_PAGES`.
   */
  fill: Record<string, string>;
}

/**
 * Every CMS page, in the order the site's own navigation lists them.
 *
 * `notices` has no public route of its own - the homepage notice strip reads
 * the `announcement` table instead - but it is a real CMS page with a real
 * editor at `/cms/notices`, so it is seeded like the rest.
 */
const SEED_PAGES: readonly SeedPage[] = [
  {
    page: "homepage",
    registry: HOMEPAGE_BLOCKS,
    images: [
      { fieldId: "hero-bg", seed: "page-home-hero", ratio: "hero" },
      {
        fieldId: "heritage-image-1",
        seed: "page-home-heritage-1",
        ratio: "heritagePhoto",
      },
      {
        fieldId: "heritage-image-2",
        seed: "page-home-heritage-2",
        ratio: "heritageDetail",
      },
      {
        fieldId: "life-sports",
        seed: "page-home-life-sports",
        ratio: "mosaicTile",
      },
      {
        fieldId: "life-music",
        seed: "page-home-life-music",
        ratio: "mosaicTile",
      },
      {
        fieldId: "alumni-image",
        seed: "page-home-alumni",
        ratio: "alumniPhoto",
      },
    ],
    fill: {},
  },
  {
    page: "principal",
    registry: PRINCIPAL_BLOCKS,
    images: [
      {
        fieldId: "principal-portrait",
        seed: "page-principal-portrait",
        ratio: "principalPortrait",
      },
    ],
    fill: {
      /*
       * The registry ships this empty on purpose - naming the office is better
       * than naming a person the college has not confirmed. A demo is the one
       * case where a blank is not the point: `/academics` builds its whole
       * leadership row from this block plus the two section roles, and three
       * cards with a title and no name read as a bug rather than as restraint.
       */
      "principal-name": "Fr. Marcus Perera",
    },
  },
  {
    page: "academics",
    registry: ACADEMICS_BLOCKS,
    images: [
      {
        fieldId: "academics-hero-image",
        seed: "page-academics-hero",
        ratio: "hero",
      },
      /*
       * One photograph per facility, generated from the same registry the CMS
       * editor renders its upload controls from. Listed here rather than
       * written out so a facility added to `content/academics.ts` is picked up
       * automatically - `requireEveryImageSeeded` below fails the run if it is
       * not.
       */
      ...FACILITIES.map((facility) => ({
        fieldId: facilityImageFieldId(facility.id),
        seed: `page-facility-${facility.id}`,
        ratio: "heritagePhoto" as const,
      })),
    ],
    fill: {},
  },
  {
    page: "about",
    registry: ABOUT_BLOCKS,
    images: [
      {
        fieldId: "about-hero-image",
        seed: "page-about-hero",
        ratio: "hero",
      },
      {
        fieldId: "history-1-image",
        seed: "page-about-history-1895",
        ratio: "heritagePhoto",
      },
      {
        fieldId: "history-2-image",
        seed: "page-about-history-1920s",
        ratio: "heritagePhoto",
      },
      {
        fieldId: "history-3-image",
        seed: "page-about-history-1971",
        ratio: "heritagePhoto",
      },
      {
        fieldId: "history-4-image",
        seed: "page-about-history-today",
        ratio: "heritagePhoto",
      },
      {
        fieldId: "anthem-image",
        seed: "page-about-anthem",
        ratio: "alumniPhoto",
      },
      {
        fieldId: "anthem-sinhala-image",
        seed: "page-about-anthem-sinhala",
        ratio: "alumniPhoto",
      },
    ],
    fill: {},
  },
  {
    page: "news",
    registry: NEWS_BLOCKS,
    images: [
      { fieldId: "news-hero-image", seed: "page-news-hero", ratio: "hero" },
    ],
    fill: {},
  },
  {
    page: "notices",
    registry: NOTICES_BLOCKS,
    images: [
      {
        fieldId: "notices-hero-image",
        seed: "page-notices-hero",
        ratio: "hero",
      },
    ],
    fill: {},
  },
  {
    /*
     * No images: the contact page's editable fields are all text, and the ones
     * the college has not published are left blank rather than invented.
     */
    page: "contact",
    registry: CONTACT_BLOCKS,
    images: [],
    fill: {},
  },
  {
    /*
     * The masthead only. `/results`'s figures are `resultsYear` rows, seeded
     * below - they are data, not blocks, and the page reads them through
     * `cms.listResults`.
     */
    page: "results",
    registry: RESULTS_BLOCKS,
    images: [],
    fill: {},
  },
  {
    /*
     * The masthead above the photograph grid. The galleries themselves are
     * `gallery` rows, seeded by `seedGalleriesForDemo`.
     */
    page: "galleries",
    registry: GALLERIES_BLOCKS,
    images: [
      {
        fieldId: "galleries-hero-image",
        seed: "page-galleries-hero",
        ratio: "hero",
      },
    ],
    fill: {},
  },
  {
    page: "alumni",
    registry: ALUMNI_BLOCKS,
    images: [
      { fieldId: "alumni-hero-image", seed: "page-alumni-hero", ratio: "hero" },
      {
        fieldId: "alumni-image",
        seed: "page-alumni-about",
        ratio: "alumniPhoto",
      },
    ],
    fill: {},
  },
  {
    page: "media",
    registry: MEDIA_BLOCKS,
    images: [
      { fieldId: "media-hero-image", seed: "page-media-hero", ratio: "hero" },
    ],
    fill: {},
  },
  {
    page: "students",
    registry: STUDENTS_BLOCKS,
    images: [
      {
        fieldId: "students-hero-image",
        seed: "page-students-hero",
        ratio: "hero",
      },
      {
        fieldId: "students-sports-cricket",
        seed: "page-students-cricket",
        ratio: "mosaicTile",
      },
      {
        fieldId: "students-sports-rugby",
        seed: "page-students-rugby",
        ratio: "mosaicTile",
      },
      {
        fieldId: "students-sports-athletics",
        seed: "page-students-athletics",
        ratio: "mosaicTile",
      },
      {
        fieldId: "students-prefects-image",
        seed: "page-students-prefects",
        ratio: "mosaicTile",
      },
    ],
    fill: {},
  },
];

/** Width every seeded page image is uploaded at; the height follows its ratio. */
const SEED_IMAGE_WIDTH = 1200;

const seedImageSize = (ratio: AspectRatioKey) => ({
  width: SEED_IMAGE_WIDTH,
  height: Math.round(SEED_IMAGE_WIDTH / aspectRatios[ratio]),
});

/** The three columns that together identify one field of one block of a page. */
const fieldKey = (page: string, blockId: string, fieldId: string): string =>
  `${page}/${blockId}/${fieldId}`;

/**
 * The block that owns a field id, or a loud failure.
 *
 * A typo in a `SeedImage.fieldId` would otherwise be invisible: the upload
 * would run, the url would be filed under a key no block ever reads, and the
 * page would render exactly as it does today - which is the symptom this
 * function exists to remove.
 */
const requireBlockId = (spec: SeedPage, fieldId: string): string => {
  const block = spec.registry.find((candidate) =>
    candidate.fields.some((field) => field.id === fieldId)
  );
  if (!block) {
    throw new Error(
      `Page "${spec.page}" seeds image field "${fieldId}", which is not in its registry.`
    );
  }
  return block.id;
};

/**
 * Upload one page image and report the url its CMS field should hold.
 *
 * Returns the pair rather than setting it, so every image on every page can be
 * in flight at once and the map is filled in one pass afterwards.
 */
const uploadPageImage = async (
  spec: SeedPage,
  image: SeedImage,
  authorId: string
): Promise<[string, string]> => {
  const blockId = requireBlockId(spec, image.fieldId);
  const { width, height } = seedImageSize(image.ratio);
  const fileId = await uploadSeedImage(image.seed, width, height, authorId);
  return [fieldKey(spec.page, blockId, image.fieldId), seedImageUrl(fileId)];
};

/**
 * Every image field in a page's registry must have a photograph behind it.
 *
 * An image field with no value is the one kind of blank a page cannot fall
 * back from: the mapper returns `undefined`, and the component renders the
 * field's alt text where the picture should be. That is how an unseeded
 * homepage ends up reading "Archival photograph - early college years" as a
 * line of body copy. So an image field nobody supplied a photo for is a broken
 * seed, and it should stop the run rather than ship.
 */
const requireEveryImageSeeded = (spec: SeedPage) => {
  const seeded = new Set(spec.images.map((image) => image.fieldId));
  for (const block of spec.registry) {
    for (const field of block.fields) {
      if (field.kind === "image" && !seeded.has(field.id)) {
        throw new Error(
          `Page "${spec.page}" block "${block.id}" has image field "${field.id}" with no seeded photograph.`
        );
      }
    }
  }
};

/**
 * Publish every CMS page's blocks.
 *
 * This writes `content_version` rows directly rather than going through the
 * oRPC editors, for the same reason the rest of this file writes rows
 * directly: the editors need a live session and a series of draft-then-publish
 * round trips, and a seed that has to drive a browser to be complete is a seed
 * that silently stops covering things.
 *
 * The rows are shaped exactly as `publishDraftBlocks` writes them - one row per
 * block, `action: "publish"`, `published: true`, all of a page's rows sharing
 * one `batchId` - so the CMS history view shows this as a single press of
 * Publish per page, and `fetchPublishedBlocks` reads it with no special case.
 */
const seedPageContent = async (authorId: string) => {
  for (const spec of SEED_PAGES) {
    requireEveryImageSeeded(spec);
  }

  /*
   * Every image first, because each block's snapshot needs its urls and the
   * uploads are the slow part. Keyed by page, block and field, so two pages
   * that both have an `alumni-image` field do not collide.
   */
  const urls = new Map<string, string>();

  const uploads = SEED_PAGES.flatMap((spec) =>
    spec.images.map((image) => uploadPageImage(spec, image, authorId))
  );

  for (const [key, url] of await Promise.all(uploads)) {
    urls.set(key, url);
  }

  const rows = SEED_PAGES.flatMap((spec) => {
    // One batch per page, the way one press of Publish writes one.
    const batchId = crypto.randomUUID();

    return spec.registry.map((block) => ({
      id: crypto.randomUUID(),
      page: spec.page,
      blockId: block.id,
      action: "publish" as const,
      published: true,
      batchId,
      authorId,
      snapshot: JSON.stringify({
        id: block.id,
        hidden: false,
        fields: block.fields.map((field) => {
          const image = spec.images.find(
            (candidate) => candidate.fieldId === field.id
          );
          const uploaded = urls.get(fieldKey(spec.page, block.id, field.id));
          const value = uploaded ?? spec.fill[field.id] ?? field.value ?? "";
          return {
            id: field.id,
            value,
            // The editor records the crop a field is composed for; the reader
            // honours it, so an image seeded without one is laid out uncropped.
            ...(image ? { aspectRatio: aspectRatios[image.ratio] } : {}),
          };
        }),
      }),
    }));
  });

  await db.insert(contentVersion).values(rows).run();

  return { pages: SEED_PAGES.length, blocks: rows.length, images: urls.size };
};

/* --------------------------------------------------------- results years */

/**
 * Two published examination years.
 *
 * `/results` used to read `RESULTS_BY_YEAR`, an empty object, while the page
 * hardcoded four year tabs - so it offered a visitor four years and then
 * reported that none of them had happened. The figures are database content now
 * (`resultsYear` and its children), and the tabs come from the years that
 * exist, so the demo needs real rows for that page to show anything.
 *
 * Two years rather than one because the page's year selector is the feature
 * being demonstrated; a single year would render correctly and prove nothing.
 */
const RESULTS_YEARS = [
  {
    year: "2025",
    summary: {
      alUniversityEntrants: "118",
      alThreeA: "41",
      olNineA: "86",
      scholarshipPassers: "9",
    },
    nineATotal: "86",
    scholarshipCutOff: "472",
    scholarshipHighest: "499",
    rankers: [
      {
        stream: "physical-science" as const,
        name: "Dilhara Jayasuriya",
        result: "4 A's",
        zScore: "2.9814",
        districtRank: "1",
        islandRank: "4",
      },
      {
        stream: "physical-science" as const,
        name: "Sanduni Wickramasinghe",
        result: "3 A's",
        zScore: "2.7102",
        districtRank: "3",
        islandRank: "17",
      },
      {
        stream: "biological-science" as const,
        name: "Thisuni Rajapaksa",
        result: "4 A's",
        zScore: "2.9107",
        districtRank: "2",
        islandRank: "9",
      },
      {
        stream: "biological-science" as const,
        name: "Amaya Gunasekara",
        result: "3 A's",
        zScore: "2.6640",
        districtRank: "6",
        islandRank: "28",
      },
      {
        stream: "commerce" as const,
        name: "Kavindri Silva",
        result: "3 A's",
        zScore: "2.4018",
        districtRank: "9",
        islandRank: "51",
      },
      {
        stream: "commerce" as const,
        name: "Ruwan Fernando",
        result: "2 A's + 1 B",
        zScore: "2.2214",
        districtRank: "14",
        islandRank: "88",
      },
      {
        stream: "arts" as const,
        name: "Nadeesha Herath",
        result: "3 A's",
        zScore: "2.5503",
        districtRank: "7",
        islandRank: "33",
      },
      {
        stream: "engineering-technology" as const,
        name: "Chamara Rathnayake",
        result: "3 A's",
        zScore: "2.4871",
        districtRank: "11",
        islandRank: "64",
      },
    ],
    nineA: [
      { name: "Methsarani Alwis" },
      { name: "Dinuka Bandara" },
      { name: "Hasini Weerasinghe" },
      { name: "Sanjaya Mapa" },
      { name: "Ishara Dias" },
      { name: "Kasun Bandara" },
    ],
    bands: [
      { band: "9A", count: "86" },
      { band: "8A", count: "124" },
      { band: "7A", count: "149" },
      { band: "6A", count: "167" },
    ],
    scholarship: [
      { name: "Ayesha Dias", marks: "499", className: "5-A" },
      { name: "Malith Perera", marks: "497", className: "5-A" },
      { name: "Shenali Gunaratne", marks: "494", className: "5-A" },
      { name: "Bhuvanek Peris", marks: "488", className: "5-B" },
      { name: "Nimasha Jayawardena", marks: "481", className: "5-B" },
      { name: "Tharindu Ekanayake", marks: "476", className: "5-B" },
    ],
  },
  {
    year: "2024",
    summary: {
      alUniversityEntrants: "104",
      alThreeA: "36",
      olNineA: "79",
      scholarshipPassers: "7",
    },
    nineATotal: "79",
    scholarshipCutOff: "466",
    scholarshipHighest: "497",
    rankers: [
      {
        stream: "physical-science" as const,
        name: "Prasad Jayawardena",
        result: "4 A's",
        zScore: "2.9301",
        districtRank: "2",
        islandRank: "11",
      },
      {
        stream: "physical-science" as const,
        name: "Ishara Liyanage",
        result: "3 A's",
        zScore: "2.6880",
        districtRank: "5",
        islandRank: "24",
      },
      {
        stream: "biological-science" as const,
        name: "Kasun Hewage",
        result: "3 A's",
        zScore: "2.6311",
        districtRank: "8",
        islandRank: "30",
      },
      {
        stream: "commerce" as const,
        name: "Nadeesha Kumari",
        result: "3 A's",
        zScore: "2.3802",
        districtRank: "12",
        islandRank: "70",
      },
      {
        stream: "arts" as const,
        name: "Roshan Peiris",
        result: "2 A's + 1 B",
        zScore: "2.1903",
        districtRank: "18",
        islandRank: "104",
      },
    ],
    nineA: [
      { name: "Shalika Gunawardena" },
      { name: "Thilina Madush" },
      { name: "Ayesha Kaluwara" },
      { name: "Roshan De Silva" },
    ],
    bands: [
      { band: "9A", count: "79" },
      { band: "8A", count: "118" },
      { band: "7A", count: "142" },
      { band: "6A", count: "161" },
    ],
    scholarship: [
      { name: "Sanjaya Rathnayake", marks: "497", className: "5-A" },
      { name: "Menaka Siriwardena", marks: "489", className: "5-B" },
      { name: "Dilantha Cooray", marks: "470", className: "5-B" },
      { name: "Surangi Bandara", marks: "466", className: "5-B" },
    ],
  },
] as const;

/**
 * Portraits for the named students on `/results`.
 *
 * Without one, the A/L ranker card, the 9A grid and the scholarship podium all
 * render their placeholder - an empty bordered box, or a grey circle - which
 * is what a page of twenty real names and zero faces looks like. So they are
 * seeded like every other photograph in this script: real pictures from
 * picsum, stored through the same layer the CMS uploader writes to, which is
 * what makes them show up in the editors as replaceable images.
 *
 * The people are invented demo names and the faces are stock photographs. They
 * do not depict anyone named here.
 */
const PORTRAIT_SIZE = { width: 800, height: 1000 } as const;

const uploadPortraits = async (
  entries: readonly { key: string; seed: string }[],
  uploaderId: string
) => {
  const fileIds = await Promise.all(
    entries.map((entry) =>
      uploadSeedImage(
        entry.seed,
        PORTRAIT_SIZE.width,
        PORTRAIT_SIZE.height,
        uploaderId
      )
    )
  );
  return new Map(
    entries.map((entry, index) => [entry.key, fileIds[index] ?? null])
  );
};

/**
 * Write one examination year and everything under it.
 *
 * The children's positions are derived from their order in the arrays above,
 * because position is what the page renders as podium-versus-list and as the
 * order within a tab - storing them any other way would mean the two could
 * disagree.
 */
const seedResults = async (authorId: string) => {
  await Promise.all(
    RESULTS_YEARS.map(async (entry) => {
      const yearId = crypto.randomUUID();
      await db
        .insert(resultsYear)
        .values({
          id: yearId,
          year: entry.year,
          alUniversityEntrants: entry.summary.alUniversityEntrants,
          alThreeA: entry.summary.alThreeA,
          olNineA: entry.summary.olNineA,
          scholarshipPassers: entry.summary.scholarshipPassers,
          nineATotal: entry.nineATotal,
          scholarshipCutOff: entry.scholarshipCutOff,
          scholarshipHighest: entry.scholarshipHighest,
          createdById: authorId,
        })
        .run();

      // One portrait per named person, uploaded before any row needs it. The
      // index is the identity here: the name changes are content edits, but a
      // picture changing because someone fixed a typo would be its own bug.
      const portraits = await uploadPortraits(
        [
          ...entry.rankers.map((_, index) => ({
            key: `ranker-${index}`,
            seed: `results-${entry.year}-ranker-${index}`,
          })),
          ...entry.nineA.map((_, index) => ({
            key: `nine-a-${index}`,
            seed: `results-${entry.year}-nine-a-${index}`,
          })),
          ...entry.scholarship.map((_, index) => ({
            key: `scholarship-${index}`,
            seed: `results-${entry.year}-scholarship-${index}`,
          })),
        ],
        authorId
      );

      // Grouped so each stream's rows are numbered 1..n within that stream.
      const perStream = new Map<string, number>();
      await Promise.all(
        entry.rankers.map((ranker, index) => {
          const position = (perStream.get(ranker.stream) ?? 0) + 1;
          perStream.set(ranker.stream, position);
          return db
            .insert(resultsAlRanker)
            .values({
              id: crypto.randomUUID(),
              yearId,
              stream: ranker.stream,
              name: ranker.name,
              result: ranker.result,
              zScore: ranker.zScore,
              districtRank: ranker.districtRank,
              islandRank: ranker.islandRank,
              imageId: portraits.get(`ranker-${index}`),
              position,
            })
            .run();
        })
      );

      await Promise.all([
        ...entry.nineA.map((student, index) =>
          db
            .insert(resultsNineA)
            .values({
              id: crypto.randomUUID(),
              yearId,
              name: student.name,
              imageId: portraits.get(`nine-a-${index}`),
              position: index + 1,
            })
            .run()
        ),
        ...entry.bands.map((band, index) =>
          db
            .insert(resultsNineABand)
            .values({
              id: crypto.randomUUID(),
              yearId,
              band: band.band,
              count: band.count,
              position: index + 1,
            })
            .run()
        ),
        ...entry.scholarship.map((passer, index) =>
          db
            .insert(resultsScholarship)
            .values({
              id: crypto.randomUUID(),
              yearId,
              name: passer.name,
              marks: passer.marks,
              className: passer.className,
              imageId: portraits.get(`scholarship-${index}`),
              position: index + 1,
            })
            .run()
        ),
      ]);
    })
  );

  return RESULTS_YEARS.length;
};

/* -------------------------------------------------------- academic heads */

/**
 * Who leads each part of the College, shown under the Principal's message on
 * `/about`.
 *
 * These were three fixed fields on the Academics page until they became a CMS
 * roster (`person` rows, `/cms/academic-heads`). The Principal is deliberately
 * absent: their message and portrait are the global `PRINCIPAL_BLOCKS` block,
 * shown on every page, and listing them here too is how the same person ends
 * up with two photographs.
 *
 * Demo names and stock portraits, as everywhere else in this file.
 */
const ACADEMIC_HEADS = [
  {
    slug: "head-of-mathematics",
    name: "Dr. Anoma Bandara",
    role: "Head of Mathematics",
    bio: "Oversees the Grade 6-13 mathematics programme and the Olympiad team.",
  },
  {
    slug: "head-of-science",
    name: "Mrs. Thilini Rajapaksa",
    role: "Head of Science",
    bio: "Leads the physical and biological science streams and the science exhibition.",
  },
  {
    slug: "head-of-english",
    name: "Mr. Rohan Peiris",
    role: "Head of English",
    bio: "Responsible for the English syllabus and the debating society.",
  },
  {
    slug: "head-of-commerce",
    name: "Mrs. Gayani Fernando",
    role: "Head of Commerce",
    bio: "Runs accounting, economics and business studies across the senior school.",
  },
  {
    slug: "head-of-ict",
    name: "Mr. Shanaka Wickramasinghe",
    role: "Head of ICT & Technology",
    bio: "Networked labs, the technology stream and the College's digital literacy work.",
  },
  {
    slug: "head-of-arts",
    name: "Mr. Chandana Gunasekara",
    role: "Head of Arts & Aesthetics",
    bio: "Art, music and drama, including the choir and the annual concerts.",
  },
  {
    slug: "head-of-sports",
    name: "Mr. Ruwan Jayawardena",
    role: "Head of Sports",
    bio: "Cricket, rugby, football and athletics on College grounds.",
  },
  {
    slug: "head-of-primary",
    name: "Mrs. Neroli Fernando",
    role: "Sectional Head, Primary",
    bio: "Grades 1 to 5: literacy, numeracy, faith and character.",
  },
] as const;

const seedAcademicHeads = async (uploaderId: string) => {
  const portraits = await Promise.all(
    ACADEMIC_HEADS.map((head) =>
      uploadSeedImage(
        `person-${head.slug}`,
        PORTRAIT_SIZE.width,
        PORTRAIT_SIZE.height,
        uploaderId
      )
    )
  );

  await Promise.all(
    ACADEMIC_HEADS.map((head, index) =>
      db
        .insert(person)
        .values({
          id: crypto.randomUUID(),
          slug: head.slug,
          name: head.name,
          role: head.role,
          bio: head.bio,
          imageId: portraits[index] ?? null,
          publishedAt: new Date(),
        })
        .run()
    )
  );

  return ACADEMIC_HEADS.length;
};

const main = async () => {
  const cmsUserId = await requireUserId("cms");
  const clubUserId = await requireUserId(CLUB_SEAT_USERNAME);

  console.log("Seeding clubs...");
  const clubCount = await seedClubs();

  console.log("Clearing existing seeded content...");
  await db.delete(clubPhoto).run();
  await db.delete(gallery).run();
  await db.delete(announcement).run();
  await db.delete(event).run();
  await db.delete(newsPost).run();
  await db.delete(achievement).run();
  await db.delete(resultsYear).run();
  await db.delete(person).run();
  /*
   * `content_version` goes too, and this is the one deletion here that costs
   * more than a reseed: it holds every page's published blocks *and* any
   * editor's unsaved drafts, so a run discards work in the CMS as well as
   * replacing the live pages. That is the trade this script has always made -
   * it is a demo database reset, not an editor tool - and the alternative is
   * worse: the table has no unique index on (page, block), so a reseed that
   * only inserted would leave a row per block per run and grow forever.
   */
  await db.delete(contentVersion).run();

  const removedImages = await deletePreviouslySeededImages();
  if (removedImages > 0) {
    console.log(`Removed ${removedImages} images from a previous run.`);
  }

  console.log("Seeding achievements...");
  const achievementIds = await seedAchievements(cmsUserId);

  console.log("Seeding announcements, events and news posts...");
  const [, eventIds] = await Promise.all([
    seedAnnouncements(cmsUserId),
    seedEvents(cmsUserId),
    seedNewsPosts(cmsUserId),
  ]);

  console.log("Seeding galleries...");
  const galleryCount = await seedGalleriesForDemo(
    cmsUserId,
    clubUserId,
    eventIds,
    achievementIds
  );

  console.log("Publishing CMS page content...");
  const pageContent = await seedPageContent(cmsUserId);

  console.log("Seeding academic heads...");
  const heads = await seedAcademicHeads(cmsUserId);

  console.log("Sealing examination results...");
  const resultsYears = await seedResults(cmsUserId);

  console.log("Done. Seeded:");
  console.log(`  ${clubCount} clubs`);
  console.log(`  ${ACHIEVEMENT_ROWS.length} achievements`);
  console.log(`  ${ANNOUNCEMENT_ROWS.length} announcements`);
  console.log(
    `  ${PAST_EVENT_ROWS.length + EVENT_ROWS.length} events (${PAST_EVENT_ROWS.length} past, ${EVENT_ROWS.length} upcoming)`
  );
  console.log(`  ${NEWS_ROWS.length} news posts`);
  console.log(
    `  ${galleryCount} galleries (2 CMS-direct, 2 club-submitted - one approved, one pending review)`
  );
  console.log(
    `  ${pageContent.pages} CMS pages (${pageContent.blocks} blocks published, ${pageContent.images} page images)`
  );
  console.log(`  ${heads} academic heads`);
  console.log(`  ${resultsYears} examination years`);
};

/*
 * `main()` is awaited, not fire-and-forget with a `process.exit(0)` after it.
 * The old ending exited the process unconditionally, which did two bad things:
 * it reported success even when a step had failed, and it could terminate the
 * runtime before the last MinIO uploads had flushed - leaving content rows whose
 * images never landed. A rejected `main()` now exits non-zero on its own, so a
 * failed seed is visible instead of silent.
 */
await main();
