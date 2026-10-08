import { listApprovedAnnouncements } from "./list-approved-announcements";
import { listApprovedEvents } from "./list-approved-events";
import { listApprovedNewsPosts } from "./list-approved-news-posts";
import { listApprovedPhotos } from "./list-approved-photos";
import { listMyAnnouncements } from "./list-my-announcements";
import { listMyEvents } from "./list-my-events";
import { listMyNewsPosts } from "./list-my-news-posts";
import { listMyPhotos } from "./list-my-photos";
import { listPendingAnnouncements } from "./list-pending-announcements";
import { listPendingEvents } from "./list-pending-events";
import { listPendingNewsPosts } from "./list-pending-news-posts";
import { listPendingPhotos } from "./list-pending-photos";
import { reviewAnnouncement } from "./review-announcement";
import { reviewEvent } from "./review-event";
import { reviewNewsPost } from "./review-news-post";
import { reviewPhoto } from "./review-photo";
import { submitAnnouncement } from "./submit-announcement";
import { submitEvent } from "./submit-event";
import { submitNewsPost } from "./submit-news-post";
import { submitPhoto } from "./submit-photo";
import { withdrawAnnouncement } from "./withdraw-announcement";
import { withdrawEvent } from "./withdraw-event";
import { withdrawNewsPost } from "./withdraw-news-post";
import { withdrawPhoto } from "./withdraw-photo";

export const clubRouter = {
  submitPhoto,
  listMyPhotos,
  withdrawPhoto,
  listPendingPhotos,
  reviewPhoto,
  listApprovedPhotos,
  submitAnnouncement,
  listMyAnnouncements,
  withdrawAnnouncement,
  listPendingAnnouncements,
  reviewAnnouncement,
  listApprovedAnnouncements,
  submitEvent,
  listMyEvents,
  withdrawEvent,
  listPendingEvents,
  reviewEvent,
  listApprovedEvents,
  submitNewsPost,
  listMyNewsPosts,
  withdrawNewsPost,
  listPendingNewsPosts,
  reviewNewsPost,
  listApprovedNewsPosts,
};
