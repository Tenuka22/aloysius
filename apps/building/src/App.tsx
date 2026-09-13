import * as stylex from "@stylexjs/stylex";
import { useEffect } from "react";

import { syncAdmissionsCookiesToSharedDomain } from "./lib/sync-admissions-cookies";

const ADMISSIONS_URL = "https://admissions.aloysiuscollege.lk";

const CREAM = "#fff8e7";
const GREEN_DARK = "#013405";
const GOLD = "#ffb203";

const styles = stylex.create({
  page: {
    display: "flex",
    minHeight: "100vh",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GREEN_DARK,
    paddingBlock: "4rem",
    paddingInline: "2rem",
    textAlign: "center",
  },
  content: {
    display: "flex",
    maxWidth: "36rem",
    flexDirection: "column",
    alignItems: "center",
  },
  crest: {
    marginBottom: "2rem",
    height: "6rem",
    width: "6rem",
    objectFit: "contain",
  },
  established: {
    margin: 0,
    marginBottom: "1rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: GOLD,
  },
  heading: {
    margin: 0,
    fontFamily: "'Libre Baskerville Variable', serif",
    fontWeight: 300,
    lineHeight: 1.15,
    color: CREAM,
    fontSize: {
      default: "3rem",
      "@media (min-width: 640px)": "3.75rem",
    },
  },
  location: {
    margin: 0,
    marginTop: "0.75rem",
    fontSize: "0.75rem",
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    color: "rgba(255, 248, 231, 0.7)",
  },
  divider: {
    marginBlock: "1.5rem",
    height: "2px",
    width: "4rem",
    backgroundColor: GOLD,
  },
  underConstruction: {
    margin: 0,
    marginBottom: "0.75rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    color: GOLD,
  },
  enquiries: {
    margin: 0,
    marginBottom: "2.5rem",
    fontFamily: "'Libre Baskerville Variable', serif",
    fontStyle: "italic",
    color: "rgba(255, 248, 231, 0.9)",
    fontSize: {
      default: "1.125rem",
      "@media (min-width: 640px)": "1.25rem",
    },
  },
  cta: {
    backgroundColor: GOLD,
    paddingBlock: "1rem",
    paddingInline: "2.5rem",
    fontFamily: "Poppins, sans-serif",
    fontWeight: 700,
    letterSpacing: "0.025em",
    color: GREEN_DARK,
    textDecoration: "none",
    transitionProperty: "transform, box-shadow",
    transitionDuration: "150ms",
    transform: {
      default: "translateY(0)",
      ":hover": "translateY(-2px)",
    },
    boxShadow: {
      default: "none",
      ":hover": "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
    },
  },
  footer: {
    marginTop: "3rem",
    fontSize: "0.75rem",
    letterSpacing: "0.025em",
    color: "rgba(255, 248, 231, 0.4)",
  },
});

export default function App() {
  useEffect(() => {
    syncAdmissionsCookiesToSharedDomain();
  }, []);

  // Forward the exact path an old bookmarked/shared link used (e.g.
  // `/application?key=...`) instead of dropping it and sending everyone to the bare
  // admissions homepage - the admissions app serves the same routes at this origin,
  // so an old deep link still resolves to the right place.
  const admissionsHref = `${ADMISSIONS_URL}${window.location.pathname}${window.location.search}`;

  return (
    <div {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.content)}>
        <img
          src="/logo.png"
          alt="St. Aloysius' College Crest"
          {...stylex.props(styles.crest)}
        />
        <p {...stylex.props(styles.established)}>Estd. 1862</p>
        <h1 {...stylex.props(styles.heading)}>St. Aloysius' College</h1>
        <p {...stylex.props(styles.location)}>Galle &bull; Sri Lanka</p>
        <div {...stylex.props(styles.divider)} />
        <p {...stylex.props(styles.underConstruction)}>
          Our new website is being built
        </p>
        <p {...stylex.props(styles.enquiries)}>
          For admissions enquiries, please visit our admissions portal.
        </p>
        <a
          href={admissionsHref}
          target="_blank"
          rel="noopener noreferrer"
          {...stylex.props(styles.cta)}
        >
          Go to Admissions
        </a>
        <footer {...stylex.props(styles.footer)}>
          &copy; St. Aloysius' College, Galle
        </footer>
      </div>
    </div>
  );
}
