import { MemoryPublisher } from "@orpc/publisher/memory";

export interface CmsEvents {
  "homepage-updated": {
    blocks: {
      id: string;
      hidden: boolean;
      fields: { id: string; value: string }[];
    }[];
  };
  [key: string]: object;
}

/**
 * Shared in-memory publisher for CMS real-time events.
 * All connected editor clients subscribe to this to receive live updates.
 */
export const cmsPublisher = new MemoryPublisher<CmsEvents>({
  resume: { enabled: true, seconds: 60 },
});
