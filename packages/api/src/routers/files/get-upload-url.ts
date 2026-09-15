import * as v from "valibot";

import { protectedProcedure } from "../../index";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PRESIGNED_URL_EXPIRY = 300;
const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024;

export const getUploadUrl = protectedProcedure
  .input(
    v.object({
      name: v.pipe(v.string(), v.minLength(1)),
      type: v.pipe(v.string(), v.minLength(1)),
      size: v.pipe(v.number(), v.minValue(1), v.maxValue(MAX_FILE_SIZE)),
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
