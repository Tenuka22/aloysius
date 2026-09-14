import { contentVersion } from "@aloysius/db/schema/cms";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../../index";

const blockFieldSchema = z.object({
  id: z.string(),
  value: z.string().optional(),
});

const blockSchema = z.object({
  id: z.string(),
  hidden: z.boolean().optional(),
  fields: z.array(blockFieldSchema).optional(),
});

// oRPC dynamic link for cache invalidation will be added here.
// See: https://orpc.dev/docs/client/dynamic-link

export const cmsRouter = {
  getHomepage: protectedProcedure.handler(async ({ context }) => {
    // Fetch the latest published version for each block on the homepage
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

    // Deduplicate: keep only the latest published version per block
    const seen = new Set<string>();
    const blocks: {
      id: string;
      hidden: boolean;
      fields: { id: string; value: string }[];
    }[] = [];

    for (const row of published) {
      if (seen.has(row.blockId)) {
        continue;
      }
      seen.add(row.blockId);

      const snapshot = JSON.parse(row.snapshot) as {
        hidden?: boolean;
        fields?: { id: string; value?: string }[];
      };
      blocks.push({
        id: row.blockId,
        hidden: snapshot.hidden ?? false,
        fields: snapshot.fields ?? [],
      });
    }

    return blocks.length > 0 ? { blocks } : null;
  }),

  updateHomepage: protectedProcedure
    .input(
      z.object({
        blocks: z.array(blockSchema),
      })
    )
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        return { success: false };
      }

      // Save a draft version for each changed block
      await Promise.all(
        input.blocks.map((block) =>
          context.db
            .insert(contentVersion)
            .values({
              id: crypto.randomUUID(),
              page: "homepage",
              blockId: block.id,
              action: "draft",
              snapshot: JSON.stringify(block),
              published: false,
              authorId: userId,
            })
            .run()
        )
      );

      return { success: true };
    }),

  publishHomepage: protectedProcedure.handler(async ({ context }) => {
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

    // Get the latest draft for each block and publish it
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

    const seen = new Set<string>();
    const toPublish = drafts.filter((draft) => {
      if (seen.has(draft.blockId)) {
        return false;
      }
      seen.add(draft.blockId);
      return true;
    });

    await Promise.all(
      toPublish.map((draft) =>
        context.db
          .update(contentVersion)
          .set({ published: true, action: "publish" })
          .where(eq(contentVersion.id, draft.id))
          .run()
      )
    );

    return { success: true };
  }),
};
