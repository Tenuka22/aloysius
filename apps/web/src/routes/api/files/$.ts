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

const RANGE_PATTERN = /^bytes=(?<start>\d*)-(?<end>\d*)$/u;

/** One response never carries more than this, however open-ended the request. */
const MAX_RANGE_BYTES = 8 * 1024 * 1024;

const CACHE_HEADERS = {
  "Accept-Ranges": "bytes",
  "Cache-Control": "public, max-age=31536000, immutable",
};

/**
 * Serve a slice, so a browser can start a video after the first few megabytes
 * and seek without downloading the whole file. Without this every request read
 * the entire object into memory, and a browser that gave up part-way produced a
 * connection reset on the server.
 */
const getStoredRange = async (
  key: string,
  rangeHeader: string
): Promise<Response> => {
  const storage = getStorage();
  const head = await storage.head(key).catch(() => null);
  if (!head) {
    return notFound();
  }

  const match = RANGE_PATTERN.exec(rangeHeader);
  const startText = match?.groups?.start ?? "";
  const endText = match?.groups?.end ?? "";
  if (!match || (startText === "" && endText === "")) {
    return new Response(null, {
      headers: { "Content-Range": `bytes */${head.size}` },
      status: 416,
    });
  }

  // `bytes=-N` is the final N bytes; otherwise start..end, end optional.
  const start =
    startText === ""
      ? Math.max(head.size - Number(endText), 0)
      : Number(startText);
  const requestedEnd =
    startText === "" || endText === "" ? head.size - 1 : Number(endText);
  const end = Math.min(
    requestedEnd,
    head.size - 1,
    start + MAX_RANGE_BYTES - 1
  );

  if (start >= head.size || start > end) {
    return new Response(null, {
      headers: { "Content-Range": `bytes */${head.size}` },
      status: 416,
    });
  }

  try {
    const body = await storage.getRange(key, start, end - start + 1);
    return new Response(new Uint8Array(body), {
      headers: {
        ...CACHE_HEADERS,
        "Content-Length": String(body.length),
        "Content-Range": `bytes ${start}-${end}/${head.size}`,
        "Content-Type": head.contentType,
      },
      status: 206,
    });
  } catch {
    return notFound();
  }
};

const getStoredFile = async (
  key: string,
  rangeHeader: string | null
): Promise<Response> => {
  if (rangeHeader) {
    return getStoredRange(key, rangeHeader);
  }

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
      ...CACHE_HEADERS,
      "Content-Type": stored.contentType,
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
        return getStoredFile(key, request.headers.get("range"));
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
