import { MemoryPublisher } from "@orpc/publisher/memory";

export interface CmsPageEvent {
  blocks: {
    id: string;
    hidden: boolean;
    fields: { id: string; value: string; aspectRatio?: number }[];
  }[];
}

export interface CmsEvents {
  "homepage-updated": CmsPageEvent;
  /**
   * The global Principal's Message block. Named per-channel like every other
   * page even though it is not a page, so an editor watching one screen is
   * never woken by a draft saved on another.
   */
  "principal-updated": CmsPageEvent;
  "about-updated": CmsPageEvent;
  "news-updated": CmsPageEvent;
  "notices-updated": CmsPageEvent;
  "contact-updated": CmsPageEvent;
  "alumni-updated": CmsPageEvent;
  "media-updated": CmsPageEvent;
  "students-updated": CmsPageEvent;
  [key: string]: object;
}

/**
 * Shared in-memory publisher for CMS real-time events.
 * All connected editor clients subscribe to this to receive live updates.
 */
export const cmsPublisher = new MemoryPublisher<CmsEvents>({
  resume: { enabled: true, seconds: 60 },
});
