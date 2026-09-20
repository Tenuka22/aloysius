import { useSyncExternalStore } from "react";

import { client } from "@/utils/orpc";

interface Block {
  id: string;
  hidden: boolean;
  fields: { id: string; value: string; aspectRatio?: number }[];
}

interface LiveBlocksState {
  blocks: Block[];
  highlightedFields: Record<string, number>;
}

let cachedState: LiveBlocksState = { blocks: [], highlightedFields: {} };
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

let subscriptionStarted = false;

const clearHighlights = () => {
  cachedState = { blocks: cachedState.blocks, highlightedFields: {} };
  notify();
};

const processEvent = (event: unknown) => {
  const { blocks } = event as { blocks: Block[] };

  const now = Date.now();
  const highlighted: Record<string, number> = {};
  for (const block of blocks) {
    for (const field of block.fields) {
      highlighted[field.id] = now;
    }
  }

  cachedState = { blocks, highlightedFields: highlighted };
  notify();

  setTimeout(clearHighlights, 2000);
};

const startSubscription = () => {
  if (subscriptionStarted) {
    return;
  }
  subscriptionStarted = true;

  (async () => {
    try {
      const iterator = await client.cms.watchHomepage();
      // biome-ignore lint/correctness/noUnusedVariables: SSE subscription
      for await (const event of iterator) {
        processEvent(event);
      }
    } catch {
      subscriptionStarted = false;
    }
  })();
};

// oxlint-disable promise/prefer-await-to-callbacks -- useSyncExternalStore requires a callback-based subscribe
const subscribe = (callback: () => void) => {
  listeners.add(callback);
  startSubscription();
  return () => {
    listeners.delete(callback);
  };
};

const getSnapshot = () => cachedState;
const getServerSnapshot = (): LiveBlocksState => ({
  blocks: [],
  highlightedFields: {},
});

/**
 * Subscribes to real-time homepage block updates via SSE.
 * Returns the latest blocks and which fields were just updated.
 * Uses useSyncExternalStore — no useEffect needed.
 */
export const useLiveHomepageBlocks = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
