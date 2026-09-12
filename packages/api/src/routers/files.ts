import { files } from "@aloysius/db/schema/files";
import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import sharp from "sharp";
import { z } from "zod";

import { protectedProcedure } from "../index";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const WEBP_QUALITY = 82;
const IMAGE_TYPES: Record<string, true> = {
  "image/jpeg": true,
  "image/png": true,
  "image/gif": true,
  "image/webp": true,
  "image/avif": true,
  "image/bmp": true,
  "image/tiff": true,
};

const fileUrl = (key: string): string => `/api/files/${key}`;

export const filesRouter = {
  /**
   * Every uploaded image is normalized to webp (a broadly supported, small
   * format) here on the server, so callers never need to convert client-side
   * or branch on what a visitor actually uploaded.
   */
  uploadFile: protectedProcedure
    .input(z.file())
    .handler(async ({ input, context }) => {
      const file = input;
      if (file.size > MAX_FILE_SIZE) {
        throw new ORPCError("BAD_REQUEST", {
          message: "File size exceeds 10MB limit",
        });
      }

      const originalBuffer = Buffer.from(await file.arrayBuffer());
      const isImage = IMAGE_TYPES[file.type] === true;

      const { buffer, contentType, extension } = isImage
        ? {
            buffer: await sharp(originalBuffer)
              .webp({ quality: WEBP_QUALITY })
              .toBuffer(),
            contentType: "image/webp",
            extension: "webp",
          }
        : {
            buffer: originalBuffer,
            contentType: file.type || "application/octet-stream",
            extension: file.name.split(".").pop() || "bin",
          };

      const id = crypto.randomUUID();
      const key = `${context.session.user.id}/${id}.${extension}`;

      await context.storage.put(key, buffer, contentType);

      const record = await context.db
        .insert(files)
        .values({
          id,
          name: file.name,
          size: buffer.length,
          type: contentType,
          key,
          userId: context.session.user.id,
        })
        .returning()
        .get();

      return {
        id: record.id,
        name: record.name,
        size: record.size,
        type: record.type,
        url: fileUrl(record.key),
        createdAt: record.createdAt.toISOString(),
      };
    }),

  listFiles: protectedProcedure.handler(async ({ context }) => {
    const rows = await context.db
      .select()
      .from(files)
      .where(eq(files.userId, context.session.user.id))
      .orderBy(desc(files.createdAt))
      .all();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      size: row.size,
      type: row.type,
      url: fileUrl(row.key),
      createdAt: row.createdAt.toISOString(),
    }));
  }),

  deleteFile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const row = await context.db
        .select()
        .from(files)
        .where(
          and(eq(files.id, input.id), eq(files.userId, context.session.user.id))
        )
        .get();

      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "File not found" });
      }

      await context.storage.remove(row.key);
      await context.db
        .delete(files)
        .where(
          and(eq(files.id, input.id), eq(files.userId, context.session.user.id))
        )
        .run();

      return { success: true };
    }),
};
