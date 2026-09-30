import { announcement } from "@aloysius/db/schema/announcements";
import {
  clubAchievement,
  clubAnnouncement,
  clubEvent,
} from "@aloysius/db/schema/clubContent";
import { achievement, event, person } from "@aloysius/db/schema/root-content";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";

import type { DbLike } from "./db";

/**
 * The single place that knows what a `gallery_link` target can point at.
 *
 * `gallery_link` is polymorphic with no foreign key, so nothing in the database
 * stops a link naming a row that does not exist. That has to be checked by hand,
 * and it used to be checked in three places that disagreed: submission accepted
 * `event`, `person` and `achievement`; approval only re-checked `event` and
 * `person`; and the club's own links screen resolved all three. A club could
 * therefore submit an `achievement` link, a reviewer could approve it, and the
 * approval would fail on a record that existed.
 *
 * One map, used by all three, so the lists cannot drift again. Adding a target
 * to `GALLERY_LINK_TARGETS` without adding it here is a runtime error naming the
 * target, which is the intended failure mode: a link to something the site
 * cannot render is worse than a rejected submission.
 */
type LinkTargetResolver = (
  db: DbLike,
  targetId: string
) => Promise<string | null>;

const LINK_TARGET_RESOLVERS: Record<string, LinkTargetResolver> = {
  event: async (db, targetId) => {
    const row = await db
      .select({ title: event.title })
      .from(event)
      .where(eq(event.id, targetId))
      .get();
    return row?.title ?? null;
  },
  person: async (db, targetId) => {
    const row = await db
      .select({ name: person.name })
      .from(person)
      .where(eq(person.id, targetId))
      .get();
    return row?.name ?? null;
  },
  achievement: async (db, targetId) => {
    const row = await db
      .select({ title: achievement.title })
      .from(achievement)
      .where(eq(achievement.id, targetId))
      .get();
    return row?.title ?? null;
  },

  /*
   * The club's own records.
   *
   * These are separate targets rather than an extension of `event` and
   * `achievement` because they are different tables with different ownership. A
   * club event is written by a club and approved through the club queue; a
   * school event is CMS-authored global content. Before these existed a club
   * could photograph its own exhibition and had nowhere to point the gallery,
   * so the natural link - the photographs of the thing the club put on - could
   * not be expressed at all.
   */
  clubEvent: async (db, targetId) => {
    const row = await db
      .select({ title: clubEvent.title })
      .from(clubEvent)
      .where(eq(clubEvent.id, targetId))
      .get();
    return row?.title ?? null;
  },
  clubAchievement: async (db, targetId) => {
    const row = await db
      .select({ title: clubAchievement.title })
      .from(clubAchievement)
      .where(eq(clubAchievement.id, targetId))
      .get();
    return row?.title ?? null;
  },

  /*
   * Announcements, school-wide and club-owned.
   *
   * A gallery of the prize-giving photographs belongs beside the announcement
   * that told the school the prize-giving was happening, whoever wrote it. Both
   * tables carry a `title`, so the resolver shape is the same as every other
   * target; the ownership difference between the two mirrors the difference
   * between `event` and `clubEvent` above.
   */
  announcement: async (db, targetId) => {
    const row = await db
      .select({ title: announcement.title })
      .from(announcement)
      .where(eq(announcement.id, targetId))
      .get();
    return row?.title ?? null;
  },
  clubAnnouncement: async (db, targetId) => {
    const row = await db
      .select({ title: clubAnnouncement.title })
      .from(clubAnnouncement)
      .where(eq(clubAnnouncement.id, targetId))
      .get();
    return row?.title ?? null;
  },
};

/**
 * Human wording for a target that has no table yet.
 *
 * `exhibition` is the only one today. It is listed in `GALLERY_LINK_TARGETS` so
 * the link table can start accepting it the moment the schema lands, and it is
 * rejected here with a message that says why rather than a validation error the
 * club cannot act on.
 */
const UNRESOLVABLE_REASON: Record<string, string> = {
  exhibition:
    "No exhibition records exist yet, so this link cannot be approved",
};

/** Whether this target kind can be resolved to a real record at all. */
export const isResolvableLinkTarget = (target: string) =>
  target in LINK_TARGET_RESOLVERS;

/**
 * The display title of a link target, or `null` if the record is gone.
 *
 * A null here is a legitimate answer, not a failure: a target deleted after the
 * link was made leaves a row that is meaningless on its own, and the club's
 * screen shows it with a null title precisely so it can be cleared.
 */
export const linkTargetTitle = (
  db: DbLike,
  target: string,
  targetId: string
): Promise<string | null> => {
  const resolve = LINK_TARGET_RESOLVERS[target];
  if (!resolve) {
    return Promise.resolve(null);
  }
  return resolve(db, targetId);
};

/**
 * Assert the target exists, for the submit handler and the applier alike.
 *
 * Called at both ends on purpose. At submit time it stops the club queuing a
 * proposal that cannot land. At approval time it catches the case where the
 * record was deleted in between, which is a real possibility: the queue can sit
 * for days and the target table is CMS-authored.
 */
export const assertLinkTargetExists = async (
  db: DbLike,
  target: string,
  targetId: string
): Promise<string> => {
  if (!isResolvableLinkTarget(target)) {
    throw new ORPCError("BAD_REQUEST", {
      message:
        UNRESOLVABLE_REASON[target] ??
        `Nothing on the site links to a ${target} yet, so this link cannot be approved`,
    });
  }

  const title = await linkTargetTitle(db, target, targetId);
  if (title === null) {
    throw new ORPCError("BAD_REQUEST", {
      message: `That ${target} does not exist`,
    });
  }

  return title;
};
