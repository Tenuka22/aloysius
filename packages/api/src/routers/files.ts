import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createDb } from "@web-template/db";
import { files } from "@web-template/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../index";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const filesRouter = {
  uploadFile: protectedProcedure
    .input(z.file())
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      if (input.size > MAX_FILE_SIZE) {
        throw new ORPCError("BAD_REQUEST", {
          message: "File size exceeds 10MB limit",
        });
      }

      const id = crypto.randomUUID();
      const file = input as File;
      const ext = file.name.split(".").pop() ?? "";
      const key = `${context.auth.userId}/${id}${ext ? `.${ext}` : ""}`;

      if (!context.bucket) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Storage not available",
        });
      }

      await context.bucket.put(key, input as unknown as Blob, {
        httpMetadata: { contentType: input.type },
      });

      const db = createDb();
      const record = await db
        .insert(files)
        .values({
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          key,
          userId: context.auth.userId,
        })
        .returning()
        .get();

      return {
        id: record.id,
        name: record.name,
        size: record.size,
        type: record.type,
        url: `${context.r2PublicUrl}/${record.key}`,
        createdAt: record.createdAt.toISOString(),
      };
    }),

  listFiles: protectedProcedure.handler(async ({ context }) => {
    if (!context.auth?.userId) {
      throw new ORPCError("UNAUTHORIZED");
    }

    const db = createDb();
    const rows = await db
      .select()
      .from(files)
      .where(eq(files.userId, context.auth.userId))
      .all();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      size: row.size,
      type: row.type,
      url: `${context.r2PublicUrl}/${row.key}`,
      createdAt: row.createdAt.toISOString(),
    }));
  }),

  deleteFile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      if (!context.auth?.userId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      const db = createDb();
      const row = await db
        .select()
        .from(files)
        .where(and(eq(files.id, input.id), eq(files.userId, context.auth.userId)))
        .get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "File not found" });
      }

      if (context.bucket) {
        await context.bucket.delete(row.key);
      }

      await db
        .delete(files)
        .where(and(eq(files.id, input.id), eq(files.userId, context.auth.userId)))
        .run();

      return { success: true };
    }),
};
