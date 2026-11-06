import type { ImageSource } from "../components/primitives/media";

/**
 * A person the College publishes as part of its leadership.
 *
 * The Principal comes from the global Principal block; everyone else is read
 * by `/about` from `cms.listAcademicHeads` and written at
 * `/cms/academic-heads`. The fields mirror the `person` table, and `image` is
 * the `ImageSource` form of the router's flat `imageUrl`.
 */
export interface LeadershipPerson {
  id: string;
  name: string;
  /** "Vice Principal". Shown under the name. */
  role: string | null;
  image?: ImageSource;
}
