import { createGallery } from "./create-gallery";
import { listApprovedGalleries } from "./list-approved-galleries";
import { listMyGalleries } from "./list-my-galleries";
import { listPendingGalleries } from "./list-pending-galleries";
import { reviewGallery } from "./review-gallery";
import { setGalleryLink } from "./set-gallery-link";
import { withdrawGallery } from "./withdraw-gallery";

/**
 * Photography club submissions. Review used to happen per-photo; it is
 * per-gallery now - a gallery is a title plus a batch of photos, and a CMS
 * reviewer approves or rejects the whole thing at once. Announcements,
 * events and news posts are CMS-managed content (`cmsRouter`'s
 * `*Announcement`/`*Event`/`*NewsPost` endpoints), not a club submission
 * queue, so this barrel is galleries only.
 */
export const clubRouter = {
  createGallery,
  listMyGalleries,
  withdrawGallery,
  listPendingGalleries,
  reviewGallery,
  setGalleryLink,
  listApprovedGalleries,
};
