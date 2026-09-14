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
  getHomepage: protectedProcedure.handler(() => null),

  updateHomepage: protectedProcedure
    .input(
      z.object({
        blocks: z.array(blockSchema),
      })
    )
    .handler(({ input }) => ({ success: true, blocks: input.blocks })),

  publishHomepage: protectedProcedure.handler(() => ({ success: true })),
};
