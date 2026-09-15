import * as stylex from "@stylexjs/stylex";
import { ChevronLeft, ChevronRight, Clock, Minus, Plus } from "lucide-react";
import { useCallback, useSyncExternalStore, useState } from "react";

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
    padding: space.xs,
    borderRadius: "0.25rem",
    backgroundColor: color.surfaceSunken,
  },
  diffRow: {
    display: "flex",
    alignItems: "baseline",
    gap: space.xs,
    fontSize: font.size2xs,
    fontFamily: font.mono,
    lineHeight: font.leadingRelaxed,
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
});

/* -------------------------------------------------------------------- */
/*  Component                                                            */
/* -------------------------------------------------------------------- */

export const HistoryPopover = ({
  fetchHistory,
  onClose: _onClose,
}: {
  fetchHistory: (cursor: number) => Promise<HistoryResponse>;
  onClose?: () => void;
}) => {
  const [cursor, setCursor] = useState(0);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const snapshot = useSyncExternalStore(
    useCallback((l) => subscribeHistoryCache(cursor, l), [cursor]),
    useCallback(() => getHistorySnapshot(cursor), [cursor])
  );

  const loadPage = useCallback(
    async (c: number) => {
      setLoading(true);
      try {
        const result = await fetchHistoryPage(c, fetchHistory);
        setItems(result.items);
        setTotal(result.total);
      } catch {
        // errors surfaced via cache
      }
      setLoading(false);
    },
    [fetchHistory]
  );

  const data = snapshot ?? { items, nextCursor: null, total };
  const page = Math.floor(cursor / 10) + 1;
  const totalPages = Math.max(1, Math.ceil(data.total / 10));

  const goNext = useCallback(() => {
    const next = cursor + 10;
    setCursor(next);
    void loadPage(next);
  }, [cursor, loadPage]);

  const goPrev = useCallback(() => {
    const next = Math.max(0, cursor - 10);
    setCursor(next);
    void loadPage(next);
  }, [cursor, loadPage]);

  const renderList = () => {
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
              item.diffs.length > 0
                ? styles.itemBadgeSome
                : styles.itemBadgeNone
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
                <Minus aria-hidden="true" {...stylex.props(styles.diffIcon)} />
                <span {...stylex.props(styles.diffFrom)}>
                  {truncateValue(d.from)}
                </span>
                <Plus aria-hidden="true" {...stylex.props(styles.diffIcon)} />
                <span {...stylex.props(styles.diffTo)}>
                  {truncateValue(d.to)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </li>
    ));
  };

  return (
    <dialog open {...stylex.props(styles.panel)}>
      <div {...stylex.props(styles.head)}>
        <Clock aria-hidden="true" {...stylex.props(styles.headIcon)} />
        <p {...stylex.props(styles.headText)}>Version history</p>
        {data.total > 0 ? (
          <span {...stylex.props(styles.headCount)}>{data.total}</span>
        ) : null}
      </div>

      <ul {...stylex.props(styles.list)}>{renderList()}</ul>

      {totalPages > 1 ? (
        <div {...stylex.props(styles.footer)}>
          <span {...stylex.props(styles.pageLabel)}>
            Page {page} of {totalPages}
          </span>
          <div {...stylex.props(styles.pageNav)}>
            <button
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={goPrev}
              type="button"
              {...stylex.props(styles.pageButton)}
            >
              <ChevronLeft
                aria-hidden="true"
                {...stylex.props(styles.pageIcon)}
              />
            </button>
            <button
              aria-label="Next page"
              disabled={page >= totalPages}
              onClick={goNext}
              type="button"
              {...stylex.props(styles.pageButton)}
            >
              <ChevronRight
                aria-hidden="true"
                {...stylex.props(styles.pageIcon)}
              />
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
};
