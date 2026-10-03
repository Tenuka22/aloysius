import { createFileRoute } from "@tanstack/react-router";

import { auth, ensureServerBootstrap, getStorage } from "../../../services";

/**
 * Every image on the site, in and out.
 *
 * One route rather than two because storage (MinIO) is reachable from this
 * process and from nothing else: in Docker it answers to an internal hostname on
 * a port that is deliberately not published to the host, so a browser cannot
 * address it at all. Reads have always come through here; writes now do too,
 * rather than handing the browser a presigned URL pointing at a host it cannot
 * resolve.
 *
 * ## The key is not a free parameter
 *
 * The path segment names where the object lands, so a client that could choose
 * its own key could write anywhere in the bucket: over another user's file, or
 * outside the `admin/` prefix that everything else assumes. `getUploadUrl` mints
 * keys server-side, but nothing binds that call to this route — a PUT that skips
 * it entirely is still a valid HTTP request as far as this handler is concerned —
 * so the shape is enforced here as well.
 *
 * ## Why uploads are restricted to `admin/`
 *
 * Reads are deliberately open: the images on a public school website are public,
 * and gating them would break every page for no privacy gain. Writes are not.
 * Confining them to the one prefix means a compromised session cannot overwrite
 * an arbitrary object, and the accept pattern below is the whole of the check.
 */
const KEY_PATTERN = /^admin\/[0-9a-f-]{36}\.[a-z0-9]{1,10}$/u;

/** Must match `MAX_FILE_SIZE` in `packages/api/src/routers/files/get-upload-url.ts`. */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const notFound = () => new Response("Not found", { status: 404 });

/** Strip the leading `/api/files/` and decode what is left. */
const readKey = (pathname: string): string => {
  const raw = pathname.replace(/^\/api\/files\//u, "");
  try {
    return decodeURIComponent(raw);
  } catch {
    // A malformed escape sequence is not a key we hold, and letting it through
    // would just fail the pattern match further down.
    return "";
  }
};

const getStoredFile = async (key: string): Promise<Response> => {
  let stored: Awaited<ReturnType<ReturnType<typeof getStorage>["get"]>>;
  try {
    stored = await getStorage().get(key);
  } catch {
    return notFound();
  }

  if (!stored) {
    return notFound();
  }

  return new Response(new Uint8Array(stored.data), {
    headers: {
      "Content-Type": stored.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

const storeFile = async (key: string, request: Request): Promise<Response> => {
  await ensureServerBootstrap();

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!KEY_PATTERN.test(key)) {
    return notFound();
  }

  /*
   * Checked from the declared length, before the body is read. Measuring
   * afterwards would mean the limit only applied once the bytes had already been
   * accepted into memory, which is the opposite of what a size limit is for.
   *
   * A chunked request with no `Content-Length` is refused rather than waved
   * through unchecked: the honest options are to read it and measure, or not to
   * accept it, and this route takes the second.
   */
  const declared = Number(request.headers.get("content-length"));
  if (!Number.isFinite(declared) || declared < 1) {
    return new Response("A file size is required.", { status: 411 });
  }
  if (declared > MAX_FILE_SIZE) {
    return new Response("That file is too large.", { status: 413 });
  }

  const body = await request.arrayBuffer();
  if (body.byteLength === 0) {
    return new Response("The file was empty.", { status: 400 });
  }

  const contentType =
    request.headers.get("content-type")?.split(";")[0]?.trim() ??
    "application/octet-stream";

  try {
    await getStorage().put(key, new Uint8Array(body), contentType);
  } catch {
    // Deliberately vague: the operator cannot act on a MinIO error string, and
    // a detailed one leaks the bucket layout.
    return new Response("The file could not be stored.", { status: 502 });
  }

  return new Response(null, { status: 204 });
};

export const Route = createFileRoute("/api/files/$")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const key = readKey(new URL(request.url).pathname);
        if (!key) {
          return notFound();
        }
        return getStoredFile(key);
      },
      PUT: ({ request }) => {
        const key = readKey(new URL(request.url).pathname);
        if (!key) {
          return notFound();
        }
        return storeFile(key, request);
      },
    },
  },
});
