import { files, filesInsertSchema } from "@aloysius/db/schema/files";
import { pick } from "valibot";

import { adminProcedure } from "../../index";

export const completeUpload = adminProcedure
  .input(pick(filesInsertSchema, ["key", "name", "type", "size"]))
  .handler(async ({ input, context }) => {
    const id = input.key.split("/").pop()?.split(".")[0] ?? crypto.randomUUID();

    const record = await context.db
      .insert(files)
      .values({
        id,
        name: input.name,
        size: input.size,
        type: input.type,
        key: input.key,
        userId: context.session.user.id,
      })
      .returning()
      .get();

    return {
      id: record.id,
      name: record.name,
      size: record.size,
      type: record.type,
      url: `/api/files/${record.key}`,
      createdAt: record.createdAt.toISOString(),
    };
  });
