import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import type { ResultsHeroContentProps } from "../../content/cms-to-pages";
import type { NavItem } from "../../content/home";
import type { YearResults } from "../../content/results";
import { Container, Section, SkipLink } from "../primitives/layout";
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

/*
 * Hoisted so the "nothing published" defaults are the same reference on every
 * render. As inline literals in the parameter list they were a new array and a
 * new object each time, which re-renders the whole page for nothing.
 */
const NO_YEARS: readonly string[] = [];
const NO_PUBLISHED_RESULTS: Readonly<Record<string, YearResults>> = {};

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
  /**
   * Published examination years, newest first. These are the years that exist
   * in the database, not a hardcoded list - see the route.
   */
  years?: readonly string[];
  results?: Readonly<Record<string, YearResults>>;
  hero?: ResultsHeroContentProps;
}

export const ResultsPage = ({
  contact,
  extraNavItems,
  years = NO_YEARS,
  results = NO_PUBLISHED_RESULTS,
  hero,
}: ResultsPageProps) => {
  const [year, setYear] = useState(years[0] ?? "");
  const data = results[year] ?? NO_RESULTS;

  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <SiteHeader activeHref="/academics" extraNavItems={extraNavItems} />
      <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
        <ResultsHero
          eyebrow={hero?.eyebrow}
          heading={hero?.heading}
          onYearChange={setYear}
          tagline={hero?.tagline}
          year={year}
          years={years}
        />
        {/*
          One empty state for "no year has been published", rather than four
          tabs that each say this year has no results. The old page listed
          2022-2025 from a constant while `RESULTS_BY_YEAR` was empty, so it
          offered a visitor four years and then reported that none of them had
          happened.
        */}
        {years.length === 0 ? (
          <Section tone="surface">
            <Container>
              <p>
                No examination results have been published yet. Results appear
                here as soon as the College publishes them.
              </p>
            </Container>
          </Section>
        ) : (
          <>
            <ResultsSummary data={data} />
            <AlRankers data={data} year={year} />
            <NineAchievers data={data} year={year} />
            <ScholarshipPassers data={data} year={year} />
          </>
        )}
      </main>
      <SiteFooter contact={contact} />
    </>
  );
};
