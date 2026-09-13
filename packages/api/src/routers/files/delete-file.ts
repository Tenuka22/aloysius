import { files } from "@aloysius/db/schema/files";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure } from "../../index";

export const deleteFile = adminProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const row = await context.db
      .select()
      .from(files)
      .where(eq(files.id, input.id))
      .get();

    if (!row) {
      throw new ORPCError("NOT_FOUND", { message: "File not found" });
    }

    // 1. Remove the DB record first — source of truth.
    await context.db.delete(files).where(eq(files.id, input.id)).run();

    // 2. Best-effort storage cleanup. If this fails the orphaned object
    //    can be reaped by a background job; the DB is already consistent.
    await context.storage.remove(row.key).catch((error) => {
      console.error(
        "[files] storage cleanup failed, orphaned key:",
        row.key,
        error
      );
    });

    return { success: true };
  });
