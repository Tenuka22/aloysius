import * as stylex from "@stylexjs/stylex";
import { ChevronLeft, ChevronRight, Clock, Minus, Plus, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  useState,
} from "react";
import type { RefObject } from "react";

import { color, font, space } from "../../tokens/tokens.stylex";

export interface HistoryItem {
  versionId: string;
  timestamp: number;
  blockCount: number;
  diffs: { block: string; field: string; from: string; to: string }[];
}

export interface HistoryResponse {
  items: HistoryItem[];
  nextCursor: number | null;
  total: number;
}

const truncateValue = (v: string, max = 40) =>
  v.length > max ? `${v.slice(0, max)}` : v;

const formatDate = (ts: number) => {
  const d = new Date(ts);
  const day = d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day}, ${time}`;
};

/* -------------------------------------------------------------------- */
/*  Cache & subscriptions (module-level singleton)                       */
/* -------------------------------------------------------------------- */

type Listener = () => void;

const cache = new Map<string, HistoryResponse>();
const subs = new Map<string, Set<Listener>>();
let inflight: Map<string, Promise<HistoryResponse>> | null = null;

const emit = (key: string) => {
  const set = subs.get(key);
  if (!set) {
    return;
  }
  for (const fn of set) {
    fn();
  }
};

/**
 * Fetch a page of history and cache the result. Reuses in-flight requests
 * so rapid cursor changes don't fire duplicate network calls.
 */
// oxlint-disable-next-line react-doctor/only-export-components
export const fetchHistoryPage = async (
  cursor: number,
  fetcher: (cursor: number) => Promise<HistoryResponse>
): Promise<HistoryResponse> => {
  const key = String(cursor);
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  if (!inflight) {
    inflight = new Map();
  }
  const existing = inflight.get(key);
  if (existing) {
    return existing;
  }

  const promise = fetcher(cursor);
  inflight.set(key, promise);

  try {
    const data = await promise;
    cache.set(key, data);
    inflight?.delete(key);
    if (inflight?.size === 0) {
      inflight = null;
    }
    emit(key);
    return data;
  } catch (error) {
    inflight?.delete(key);
    if (inflight?.size === 0) {
      inflight = null;
    }
    throw error;
  }
};

// oxlint-disable-next-line react-doctor/only-export-components
export const subscribeHistoryCache = (
  cursor: number,
  onStoreChange: Listener
): (() => void) => {
  const key = String(cursor);
  if (!subs.has(key)) {
    subs.set(key, new Set());
  }
  subs.get(key)?.add(onStoreChange);
  return () => {
    subs.get(key)?.delete(onStoreChange);
  };
};

// oxlint-disable-next-line react-doctor/only-export-components
export const getHistorySnapshot = (cursor: number) => cache.get(String(cursor));

/** Matches the server's `PAGE_SIZE` in `getHomepageHistory`. */
const PAGE_SIZE = 10;

const EMPTY_RESPONSE: HistoryResponse = {
  items: [],
  nextCursor: null,
  total: 0,
};

/**
 * Shared cursor/loading state for a history list. Both the compact popover
 * and the full-history dialog read the same module-level cache, so paging
 * one keeps the other in sync without a duplicate fetch.
 */
const useHistoryPager = (
  fetchHistory: (cursor: number) => Promise<HistoryResponse>
) => {
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(true);

  const getSnapshot = useCallback(() => getHistorySnapshot(cursor), [cursor]);

  const snapshot = useSyncExternalStore(
    useCallback((l) => subscribeHistoryCache(cursor, l), [cursor]),
    getSnapshot,
    getSnapshot
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // oxlint-disable-next-line react/set-state-in-effect -- synchronizing
      // with the external fetch/cache; `loading` can't be derived at render
      // time since it tracks an in-flight network request.
      setLoading(true);
      try {
        await fetchHistoryPage(cursor, fetchHistory);
      } catch {
        // errors surfaced by the empty-state fallback below
      }
      if (!cancelled) {
        setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [cursor, fetchHistory]);

  const data = snapshot ?? EMPTY_RESPONSE;
  const page = Math.floor(cursor / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  const goNext = useCallback(() => {
    setCursor((c) => c + PAGE_SIZE);
  }, []);
  const goPrev = useCallback(() => {
    setCursor((c) => Math.max(0, c - PAGE_SIZE));
  }, []);

  return { data, loading, page, totalPages, goNext, goPrev, cursor };
};

/* -------------------------------------------------------------------- */
/*  Styles                                                               */
/* -------------------------------------------------------------------- */

const styles = stylex.create({
  panel: {
    position: "absolute",
    insetBlockStart: "100%",
    insetInlineEnd: 0,
    zIndex: 200,
    width: "24rem",
    maxHeight: "32rem",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    backgroundColor: color.surface,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
  },
  head: {
    display: "flex",
    alignItems: "center",
    gap: space.xs,
    padding: space.sm,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  headIcon: {
    width: "1rem",
    height: "1rem",
    color: color.onSurfaceMuted,
  },
  headText: {
    flex: 1,
    margin: 0,
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.onSurfaceMuted,
  },
  headCount: {
    fontSize: font.size2xs,
    color: color.onSurfaceSubtle,
  },
  list: {
    flex: 1,
    overflowY: "auto",
    overscrollBehavior: "contain",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  empty: {
    padding: space.lg,
    textAlign: "center",
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
  item: {
    padding: space.sm,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
    cursor: "default",
  },
  itemHead: {
    display: "flex",
    alignItems: "center",
    gap: space.xs,
    marginBlockEnd: space["2xs"],
  },
  itemTimestamp: {
    flex: 1,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    color: color.onSurface,
  },
  itemBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    paddingBlock: "0.125rem",
    paddingInline: space.xs,
    borderRadius: "0.25rem",
    fontSize: font.size2xs,
    fontWeight: font.weightSemibold,
    textTransform: "uppercase",
    letterSpacing: font.trackingWide,
  },
  itemBadgeNone: {
    backgroundColor: color.surfaceSunken,
    color: color.onSurfaceSubtle,
  },
  itemBadgeSome: {
    backgroundColor: "rgba(1,52,5,0.08)",
    color: color.accentOnSurface,
  },
  itemBlocks: {
    margin: 0,
    fontSize: font.size2xs,
    color: color.onSurfaceSubtle,
  },
  diffList: {
    display: "flex",
    flexDirection: "column",
    gap: space["3xs"],
    marginBlockStart: space.xs,
    padding: space["2xs"],
    borderRadius: "0.25rem",
    backgroundColor: color.surfaceSunken,
  },
  diffRow: {
    display: "flex",
    alignItems: "baseline",
    gap: space.xs,
    fontSize: font.size2xs,
    fontFamily: font.mono,
    lineHeight: font.leadingSnug,
  },
  diffField: {
    flexShrink: 0,
    fontWeight: font.weightBold,
    color: color.onSurfaceMuted,
    minWidth: "5rem",
    textAlign: "end",
  },
  diffFrom: {
    flex: 1,
    minWidth: 0,
    color: color.danger,
    textDecoration: "line-through",
    overflowWrap: "break-word",
  },
  diffTo: {
    flex: 1,
    minWidth: 0,
    color: color.accentOnSurface,
    overflowWrap: "break-word",
  },
  diffIcon: {
    flexShrink: 0,
    width: "0.75rem",
    height: "0.75rem",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: space.xs,
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.border,
  },
  pageLabel: {
    fontSize: font.size2xs,
    color: color.onSurfaceSubtle,
  },
  pageGroup: {
    display: "flex",
    alignItems: "center",
    gap: space.sm,
  },
  pageNav: {
    display: "flex",
    gap: space["2xs"],
  },
  pageButton: {
    display: "grid",
    placeItems: "center",
    width: "2rem",
    height: "2rem",
    padding: 0,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    borderRadius: "0.25rem",
    backgroundColor: {
      default: "transparent",
      ":hover": color.surfaceSunken,
    },
    color: {
      default: color.onSurface,
      ":disabled": color.onSurfaceSubtle,
    },
    cursor: {
      default: "pointer",
      ":disabled": "not-allowed",
    },
  },
  pageIcon: {
    width: "0.875rem",
    height: "0.875rem",
  },
  loading: {
    padding: space.lg,
    textAlign: "center",
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
  showFullButton: {
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    color: {
      default: color.accentOnSurface,
      ":hover": color.onSurface,
    },
    cursor: "pointer",
  },
  fullDialog: {
    position: "fixed",
    margin: 0,
    insetBlockStart: "50%",
    insetInlineStart: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 300,
    width: "min(40rem, 95vw)",
    maxHeight: "85dvh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    padding: 0,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    borderRadius: "0.25rem",
    boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
    "::backdrop": {
      backgroundColor: "rgba(1, 52, 5, 0.6)",
    },
  },
  fullDialogClosed: {
    // StyleX's compiled class outranks the UA `dialog:not([open])` rule, so
    // the modal would otherwise render (as a static flex box) the instant it
    // mounts, before `showModal()` ever runs. Force it hidden until `open`.
    display: "none",
  },
  fullHead: {
    display: "flex",
    alignItems: "center",
    gap: space.xs,
    padding: space.sm,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  fullClose: {
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    width: "2.25rem",
    height: "2.25rem",
    padding: 0,
    borderWidth: 0,
    backgroundColor: {
      default: "transparent",
      ":hover": color.surfaceSunken,
    },
    color: color.onSurfaceMuted,
    cursor: "pointer",
  },
});

/* -------------------------------------------------------------------- */
/*  Component                                                            */
/* -------------------------------------------------------------------- */

const renderHistoryList = (data: HistoryResponse, loading: boolean) => {
  if (loading && data.items.length === 0) {
    return <li {...stylex.props(styles.loading)}>Loading…</li>;
  }
  if (data.items.length === 0) {
    return <li {...stylex.props(styles.empty)}>No publish history yet.</li>;
  }
  return data.items.map((item) => (
    <li key={item.versionId} {...stylex.props(styles.item)}>
      <div {...stylex.props(styles.itemHead)}>
        <span {...stylex.props(styles.itemTimestamp)}>
          {formatDate(item.timestamp)}
        </span>
        <span
          {...stylex.props(
            styles.itemBadge,
            item.diffs.length > 0 ? styles.itemBadgeSome : styles.itemBadgeNone
          )}
        >
          {item.diffs.length} change{item.diffs.length === 1 ? "" : "s"}
        </span>
      </div>
      <p {...stylex.props(styles.itemBlocks)}>
        {item.blockCount} block{item.blockCount === 1 ? "" : "s"}
      </p>
      {item.diffs.length > 0 ? (
        <div {...stylex.props(styles.diffList)}>
          {item.diffs.map((d) => (
            <div
              key={`${d.block}-${d.field}`}
              {...stylex.props(styles.diffRow)}
            >
              <span {...stylex.props(styles.diffField)}>
                {d.field.split("-").slice(-1)}
              </span>
              {d.from ? (
                <>
                  <Minus
                    aria-hidden="true"
                    {...stylex.props(styles.diffIcon)}
                  />
                  <span {...stylex.props(styles.diffFrom)}>
                    {truncateValue(d.from)}
                  </span>
                </>
              ) : null}
              {d.to ? (
                <>
                  <Plus aria-hidden="true" {...stylex.props(styles.diffIcon)} />
                  <span {...stylex.props(styles.diffTo)}>
                    {truncateValue(d.to)}
                  </span>
                </>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </li>
  ));
};

const PaginationBar = ({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) => (
  <div {...stylex.props(styles.pageGroup)}>
    <span {...stylex.props(styles.pageLabel)}>
      Page {page} of {totalPages}
    </span>
    <div {...stylex.props(styles.pageNav)}>
      <button
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={onPrev}
        type="button"
        {...stylex.props(styles.pageButton)}
      >
        <ChevronLeft aria-hidden="true" {...stylex.props(styles.pageIcon)} />
      </button>
      <button
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={onNext}
        type="button"
        {...stylex.props(styles.pageButton)}
      >
        <ChevronRight aria-hidden="true" {...stylex.props(styles.pageIcon)} />
      </button>
    </div>
  </div>
);

export const HistoryPopover = ({
  fetchHistory,
  onClose,
  onShowFull,
  anchorRef,
}: {
  fetchHistory: (cursor: number) => Promise<HistoryResponse>;
  onClose?: () => void;
  onShowFull?: () => void;
  /** Element (e.g. the toggle button) excluded from outside-click detection. */
  anchorRef?: RefObject<HTMLElement | null>;
}) => {
  const { data, loading, page, totalPages, goNext, goPrev } =
    useHistoryPager(fetchHistory);

  const panelRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!onClose) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        anchorRef?.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, anchorRef]);

  return (
    <dialog open ref={panelRef} {...stylex.props(styles.panel)}>
      <div {...stylex.props(styles.head)}>
        <Clock aria-hidden="true" {...stylex.props(styles.headIcon)} />
        <p {...stylex.props(styles.headText)}>Version history</p>
        {data.total > 0 ? (
          <span {...stylex.props(styles.headCount)}>{data.total}</span>
        ) : null}
        {onClose ? (
          <button
            aria-label="Close version history"
            onClick={onClose}
            type="button"
            {...stylex.props(styles.fullClose)}
          >
            <X aria-hidden="true" {...stylex.props(styles.pageIcon)} />
          </button>
        ) : null}
      </div>

      <ul {...stylex.props(styles.list)}>{renderHistoryList(data, loading)}</ul>

      <div {...stylex.props(styles.footer)}>
        {totalPages > 1 ? (
          <PaginationBar
            onNext={goNext}
            onPrev={goPrev}
            page={page}
            totalPages={totalPages}
          />
        ) : null}
        {onShowFull && data.total > 0 ? (
          <button
            onClick={onShowFull}
            type="button"
            {...stylex.props(styles.showFullButton)}
          >
            See full history &rarr;
          </button>
        ) : null}
      </div>
    </dialog>
  );
};

/**
 * Full-screen modal for browsing the complete publish history. Shares the
 * module-level cache with `HistoryPopover`, so paging either one keeps both
 * in sync and avoids a duplicate fetch for a page already seen.
 */
export const HistoryDialog = ({
  fetchHistory,
  onClose,
  open,
}: {
  fetchHistory: (cursor: number) => Promise<HistoryResponse>;
  onClose: () => void;
  open: boolean;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { data, loading, page, totalPages, goNext, goPrev } =
    useHistoryPager(fetchHistory);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) {
      return;
    }
    if (open && !node.open) {
      node.showModal();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  return (
    <dialog
      aria-label="Full publish history"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      ref={dialogRef}
      {...stylex.props(styles.fullDialog, !open && styles.fullDialogClosed)}
    >
      <div {...stylex.props(styles.fullHead)}>
        <Clock aria-hidden="true" {...stylex.props(styles.headIcon)} />
        <p {...stylex.props(styles.headText)}>Version history</p>
        {data.total > 0 ? (
          <span {...stylex.props(styles.headCount)}>{data.total}</span>
        ) : null}
        <button
          aria-label="Close version history"
          onClick={onClose}
          type="button"
          {...stylex.props(styles.fullClose)}
        >
          <X aria-hidden="true" {...stylex.props(styles.pageIcon)} />
        </button>
      </div>

      <ul {...stylex.props(styles.list)}>{renderHistoryList(data, loading)}</ul>

      {totalPages > 1 ? (
        <div {...stylex.props(styles.footer)}>
          <PaginationBar
            onNext={goNext}
            onPrev={goPrev}
            page={page}
            totalPages={totalPages}
          />
        </div>
      ) : null}
    </dialog>
  );
};
