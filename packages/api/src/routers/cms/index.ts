import type { Database } from "@aloysius/db";
import { contentVersion } from "@aloysius/db/schema/cms";
import { getEventMeta, withEventMeta } from "@orpc/server";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

import { cmsProcedure, protectedProcedure, publicProcedure } from "../../index";
import { cmsPublisher } from "./publisher";

export interface CmsHomepageEvent {
  blocks: SnapshotBlock[];
}

const blockFieldSchema = z.object({
  id: z.string(),
  value: z.string().optional(),
  aspectRatio: z.number().positive().optional(),
});

const blockSchema = z.object({
  id: z.string(),
  hidden: z.boolean().optional(),
  fields: z.array(blockFieldSchema).optional(),
});

export interface SnapshotBlock {
  id: string;
  hidden: boolean;
  fields: { id: string; value: string; aspectRatio?: number }[];
}

const parseSnapshot = (raw: string): SnapshotBlock => {
  const parsed = JSON.parse(raw) as {
    hidden?: boolean;
    fields?: { id: string; value?: string; aspectRatio?: number }[];
  };
  return {
    id: "",
    hidden: parsed.hidden ?? false,
    fields: (parsed.fields ?? []).map((f) => ({
      id: f.id,
      value: f.value ?? "",
      ...(f.aspectRatio ? { aspectRatio: f.aspectRatio } : {}),
    })),
  };
};

/** Deduplicate rows, keeping only the latest per blockId. */
const dedupeBlocks = (
  rows: { blockId: string; snapshot: string }[]
): SnapshotBlock[] => {
  const seen = new Set<string>();
  const blocks: SnapshotBlock[] = [];

  for (const row of rows) {
    if (seen.has(row.blockId)) {
      continue;
    }
    seen.add(row.blockId);
    const snap = parseSnapshot(row.snapshot);
    snap.id = row.blockId;
    blocks.push(snap);
  }

  return blocks;
};

/*
 * Every page's editor (`updateHomepage`/`updateAbout`, `publishHomepage`/
 * `publishAbout`, ...) is a thin wrapper around one of these, parameterized by
 * `page` and the real-time event channel to publish to. The wrappers exist
 * because oRPC procedures are named endpoints, not a generic `getPage(id)` -
 * but the row-level logic underneath is identical for every page and lives
 * here exactly once.
 */

const fetchPublishedBlocks = async (db: Database, page: string) => {
  const published = await db
    .select()
    .from(contentVersion)
    .where(
      and(eq(contentVersion.page, page), eq(contentVersion.published, true))
    )
    .orderBy(desc(contentVersion.createdAt))
    .all();
  return dedupeBlocks(published);
};

const fetchDraftBlocks = async (db: Database, page: string) => {
  const drafts = await db
    .select()
    .from(contentVersion)
    .where(
      and(eq(contentVersion.page, page), eq(contentVersion.action, "draft"))
    )
    .orderBy(desc(contentVersion.createdAt))
    .all();
  return dedupeBlocks(drafts);
};

interface InputBlock {
  id: string;
  hidden?: boolean;
  fields?: { id: string; value?: string; aspectRatio?: number }[];
}

/**
 * Save a draft. Upserts: if a draft row already exists for a block, it is
 * updated in place; otherwise a new row is inserted. This keeps exactly one
 * draft row per block at any time. Returns the IDs of the saved rows so the
 * client can open a preview.
 */
const saveDraftBlocks = async (
  db: Database,
  page: string,
  userId: string,
  blocks: InputBlock[]
): Promise<string[]> => {
  const existing = await db
    .select()
    .from(contentVersion)
    .where(
      and(eq(contentVersion.page, page), eq(contentVersion.action, "draft"))
    )
    .all();

  const existingByBlock = new Map(existing.map((row) => [row.blockId, row]));

  const draftIds: string[] = [];

  await Promise.all(
    blocks.map((block) => {
      const snap = existingByBlock.get(block.id);
      if (snap) {
        draftIds.push(snap.id);
        return db
          .update(contentVersion)
          .set({ snapshot: JSON.stringify(block) })
          .where(eq(contentVersion.id, snap.id))
          .run();
      }
      const newId = crypto.randomUUID();
      draftIds.push(newId);
      return db
        .insert(contentVersion)
        .values({
          id: newId,
          page,
          blockId: block.id,
          action: "draft",
          snapshot: JSON.stringify(block),
          published: false,
          authorId: userId,
        })
        .run();
    })
  );

  return draftIds;
};

/**
 * Publish the drafts a page currently holds.
 *
 * ## It publishes the drafts, it does not replace the page
 *
 * The blocks that go live are exactly the blocks that have a draft. A block with
 * no draft is left alone - still published, at whatever it was published to.
 *
 * The obvious implementation, and the one this replaced, was "unpublish every
 * published row for the page, then insert one row per draft". That reads like
 * "publish the draft" and behaves like "replace the page with the draft", which
 * destroys content in two ordinary situations:
 *
 * - **An empty draft.** Pressing Publish with nothing saved unpublished all
 *   eleven homepage blocks and inserted nothing, and the public homepage went
 *   blank. It reported `{ success: true, publishedIds: [] }`.
 * - **A partial draft.** An editor who saved one block and pressed Publish took
 *   the other ten off the live site, because the draft set is whatever that
 *   editor last saved rather than the whole page.
 *
 * Both were silent: the editor saw a success toast and a working preview, and
 * the damage was only visible on the public site.
 *
 * So an empty draft set is a no-op rather than a wipe, and the rows inserted are
 * only ever the blocks being replaced. The audit trail is unchanged - each
 * published block gets a fresh row and its predecessor is demoted, so
 * `fetchHistory` still sees every version ever published.
 */
const publishDraftBlocks = async (
  db: Database,
  page: string,
  userId: string
): Promise<{ publishedIds: string[]; publishedBlocks: SnapshotBlock[] }> => {
  const drafts = await db
    .select()
    .from(contentVersion)
    .where(
      and(eq(contentVersion.page, page), eq(contentVersion.action, "draft"))
    )
    .orderBy(desc(contentVersion.createdAt))
    .all();

  /*
   * One draft row per block, the newest. `saveDraftBlocks` keeps that invariant,
   * so this only ever collapses rows an older build or a direct write left
   * behind - and it collapses them the same way for every caller.
   */
  const seen = new Set<string>();
  const toPublish = drafts.filter((draft) => {
    if (seen.has(draft.blockId)) {
      return false;
    }
    seen.add(draft.blockId);
    return true;
  });

  /*
   * Nothing to publish is not an instruction to unpublish everything. Reported
   * as a success with no ids, because from the editor's point of view it is one:
   * there was nothing staged, and the live page is exactly as they left it.
   */
  if (toPublish.length === 0) {
    return { publishedIds: [], publishedBlocks: [] };
  }

  await db.transaction(async (tx) => {
    /*
     * Scoped to the blocks this publish replaces, not to the page. This is the
     * line that was missing: a page-wide demotion is what turned a one-block
     * edit into a nine-block deletion.
     */
    await Promise.all(
      toPublish.map((draft) =>
        tx
          .update(contentVersion)
          .set({ published: false })
          .where(
            and(
              eq(contentVersion.page, page),
              eq(contentVersion.blockId, draft.blockId),
              eq(contentVersion.published, true)
            )
          )
          .run()
      )
    );

    const batchId = crypto.randomUUID();

    await Promise.all(
      toPublish.map((draft) =>
        tx
          .insert(contentVersion)
          .values({
            id: crypto.randomUUID(),
            page,
            blockId: draft.blockId,
            action: "publish",
            snapshot: draft.snapshot,
            published: true,
            authorId: userId,
            batchId,
          })
          .run()
      )
    );

    await Promise.all(
      drafts.map((draft) =>
        tx.delete(contentVersion).where(eq(contentVersion.id, draft.id)).run()
      )
    );
  });

  const publishedIds = await Promise.all(
    toPublish.map(async (draft) => {
      const row = await db
        .select({ id: contentVersion.id })
        .from(contentVersion)
        .where(
          and(
            eq(contentVersion.page, page),
            eq(contentVersion.blockId, draft.blockId),
            eq(contentVersion.published, true)
          )
        )
        .get();
      return row?.id ?? "";
    })
  );

  return {
    publishedIds: publishedIds.filter(Boolean),
    publishedBlocks: toPublish.map((draft) => {
      const snap = parseSnapshot(draft.snapshot);
      snap.id = draft.blockId;
      return snap;
    }),
  };
};

/** One publish in a page's history: every block that press of Publish wrote. */
interface PublishGroup {
  timestamp: number;
  versionId: string;
  blocks: SnapshotBlock[];
}

/**
 * What ties a published row to the press of Publish that wrote it.
 *
 * A `batchId` when there is one - every row from one press shares it. Rows
 * written before that column existed fall back to the exact timestamp, which is
 * wrong for them in the same way it always was, but wrong for one page's history
 * rather than all of them.
 */
const groupKeyOf = (row: { batchId: string | null; createdAt: Date }) =>
  row.batchId ?? `ts:${row.createdAt.getTime()}`;

/**
 * Field-level changes between two publishes.
 *
 * Compared against the group *after* this one in the list, which is the older
 * version. A publish that introduced a block diffs every one of its fields
 * against nothing, which is correct: there was no previous value.
 */
const diffBetween = (
  group: PublishGroup,
  previous: PublishGroup | undefined
): { block: string; field: string; from: string; to: string }[] => {
  const diffs: { block: string; field: string; from: string; to: string }[] =
    [];

  if (!previous) {
    return diffs;
  }

  const previousValues = new Map<string, Map<string, string>>();
  for (const block of previous.blocks) {
    previousValues.set(
      block.id,
      new Map(block.fields.map((field) => [field.id, field.value]))
    );
  }

  for (const block of group.blocks) {
    const before = previousValues.get(block.id);
    for (const field of block.fields) {
      const from = before?.get(field.id) ?? "";
      if (field.value !== from) {
        diffs.push({ block: block.id, field: field.id, from, to: field.value });
      }
    }
  }

  return diffs;
};

/**
 * History of published versions for a page. Returns paginated snapshots
 * grouped into one entry per press of Publish, with field-level diffs between
 * consecutive entries.
 *
 * ## Why the grouping is by `batchId` and not by timestamp
 *
 * Each publish writes one row per block, and `Promise.all` means each row
 * evaluates `unixepoch('subsecond')` for itself as it is inserted - eleven
 * homepage blocks came back spread over 135ms with no two sharing a timestamp.
 * Grouping on `createdAt` therefore never matched, and every history entry was
 * one *block* instead of one *publish*. Worse, each entry's diff was computed
 * against the next block in the list, so a page's history claimed a block
 * changed because a completely different block had been republished at the same
 * moment.
 *
 * `batchId` is written once per publish and copied into every row it inserts,
 * which is the only thing that can carry "these rows came from one click".
 *
 * Rows arrive newest first, so the first row of each new key opens its group and
 * the groups come out in publish order without a second sort - which is what
 * makes `groups[index + 1]` reliably the version to diff against.
 */
const fetchHistory = async (db: Database, page: string, cursor: number) => {
  const PAGE_SIZE = 10;

  const allPublished = await db
    .select()
    .from(contentVersion)
    .where(
      and(eq(contentVersion.page, page), eq(contentVersion.action, "publish"))
    )
    .orderBy(desc(contentVersion.createdAt))
    .all();

  /*
   * One pass, not a scan of the whole list per group. The rows of a group are
   * not adjacent in a general case - two publishes can interleave if a block is
   * republished while another is still being written - so each row is bucketed by
   * its key and the buckets are then read in the order their first row appeared.
   */
  const byKey = new Map<string, PublishGroup>();
  for (const row of allPublished) {
    const key = groupKeyOf(row);
    const group = byKey.get(key);
    if (group) {
      const snap = parseSnapshot(row.snapshot);
      snap.id = row.blockId;
      group.blocks.push(snap);
      continue;
    }
    const snap = parseSnapshot(row.snapshot);
    snap.id = row.blockId;
    byKey.set(key, {
      timestamp: row.createdAt.getTime(),
      versionId: row.id,
      blocks: [snap],
    });
  }

  const groups = [...byKey.values()];
  const total = groups.length;
  const page_ = groups.slice(cursor, cursor + PAGE_SIZE);

  /*
   * The diff reaches outside `page_` for the oldest entry on the page. Without
   * that, the tenth row of the first page and the first row of the second both
   * diffed against nothing and reported every field as brand new.
   */
  const items = page_.map((group, index) => ({
    versionId: group.versionId,
    timestamp: group.timestamp,
    blockCount: group.blocks.length,
    diffs: diffBetween(group, groups[cursor + index + 1]),
  }));

  return {
    items,
    nextCursor: cursor + PAGE_SIZE < total ? cursor + PAGE_SIZE : null,
    total,
  };
};

/**
 * Normalize the client's block input into the shape the snapshot JSON and the
 * real-time event both use. Every page's `update` handler needs this, so it
 * lives here once.
 */
const toSnapshotBlocks = (blocks: InputBlock[]): SnapshotBlock[] =>
  blocks.map((b) => ({
    id: b.id,
    hidden: b.hidden ?? false,
    fields: (b.fields ?? []).map((f) => ({
      id: f.id,
      value: f.value ?? "",
      ...(f.aspectRatio ? { aspectRatio: f.aspectRatio } : {}),
    })),
  }));

/**
 * Build the six endpoints one editor screen needs, parameterized by the `page`
 * key it stores its rows under and the real-time channel it publishes to.
 *
 * Every row-level operation above is already page-agnostic; this is the
 * procedure layer that wraps them. The eight existing page screens predate it
 * and still spell their six endpoints out one by one — this factory exists so
 * a *new* screen does not add a ninth copy. Porting the existing eight onto it
 * is a mechanical follow-up, deliberately kept out of a change that also
 * introduces the global block.
 */
const editorEndpoints = (page: string) => {
  const channel = `${page}-updated`;

  return {
    /** Latest published version for each block. */
    get: publicProcedure.handler(async ({ context }) => {
      const blocks = await fetchPublishedBlocks(context.db, page);
      return blocks.length > 0 ? { blocks } : null;
    }),

    /** Latest draft for each block. */
    getDraft: protectedProcedure.handler(async ({ context }) => {
      const blocks = await fetchDraftBlocks(context.db, page);
      return blocks.length > 0 ? { blocks } : null;
    }),

    /** Paginated publish history with field-level diffs. */
    getHistory: protectedProcedure
      .input(z.object({ cursor: z.number().optional().default(0) }))
      .handler(({ context, input }) =>
        fetchHistory(context.db, page, input.cursor)
      ),

    update: cmsProcedure
      .input(z.object({ blocks: z.array(blockSchema) }))
      .handler(async ({ context, input }) => {
        const userId = context.session?.user?.id;
        if (!userId) {
          return { success: false, draftIds: [] as string[] };
        }
        const draftIds = await saveDraftBlocks(
          context.db,
          page,
          userId,
          input.blocks
        );
        await cmsPublisher.publish(channel, {
          blocks: toSnapshotBlocks(input.blocks),
        });
        return { success: true, draftIds };
      }),

    /** Real-time SSE stream for this screen's snapshot changes. */
    watch: cmsProcedure.handler(async function* watch({ signal, lastEventId }) {
      const iterator = cmsPublisher.subscribe(channel, {
        signal,
        lastEventId,
      });
      for await (const payload of iterator) {
        const meta = getEventMeta(payload);
        yield withEventMeta(payload, { id: meta?.id ?? undefined });
      }
    }),

    publish: cmsProcedure.handler(async ({ context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        return { success: false };
      }
      const { publishedIds, publishedBlocks } = await publishDraftBlocks(
        context.db,
        page,
        userId
      );
      await cmsPublisher.publish(channel, { blocks: publishedBlocks });
      return { success: true, publishedIds };
    }),
  };
};

/** The global Principal's Message editor. Not a page — see `PRINCIPAL_BLOCKS`. */
const principal = editorEndpoints("principal");

export const cmsRouter = {
  getPrincipal: principal.get,
  getPrincipalDraft: principal.getDraft,
  getPrincipalHistory: principal.getHistory,
  updatePrincipal: principal.update,
  watchPrincipal: principal.watch,
  publishPrincipal: principal.publish,

  /** Fetch the latest published version for each block on the homepage. */
  getHomepage: publicProcedure.handler(async ({ context }) => {
    const blocks = await fetchPublishedBlocks(context.db, "homepage");
    return blocks.length > 0 ? { blocks } : null;
  }),

  /** Fetch the latest draft for each block on the homepage. */
  getHomepageDraft: protectedProcedure.handler(async ({ context }) => {
    const blocks = await fetchDraftBlocks(context.db, "homepage");
    return blocks.length > 0 ? { blocks } : null;
  }),

  /**
   * Fetch all blocks for a page at the time of a specific version.
   * The versionId points to a contentVersion row — we use it to find the page,
   * then load the snapshot state of every block for that page at that point.
   * Page-agnostic: works for any page's version id.
   */
  getHomepageVersion: publicProcedure
    .input(z.object({ versionId: z.string() }))
    .handler(async ({ context, input }) => {
      const ref = await context.db
        .select()
        .from(contentVersion)
        .where(eq(contentVersion.id, input.versionId))
        .limit(1)
        .all();

      const [firstRef] = ref;
      if (!firstRef) {
        return null;
      }
      const { page } = firstRef;

      if (firstRef.action === "draft" && !firstRef.published) {
        return { blocks: await fetchDraftBlocks(context.db, page) };
      }

      return { blocks: await fetchPublishedBlocks(context.db, page) };
    }),

  /** History of published versions for the homepage. */
  getHomepageHistory: protectedProcedure
    .input(z.object({ cursor: z.number().optional().default(0) }))
    .handler(({ context, input }) =>
      fetchHistory(context.db, "homepage", input.cursor)
    ),

  updateHomepage: cmsProcedure
    .input(z.object({ blocks: z.array(blockSchema) }))
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        return { success: false, draftIds: [] as string[] };
      }
      const draftIds = await saveDraftBlocks(
        context.db,
        "homepage",
        userId,
        input.blocks
      );
      await cmsPublisher.publish("homepage-updated", {
        blocks: input.blocks.map((b) => ({
          id: b.id,
          hidden: b.hidden ?? false,
          fields: (b.fields ?? []).map((f) => ({
            id: f.id,
            value: f.value ?? "",
            ...(f.aspectRatio ? { aspectRatio: f.aspectRatio } : {}),
          })),
        })),
      });
      return { success: true, draftIds };
    }),

  /** Real-time SSE stream for homepage snapshot changes. */
  watchHomepage: cmsProcedure.handler(async function* watchHomepage({
    signal,
    lastEventId,
  }) {
    const iterator = cmsPublisher.subscribe("homepage-updated", {
      signal,
      lastEventId,
    });
    for await (const payload of iterator) {
      const meta = getEventMeta(payload);
      yield withEventMeta(payload, { id: meta?.id ?? undefined });
    }
  }),

  publishHomepage: cmsProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) {
      return { success: false };
    }
    const { publishedIds, publishedBlocks } = await publishDraftBlocks(
      context.db,
      "homepage",
      userId
    );
    await cmsPublisher.publish("homepage-updated", { blocks: publishedBlocks });
    return { success: true, publishedIds };
  }),

  /* ------------------------------------------------------------- about */

  /** Fetch the latest published version for each block on the About page. */
  getAbout: publicProcedure.handler(async ({ context }) => {
    const blocks = await fetchPublishedBlocks(context.db, "about");
    return blocks.length > 0 ? { blocks } : null;
  }),

  /** Fetch the latest draft for each block on the About page. */
  getAboutDraft: protectedProcedure.handler(async ({ context }) => {
    const blocks = await fetchDraftBlocks(context.db, "about");
    return blocks.length > 0 ? { blocks } : null;
  }),

  /** History of published versions for the About page. */
  getAboutHistory: protectedProcedure
    .input(z.object({ cursor: z.number().optional().default(0) }))
    .handler(({ context, input }) =>
      fetchHistory(context.db, "about", input.cursor)
    ),

  updateAbout: cmsProcedure
    .input(z.object({ blocks: z.array(blockSchema) }))
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        return { success: false, draftIds: [] as string[] };
      }
      const draftIds = await saveDraftBlocks(
        context.db,
        "about",
        userId,
        input.blocks
      );
      await cmsPublisher.publish("about-updated", {
        blocks: input.blocks.map((b) => ({
          id: b.id,
          hidden: b.hidden ?? false,
          fields: (b.fields ?? []).map((f) => ({
            id: f.id,
            value: f.value ?? "",
            ...(f.aspectRatio ? { aspectRatio: f.aspectRatio } : {}),
          })),
        })),
      });
      return { success: true, draftIds };
    }),

  /** Real-time SSE stream for About page snapshot changes. */
  watchAbout: cmsProcedure.handler(async function* watchAbout({
    signal,
    lastEventId,
  }) {
    const iterator = cmsPublisher.subscribe("about-updated", {
      signal,
      lastEventId,
    });
    for await (const payload of iterator) {
      const meta = getEventMeta(payload);
      yield withEventMeta(payload, { id: meta?.id ?? undefined });
    }
  }),

  publishAbout: cmsProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) {
      return { success: false };
    }
    const { publishedIds, publishedBlocks } = await publishDraftBlocks(
      context.db,
      "about",
      userId
    );
    await cmsPublisher.publish("about-updated", { blocks: publishedBlocks });
    return { success: true, publishedIds };
  }),

  /* ------------------------------------------------------------- news */

  getNews: publicProcedure.handler(async ({ context }) => {
    const blocks = await fetchPublishedBlocks(context.db, "news");
    return blocks.length > 0 ? { blocks } : null;
  }),

  getNewsDraft: protectedProcedure.handler(async ({ context }) => {
    const blocks = await fetchDraftBlocks(context.db, "news");
    return blocks.length > 0 ? { blocks } : null;
  }),

  getNewsHistory: protectedProcedure
    .input(z.object({ cursor: z.number().optional().default(0) }))
    .handler(({ context, input }) =>
      fetchHistory(context.db, "news", input.cursor)
    ),

  updateNews: cmsProcedure
    .input(z.object({ blocks: z.array(blockSchema) }))
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        return { success: false, draftIds: [] as string[] };
      }
      const draftIds = await saveDraftBlocks(
        context.db,
        "news",
        userId,
        input.blocks
      );
      await cmsPublisher.publish("news-updated", {
        blocks: input.blocks.map((b) => ({
          id: b.id,
          hidden: b.hidden ?? false,
          fields: (b.fields ?? []).map((f) => ({
            id: f.id,
            value: f.value ?? "",
            ...(f.aspectRatio ? { aspectRatio: f.aspectRatio } : {}),
          })),
        })),
      });
      return { success: true, draftIds };
    }),

  watchNews: cmsProcedure.handler(async function* watchNews({
    signal,
    lastEventId,
  }) {
    const iterator = cmsPublisher.subscribe("news-updated", {
      signal,
      lastEventId,
    });
    for await (const payload of iterator) {
      const meta = getEventMeta(payload);
      yield withEventMeta(payload, { id: meta?.id ?? undefined });
    }
  }),

  publishNews: cmsProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) {
      return { success: false };
    }
    const { publishedIds, publishedBlocks } = await publishDraftBlocks(
      context.db,
      "news",
      userId
    );
    await cmsPublisher.publish("news-updated", { blocks: publishedBlocks });
    return { success: true, publishedIds };
  }),

  /* ------------------------------------------------------------- notices */

  getNotices: publicProcedure.handler(async ({ context }) => {
    const blocks = await fetchPublishedBlocks(context.db, "notices");
    return blocks.length > 0 ? { blocks } : null;
  }),

  getNoticesDraft: protectedProcedure.handler(async ({ context }) => {
    const blocks = await fetchDraftBlocks(context.db, "notices");
    return blocks.length > 0 ? { blocks } : null;
  }),

  getNoticesHistory: protectedProcedure
    .input(z.object({ cursor: z.number().optional().default(0) }))
    .handler(({ context, input }) =>
      fetchHistory(context.db, "notices", input.cursor)
    ),

  updateNotices: cmsProcedure
    .input(z.object({ blocks: z.array(blockSchema) }))
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        return { success: false, draftIds: [] as string[] };
      }
      const draftIds = await saveDraftBlocks(
        context.db,
        "notices",
        userId,
        input.blocks
      );
      await cmsPublisher.publish("notices-updated", {
        blocks: input.blocks.map((b) => ({
          id: b.id,
          hidden: b.hidden ?? false,
          fields: (b.fields ?? []).map((f) => ({
            id: f.id,
            value: f.value ?? "",
            ...(f.aspectRatio ? { aspectRatio: f.aspectRatio } : {}),
          })),
        })),
      });
      return { success: true, draftIds };
    }),

  watchNotices: cmsProcedure.handler(async function* watchNotices({
    signal,
    lastEventId,
  }) {
    const iterator = cmsPublisher.subscribe("notices-updated", {
      signal,
      lastEventId,
    });
    for await (const payload of iterator) {
      const meta = getEventMeta(payload);
      yield withEventMeta(payload, { id: meta?.id ?? undefined });
    }
  }),

  publishNotices: cmsProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) {
      return { success: false };
    }
    const { publishedIds, publishedBlocks } = await publishDraftBlocks(
      context.db,
      "notices",
      userId
    );
    await cmsPublisher.publish("notices-updated", { blocks: publishedBlocks });
    return { success: true, publishedIds };
  }),

  /* ------------------------------------------------------------- contact */

  getContact: publicProcedure.handler(async ({ context }) => {
    const blocks = await fetchPublishedBlocks(context.db, "contact");
    return blocks.length > 0 ? { blocks } : null;
  }),

  getContactDraft: protectedProcedure.handler(async ({ context }) => {
    const blocks = await fetchDraftBlocks(context.db, "contact");
    return blocks.length > 0 ? { blocks } : null;
  }),

  getContactHistory: protectedProcedure
    .input(z.object({ cursor: z.number().optional().default(0) }))
    .handler(({ context, input }) =>
      fetchHistory(context.db, "contact", input.cursor)
    ),

  updateContact: cmsProcedure
    .input(z.object({ blocks: z.array(blockSchema) }))
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        return { success: false, draftIds: [] as string[] };
      }
      const draftIds = await saveDraftBlocks(
        context.db,
        "contact",
        userId,
        input.blocks
      );
      await cmsPublisher.publish("contact-updated", {
        blocks: input.blocks.map((b) => ({
          id: b.id,
          hidden: b.hidden ?? false,
          fields: (b.fields ?? []).map((f) => ({
            id: f.id,
            value: f.value ?? "",
            ...(f.aspectRatio ? { aspectRatio: f.aspectRatio } : {}),
          })),
        })),
      });
      return { success: true, draftIds };
    }),

  watchContact: cmsProcedure.handler(async function* watchContact({
    signal,
    lastEventId,
  }) {
    const iterator = cmsPublisher.subscribe("contact-updated", {
      signal,
      lastEventId,
    });
    for await (const payload of iterator) {
      const meta = getEventMeta(payload);
      yield withEventMeta(payload, { id: meta?.id ?? undefined });
    }
  }),

  publishContact: cmsProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) {
      return { success: false };
    }
    const { publishedIds, publishedBlocks } = await publishDraftBlocks(
      context.db,
      "contact",
      userId
    );
    await cmsPublisher.publish("contact-updated", { blocks: publishedBlocks });
    return { success: true, publishedIds };
  }),

  /* ------------------------------------------------------------- alumni */

  getAlumni: publicProcedure.handler(async ({ context }) => {
    const blocks = await fetchPublishedBlocks(context.db, "alumni");
    return blocks.length > 0 ? { blocks } : null;
  }),

  getAlumniDraft: protectedProcedure.handler(async ({ context }) => {
    const blocks = await fetchDraftBlocks(context.db, "alumni");
    return blocks.length > 0 ? { blocks } : null;
  }),

  getAlumniHistory: protectedProcedure
    .input(z.object({ cursor: z.number().optional().default(0) }))
    .handler(({ context, input }) =>
      fetchHistory(context.db, "alumni", input.cursor)
    ),

  updateAlumni: cmsProcedure
    .input(z.object({ blocks: z.array(blockSchema) }))
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        return { success: false, draftIds: [] as string[] };
      }
      const draftIds = await saveDraftBlocks(
        context.db,
        "alumni",
        userId,
        input.blocks
      );
      await cmsPublisher.publish("alumni-updated", {
        blocks: input.blocks.map((b) => ({
          id: b.id,
          hidden: b.hidden ?? false,
          fields: (b.fields ?? []).map((f) => ({
            id: f.id,
            value: f.value ?? "",
            ...(f.aspectRatio ? { aspectRatio: f.aspectRatio } : {}),
          })),
        })),
      });
      return { success: true, draftIds };
    }),

  watchAlumni: cmsProcedure.handler(async function* watchAlumni({
    signal,
    lastEventId,
  }) {
    const iterator = cmsPublisher.subscribe("alumni-updated", {
      signal,
      lastEventId,
    });
    for await (const payload of iterator) {
      const meta = getEventMeta(payload);
      yield withEventMeta(payload, { id: meta?.id ?? undefined });
    }
  }),

  publishAlumni: cmsProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) {
      return { success: false };
    }
    const { publishedIds, publishedBlocks } = await publishDraftBlocks(
      context.db,
      "alumni",
      userId
    );
    await cmsPublisher.publish("alumni-updated", { blocks: publishedBlocks });
    return { success: true, publishedIds };
  }),

  /* ------------------------------------------------------------- media */

  getMedia: publicProcedure.handler(async ({ context }) => {
    const blocks = await fetchPublishedBlocks(context.db, "media");
    return blocks.length > 0 ? { blocks } : null;
  }),

  getMediaDraft: protectedProcedure.handler(async ({ context }) => {
    const blocks = await fetchDraftBlocks(context.db, "media");
    return blocks.length > 0 ? { blocks } : null;
  }),

  getMediaHistory: protectedProcedure
    .input(z.object({ cursor: z.number().optional().default(0) }))
    .handler(({ context, input }) =>
      fetchHistory(context.db, "media", input.cursor)
    ),

  updateMedia: cmsProcedure
    .input(z.object({ blocks: z.array(blockSchema) }))
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        return { success: false, draftIds: [] as string[] };
      }
      const draftIds = await saveDraftBlocks(
        context.db,
        "media",
        userId,
        input.blocks
      );
      await cmsPublisher.publish("media-updated", {
        blocks: input.blocks.map((b) => ({
          id: b.id,
          hidden: b.hidden ?? false,
          fields: (b.fields ?? []).map((f) => ({
            id: f.id,
            value: f.value ?? "",
            ...(f.aspectRatio ? { aspectRatio: f.aspectRatio } : {}),
          })),
        })),
      });
      return { success: true, draftIds };
    }),

  watchMedia: cmsProcedure.handler(async function* watchMedia({
    signal,
    lastEventId,
  }) {
    const iterator = cmsPublisher.subscribe("media-updated", {
      signal,
      lastEventId,
    });
    for await (const payload of iterator) {
      const meta = getEventMeta(payload);
      yield withEventMeta(payload, { id: meta?.id ?? undefined });
    }
  }),

  publishMedia: cmsProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) {
      return { success: false };
    }
    const { publishedIds, publishedBlocks } = await publishDraftBlocks(
      context.db,
      "media",
      userId
    );
    await cmsPublisher.publish("media-updated", { blocks: publishedBlocks });
    return { success: true, publishedIds };
  }),

  /* ------------------------------------------------------------- students */

  getStudents: publicProcedure.handler(async ({ context }) => {
    const blocks = await fetchPublishedBlocks(context.db, "students");
    return blocks.length > 0 ? { blocks } : null;
  }),

  getStudentsDraft: protectedProcedure.handler(async ({ context }) => {
    const blocks = await fetchDraftBlocks(context.db, "students");
    return blocks.length > 0 ? { blocks } : null;
  }),

  getStudentsHistory: protectedProcedure
    .input(z.object({ cursor: z.number().optional().default(0) }))
    .handler(({ context, input }) =>
      fetchHistory(context.db, "students", input.cursor)
    ),

  updateStudents: cmsProcedure
    .input(z.object({ blocks: z.array(blockSchema) }))
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        return { success: false, draftIds: [] as string[] };
      }
      const draftIds = await saveDraftBlocks(
        context.db,
        "students",
        userId,
        input.blocks
      );
      await cmsPublisher.publish("students-updated", {
        blocks: input.blocks.map((b) => ({
          id: b.id,
          hidden: b.hidden ?? false,
          fields: (b.fields ?? []).map((f) => ({
            id: f.id,
            value: f.value ?? "",
            ...(f.aspectRatio ? { aspectRatio: f.aspectRatio } : {}),
          })),
        })),
      });
      return { success: true, draftIds };
    }),

  watchStudents: cmsProcedure.handler(async function* watchStudents({
    signal,
    lastEventId,
  }) {
    const iterator = cmsPublisher.subscribe("students-updated", {
      signal,
      lastEventId,
    });
    for await (const payload of iterator) {
      const meta = getEventMeta(payload);
      yield withEventMeta(payload, { id: meta?.id ?? undefined });
    }
  }),

  publishStudents: cmsProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) {
      return { success: false };
    }
    const { publishedIds, publishedBlocks } = await publishDraftBlocks(
      context.db,
      "students",
      userId
    );
    await cmsPublisher.publish("students-updated", {
      blocks: publishedBlocks,
    });
    return { success: true, publishedIds };
  }),
};
