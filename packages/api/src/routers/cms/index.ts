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
 * Publish all current drafts for a page. Creates NEW published rows for each
 * draft block (so the publish history keeps every version), then deletes the
 * draft rows.
 */
const publishDraftBlocks = async (
  db: Database,
  page: string,
  userId: string
): Promise<{ publishedIds: string[]; publishedBlocks: SnapshotBlock[] }> => {
  const current = await db
    .select()
    .from(contentVersion)
    .where(
      and(eq(contentVersion.page, page), eq(contentVersion.published, true))
    )
    .all();

  await Promise.all(
    current.map((row) =>
      db
        .update(contentVersion)
        .set({ published: false })
        .where(eq(contentVersion.id, row.id))
        .run()
    )
  );

  const drafts = await db
    .select()
    .from(contentVersion)
    .where(
      and(eq(contentVersion.page, page), eq(contentVersion.action, "draft"))
    )
    .orderBy(desc(contentVersion.createdAt))
    .all();

  const seen = new Set<string>();
  const toPublish = drafts.filter((draft) => {
    if (seen.has(draft.blockId)) {
      return false;
    }
    seen.add(draft.blockId);
    return true;
  });

  const publishedIds: string[] = [];
  await Promise.all(
    toPublish.map((draft) => {
      const newId = crypto.randomUUID();
      publishedIds.push(newId);
      return db
        .insert(contentVersion)
        .values({
          id: newId,
          page,
          blockId: draft.blockId,
          action: "publish",
          snapshot: draft.snapshot,
          published: true,
          authorId: userId,
        })
        .run();
    })
  );

  await Promise.all(
    drafts.map((draft) =>
      db.delete(contentVersion).where(eq(contentVersion.id, draft.id)).run()
    )
  );

  const publishedBlocks: SnapshotBlock[] = toPublish.map((draft) => {
    const snap = JSON.parse(draft.snapshot) as {
      hidden?: boolean;
      fields?: { id: string; value?: string; aspectRatio?: number }[];
    };
    return {
      id: draft.blockId,
      hidden: snap.hidden ?? false,
      fields: (snap.fields ?? []).map((f) => ({
        id: f.id,
        value: f.value ?? "",
        ...(f.aspectRatio ? { aspectRatio: f.aspectRatio } : {}),
      })),
    };
  });

  return { publishedIds, publishedBlocks };
};

/**
 * History of published versions for a page. Returns paginated snapshots
 * grouped by publish date, with field-level diffs between consecutive
 * versions.
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

  // Group by unique publish timestamps (rows with same createdAt are from the
  // same batch publish operation). Sort descending by timestamp.
  const groups: {
    timestamp: number;
    versionId: string;
    blocks: SnapshotBlock[];
  }[] = [];
  const seenTimestamps = new Set<number>();

  for (const row of allPublished) {
    const ts = row.createdAt.getTime();
    if (seenTimestamps.has(ts)) {
      continue;
    }
    seenTimestamps.add(ts);

    const batch = allPublished.filter((r) => r.createdAt.getTime() === ts);
    groups.push({
      timestamp: ts,
      versionId: row.id,
      blocks: batch.map((b) => {
        const snap = parseSnapshot(b.snapshot);
        snap.id = b.blockId;
        return snap;
      }),
    });
  }

  const total = groups.length;
  const page_ = groups.slice(cursor, cursor + PAGE_SIZE);

  // Build diffs: compare each group to the one after it (older)
  const items = page_.map((group, idx) => {
    const prevGroup = page_[idx + 1] ?? groups[cursor + PAGE_SIZE + 1];
    const prevBlockMap = new Map<string, SnapshotBlock>();
    if (prevGroup) {
      for (const b of prevGroup.blocks) {
        prevBlockMap.set(b.id, b);
      }
    }

    const diffs: { block: string; field: string; from: string; to: string }[] =
      [];

    if (prevGroup) {
      for (const block of group.blocks) {
        const prevBlock = prevBlockMap.get(block.id);
        const prevFieldMap = new Map<string, string>();
        if (prevBlock) {
          for (const f of prevBlock.fields) {
            prevFieldMap.set(f.id, f.value);
          }
        }
        for (const field of block.fields) {
          const prevValue = prevFieldMap.get(field.id) ?? "";
          if (field.value !== prevValue) {
            diffs.push({
              block: block.id,
              field: field.id,
              from: prevValue,
              to: field.value,
            });
          }
        }
      }
    }

    return {
      versionId: group.versionId,
      timestamp: group.timestamp,
      blockCount: group.blocks.length,
      diffs,
    };
  });

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
