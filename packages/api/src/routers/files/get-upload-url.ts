import * as v from "valibot";

import { protectedProcedure } from "../../index";

/**
 * The extension a minted key carries, or `bin`.
 *
 * Taken from the last dot of the name and then *reduced to what the key pattern
 * allows* - lowercase alphanumerics only, up to ten characters. It used to be
 * whatever followed the last dot, so a name like `photo.a/b` produced
 * `admin/<uuid>.a/b`: a key the PUT route rejects, which meant the client got a
 * URL it was then forbidden to use. Sanitising here means a client cannot be
 * handed an unusable key.
 */
const extensionOf = (name: string): string => {
  const candidate = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  const safe = candidate.replaceAll(/[^a-z0-9]/gu, "");
  return safe.length > 0 && safe.length <= 10 ? safe : "bin";
};

export const getUploadUrl = protectedProcedure
  .input(
    v.object({
      name: v.pipe(v.string(), v.minLength(1)),
      type: v.pipe(v.string(), v.minLength(1)),
      size: v.pipe(v.number(), v.minValue(1)),
    })
  )
  .handler(({ input }) => {
    const id = crypto.randomUUID();
    const key = `admin/${id}.${extensionOf(input.name)}`;

    /*
     * A path on this app, not a presigned MinIO URL.
     *
     * MinIO answers to the hostname `minio` inside the compose network and that
     * port is not published to the host, so a URL pointing at it is unreachable
     * from a browser. Handing back a same-origin path means the client PUTs to
     * `/api/files/$`, which is already the only thing that can reach storage —
     * the same route that serves every image back out.
     */
    return {
      uploadUrl: `/api/files/${key}`,
      key,
      id,
    };
  });
