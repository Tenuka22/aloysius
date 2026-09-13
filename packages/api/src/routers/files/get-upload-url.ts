import { z } from "zod";

import { adminProcedure } from "../../index";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PRESIGNED_URL_EXPIRY = 300;
const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024;

export const getUploadUrl = adminProcedure
  .input(
    z.object({
      name: z.string().min(1),
      type: z.string().min(1),
      size: z.number().positive().max(MAX_FILE_SIZE),
    })
  )
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();
    const extension = input.name.split(".").pop() || "bin";
    const key = `admin/${id}.${extension}`;

    const uploadUrl = await context.storage.getPresignedUploadUrl(
      key,
      input.type,
      PRESIGNED_URL_EXPIRY
    );

    return {
      uploadUrl,
      key,
      id,
      expiresInSeconds: PRESIGNED_URL_EXPIRY,
      largeFile: input.size > LARGE_FILE_THRESHOLD,
    };
  });
