import type { ImageSource } from "../components/primitives/media";

/**
 * A person the College publishes as leading something.
 *
 * Read by `/about` from `cms.listAcademicHeads` and written at
 * `/cms/academic-heads`. The fields mirror the `person` table exactly, and
 * `image` is the `ImageSource` form of the router's flat `imageUrl` - the same
 * bridge `/results` does for its students.
 */
export interface AcademicHead {
  id: string;
  /** Stable identifier, unique across people. */
  slug: string;
  name: string;
  /** "Head of Physics". Shown above the name, because it is what is scanned. */
  role: string | null;
  bio: string | null;
  image?: ImageSource;
}
