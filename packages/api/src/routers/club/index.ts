import { listApprovedPhotos } from "./list-approved-photos";
import { listMyPhotos } from "./list-my-photos";
import { listPendingPhotos } from "./list-pending-photos";
import { reviewPhoto } from "./review-photo";
import { setPhotoLink } from "./set-photo-link";
import { submitPhoto } from "./submit-photo";
import { withdrawPhoto } from "./withdraw-photo";

/**
 * Photography club submissions. Announcements, events and news posts used to
 * live here too, one submit/review/list/withdraw set per content type - they
 * are CMS-managed content now (`cmsRouter`'s `*Announcement`/`*Event`/
 * `*NewsPost` endpoints), not a club submission queue, so this barrel is
 * photos only.
 */
export const clubRouter = {
  submitPhoto,
  listMyPhotos,
  withdrawPhoto,
  listPendingPhotos,
  reviewPhoto,
  setPhotoLink,
  listApprovedPhotos,
};
