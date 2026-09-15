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
});

const blockSchema = z.object({
  id: z.string(),
  hidden: z.boolean().optional(),
  fields: z.array(blockFieldSchema).optional(),
});

export interface SnapshotBlock {
  id: string;
  hidden: boolean;
  fields: { id: string; value: string }[];
}

const parseSnapshot = (raw: string): SnapshotBlock => {
  const parsed = JSON.parse(raw) as {
    hidden?: boolean;
    fields?: { id: string; value?: string }[];
  };
  return {
    id: "",
    hidden: parsed.hidden ?? false,
    fields: (parsed.fields ?? []).map((f) => ({
      id: f.id,
      value: f.value ?? "",
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

// oRPC dynamic link for cache invalidation will be added here.
// See: https://orpc.dev/docs/client/dynamic-link

export const cmsRouter = {
  /** Fetch the latest published version for each block on the homepage. */
  getHomepage: publicProcedure.handler(async ({ context }) => {
    const published = await context.db
      .select()
      .from(contentVersion)
      .where(
        and(
          eq(contentVersion.page, "homepage"),
          eq(contentVersion.published, true)
        )
      )
      .orderBy(desc(contentVersion.createdAt))
      .all();

    const blocks = dedupeBlocks(published);
    return blocks.length > 0 ? { blocks } : null;
  }),

  /** Fetch the latest draft for each block on the homepage. */
  getHomepageDraft: protectedProcedure.handler(async ({ context }) => {
    const drafts = await context.db
      .select()
      .from(contentVersion)
      .where(
        and(
          eq(contentVersion.page, "homepage"),
          eq(contentVersion.action, "draft")
        )
      )
      .orderBy(desc(contentVersion.createdAt))
      .all();

    const blocks = dedupeBlocks(drafts);
    return blocks.length > 0 ? { blocks } : null;
  }),

  /**
   * Fetch all blocks for a page at the time of a specific version.
   * The versionId points to a contentVersion row — we use it to find the page,
   * then load the snapshot state of every block for that page at that point.
   */
  getHomepageVersion: publicProcedure
    .input(z.object({ versionId: z.string() }))
    .handler(async ({ context, input }) => {
      // Find the referenced version row to get the page
      const ref = await context.db
        .select()
        .from(contentVersion)
        .where(eq(contentVersion.id, input.versionId))
        .limit(1)
        .all();

      if (ref.length === 0) {
        return null;
      }

      const [firstRef] = ref;
      if (!firstRef) {
        return null;
      }
      const { page } = firstRef;

      // If this is a draft, load all current drafts for the page
      if (firstRef.action === "draft" && !firstRef.published) {
        const drafts = await context.db
          .select()
          .from(contentVersion)
          .where(
            and(
              eq(contentVersion.page, page),
              eq(contentVersion.action, "draft")
            )
          )
          .orderBy(desc(contentVersion.createdAt))
          .all();

        return { blocks: dedupeBlocks(drafts) };
      }

      // If published, load all published blocks as they were at the latest publish
      const published = await context.db
        .select()
        .from(contentVersion)
        .where(
          and(eq(contentVersion.page, page), eq(contentVersion.published, true))
        )
        .orderBy(desc(contentVersion.createdAt))
        .all();

      return { blocks: dedupeBlocks(published) };
    }),

  /**
   * History of published versions for the homepage.
   * Returns paginated snapshots grouped by publish date, with field-level
   * diffs between consecutive versions.
   */
  getHomepageHistory: protectedProcedure
    .input(z.object({ cursor: z.number().optional().default(0) }))
    .handler(async ({ context, input }) => {
      const PAGE_SIZE = 10;

      // Get all published rows (including currently-unpublished historical ones)
      const allPublished = await context.db
        .select()
        .from(contentVersion)
        .where(
          and(
            eq(contentVersion.page, "homepage"),
            eq(contentVersion.action, "publish")
          )
        )
        .orderBy(desc(contentVersion.createdAt))
        .all();

      // Group by unique publish timestamps (rows with same createdAt are from
      // the same batch publish operation). Sort descending by timestamp.
      const groups: {
        timestamp: number;
        versionId: string;
        blocks: SnapshotBlock[];
      }[] = [];
      const seenTimestamps = new Set<number>();

      for (const row of allPublished) {
        const ts = row.createdAt;
        if (seenTimestamps.has(ts)) {
          continue;
        }
        seenTimestamps.add(ts);

        const batch = allPublished.filter((r) => r.createdAt === ts);
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
      const page = groups.slice(input.cursor, input.cursor + PAGE_SIZE);

      // Build diffs: compare each group to the one after it (older)
      const items = page.map((group, idx) => {
        const prevGroup = page[idx + 1] ?? groups[input.cursor + PAGE_SIZE + 1];
        const prevBlockMap = new Map<string, SnapshotBlock>();
        if (prevGroup) {
          for (const b of prevGroup.blocks) {
            prevBlockMap.set(b.id, b);
          }
        }

        const diffs: {
          block: string;
          field: string;
          from: string;
          to: string;
        }[] = [];

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
        nextCursor:
          input.cursor + PAGE_SIZE < total ? input.cursor + PAGE_SIZE : null,
        total,
      };
    }),

  /**
   * Save a draft. Upserts: if a draft row already exists for a block, it is
   * updated in place; otherwise a new row is inserted. This keeps exactly one
   * draft row per block at any time. Returns the IDs of the saved rows so the
   * client can open a preview.
   */
  updateHomepage: cmsProcedure
    .input(z.object({ blocks: z.array(blockSchema) }))
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        return { success: false, draftIds: [] as string[] };
      }

      // Find existing drafts for these blocks
      const existing = await context.db
        .select()
        .from(contentVersion)
        .where(
          and(
            eq(contentVersion.page, "homepage"),
            eq(contentVersion.action, "draft")
          )
        )
        .all();

      const existingByBlock = new Map(
        existing.map((row) => [row.blockId, row])
      );

      const draftIds: string[] = [];

      await Promise.all(
        input.blocks.map((block) => {
          const snap = existingByBlock.get(block.id);
          if (snap) {
            draftIds.push(snap.id);
            // Update existing draft in place — same id, new snapshot
            return context.db
              .update(contentVersion)
              .set({ snapshot: JSON.stringify(block) })
              .where(eq(contentVersion.id, snap.id))
              .run();
          }
          // First draft for this block — insert
          const newId = crypto.randomUUID();
          draftIds.push(newId);
          return context.db
            .insert(contentVersion)
            .values({
              id: newId,
              page: "homepage",
              blockId: block.id,
              action: "draft",
              snapshot: JSON.stringify(block),
              published: false,
              authorId: userId,
            })
            .run();
        })
      );

      // Publish real-time event to all connected editors
      await cmsPublisher.publish("homepage-updated", {
        blocks: input.blocks.map((b) => ({
          id: b.id,
          hidden: b.hidden ?? false,
          fields: (b.fields ?? []).map((f) => ({
            id: f.id,
            value: f.value ?? "",
          })),
        })),
      });

      return { success: true, draftIds };
    }),

  /**
   * Real-time SSE stream for homepage snapshot changes.
   * Clients subscribe to receive live updates when any editor saves.
   */
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

  /**
   * Publish all current drafts. Creates NEW published rows for each draft
   * block, then deletes the draft rows.
   */
  publishHomepage: cmsProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) {
      return { success: false };
    }

    // Unpublish all current homepage blocks
    const current = await context.db
      .select()
      .from(contentVersion)
      .where(
        and(
          eq(contentVersion.page, "homepage"),
          eq(contentVersion.published, true)
        )
      )
      .all();

    await Promise.all(
      current.map((row) =>
        context.db
          .update(contentVersion)
          .set({ published: false })
          .where(eq(contentVersion.id, row.id))
          .run()
      )
    );

    // Get all current drafts
    const drafts = await context.db
      .select()
      .from(contentVersion)
      .where(
        and(
          eq(contentVersion.page, "homepage"),
          eq(contentVersion.action, "draft")
        )
      )
      .orderBy(desc(contentVersion.createdAt))
      .all();

    // Dedupe: keep latest draft per block
    const seen = new Set<string>();
    const toPublish = drafts.filter((draft) => {
      if (seen.has(draft.blockId)) {
        return false;
      }
      seen.add(draft.blockId);
      return true;
    });

    // Create new published rows
    const publishedIds: string[] = [];
    await Promise.all(
      toPublish.map((draft) => {
        const newId = crypto.randomUUID();
        publishedIds.push(newId);
        return context.db
          .insert(contentVersion)
          .values({
            id: newId,
            page: "homepage",
            blockId: draft.blockId,
            action: "publish",
            snapshot: draft.snapshot,
            published: true,
            authorId: userId,
          })
          .run();
      })
    );

    // Delete old draft rows
    await Promise.all(
      drafts.map((draft) =>
        context.db
          .delete(contentVersion)
          .where(eq(contentVersion.id, draft.id))
          .run()
      )
    );

    // Publish real-time event to all connected editors
    const publishedBlocks: SnapshotBlock[] = toPublish.map((draft) => {
      const snap = JSON.parse(draft.snapshot) as {
        hidden?: boolean;
        fields?: { id: string; value?: string }[];
      };
      return {
        id: draft.blockId,
        hidden: snap.hidden ?? false,
        fields: (snap.fields ?? []).map((f) => ({
          id: f.id,
          value: f.value ?? "",
        })),
      };
    });
    await cmsPublisher.publish("homepage-updated", {
      blocks: publishedBlocks,
    });

    return { success: true, publishedIds };
  }),
};
