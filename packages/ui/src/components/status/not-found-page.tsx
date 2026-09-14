import { ADMISSIONS_URL } from "../../content/home";
import { NotFoundArt } from "./status-illustration";
import { StatusChips, StatusPage } from "./status-page";
import type { StatusChip } from "./status-page";

/**
 * Shortcuts offered instead of the missing page. Deliberately the five sections
 * a mistyped or stale URL is most likely to have been aiming for - not the full
 * nav, which the header already carries.
 */
const SUGGESTIONS: readonly StatusChip[] = [
  { label: "About", href: "/about" },
  { label: "Admissions", href: ADMISSIONS_URL },
  { label: "News", href: "/news" },
  { label: "Academics", href: "/academics" },
  { label: "Contact", href: "/contact" },
];

/**
 * 404. The route must also send a real 404 status - a soft 404 (200 + this
 * page) gets the URL indexed and keeps broken links alive in search results.
 */
export const NotFoundPage = () => (
  <StatusPage
    art={<NotFoundArt />}
    description="The page you are looking for may have been moved, renamed, or is no longer part of the College website."
    eyebrow="Page not found"
    heading="Error 404 - we couldn't find that page."
    numeral="404"
    primaryAction={{ label: "Return to homepage", href: "/" }}
    secondaryAction={{ label: "Contact the College", href: "/contact" }}
  >
    <StatusChips items={SUGGESTIONS} label="Try instead" />
  </StatusPage>
);
