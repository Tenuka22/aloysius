import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import type { NavItem } from "../../content/home";
import { RESULT_YEARS, RESULTS_BY_YEAR } from "../../content/results";
import type { YearResults } from "../../content/results";
import { SkipLink } from "../primitives/layout";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { ResultsHero } from "./results-hero";
import {
  AlRankers,
  NineAchievers,
  ResultsSummary,
  ScholarshipPassers,
} from "./results-sections";

const MAIN_ID = "main-content";
const NO_RESULTS: YearResults = {};

const styles = stylex.create({
  // The skip-link target is focusable, so suppress only its own focus ring.
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
});

export interface ResultsPageProps {
  contact?: FooterContact;
  extraNavItems?: readonly NavItem[];
  /** Newest first. */
  years?: readonly string[];
  results?: Readonly<Record<string, YearResults>>;
}

export const ResultsPage = ({
  contact,
  extraNavItems,
  years = RESULT_YEARS,
  results = RESULTS_BY_YEAR,
}: ResultsPageProps) => {
  const [year, setYear] = useState(years[0] ?? "");
  const data = results[year] ?? NO_RESULTS;

  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <SiteHeader activeHref="/academics" extraNavItems={extraNavItems} />
      <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
        <ResultsHero onYearChange={setYear} year={year} years={years} />
        <ResultsSummary data={data} />
        <AlRankers data={data} year={year} />
        <NineAchievers data={data} year={year} />
        <ScholarshipPassers data={data} year={year} />
      </main>
      <SiteFooter contact={contact} />
    </>
  );
};
