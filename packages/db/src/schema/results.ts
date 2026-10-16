import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import * as v from "valibot";

import { user } from "./auth";
import { brand } from "./brand";
import type { Brand } from "./brand";
import { files } from "./files";

/**
 * Examination results: what the College published, year by year.
 *
 * These were a typed file (`content/results.ts`, `RESULTS_BY_YEAR = {}`) and
 * every public route reached past the CMS to read them. That is fine for copy
 * and wrong for facts: a pass rate is entered once a year by whoever the
 * College hands the figures to, and a figure that lives in source control can
 * only be changed by someone who can deploy.
 *
 * The shape follows `YearResults` exactly - a year's summary figures, its A/L
 * rankers per stream, its 9A achievers and their band breakdown, and its
 * scholarship passers - so `ResultsPage` keeps the props it already had and
 * only its defaults move from a constant to a query.
 *
 * Nothing here has a review queue or a status column, and that is the same
 * decision `announcement`, `event` and `news_post` make: results are
 * CMS-direct. The office publishes them; there is no club to submit them and
 * nothing to moderate.
 *
 * Every figure is nullable text rather than a number. A count of achievers is
 * published as the College states it ("86", "9A"), and a z-score is published
 * to four decimal places - storing either as a number would mean re-rounding
 * what was supplied, and inventing a `0` for an absent figure would render as
 * a real result. An absent figure is `null`, and the page omits the row.
 *
 * The `createSelectSchema`/`createInsertSchema`/`createUpdateSchema` triples the
 * other schema files export are deliberately absent: nothing imports them, and
 * five unused schemas for five tables is a lot of surface to keep true.
 */

export type ResultsYearId = Brand<string, "ResultsYearId">;
export const resultsYearIdSchema = v.pipe(
  v.string(),
  brand<string, "ResultsYearId">()
);

export type ResultsAlRankerId = Brand<string, "ResultsAlRankerId">;
export const resultsAlRankerIdSchema = v.pipe(
  v.string(),
  brand<string, "ResultsAlRankerId">()
);

export type ResultsNineAId = Brand<string, "ResultsNineAId">;
export const resultsNineAIdSchema = v.pipe(
  v.string(),
  brand<string, "ResultsNineAId">()
);

export type ResultsNineABandId = Brand<string, "ResultsNineABandId">;
export const resultsNineABandIdSchema = v.pipe(
  v.string(),
  brand<string, "ResultsNineABandId">()
);

export type ResultsScholarshipId = Brand<string, "ResultsScholarshipId">;
export const resultsScholarshipIdSchema = v.pipe(
  v.string(),
  brand<string, "ResultsScholarshipId">()
);

/**
 * The A/L streams a ranker can be filed under.
 *
 * Matches `AL_STREAMS` in `content/academics.ts`, which is what the Academics
 * page's stream cards render, so a ranker's stream is the same identifier the
 * rest of the site already uses. `CHECK`-constrained rather than left free text
 * because a ranker filed under "Arts and Technology" would render in no tab at
 * all - a silent omission, which is the failure mode a picklist exists to stop.
 */
export const RESULTS_AL_STREAMS = [
  "physical-science",
  "biological-science",
  "commerce",
  "arts",
  "engineering-technology",
  "bio-systems-technology",
] as const;
export type ResultsAlStream = (typeof RESULTS_AL_STREAMS)[number];

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
};

export const resultsYear = sqliteTable(
  "results_year",
  {
    id: text("id").primaryKey(),
    /**
     * The examination year, e.g. "2025".
     *
     * One row per year, ever, enforced by `results_year_year_uq` below rather
     * than an inline `.unique()`: the generated migration for the inline form
     * came out without the constraint at all, which is the kind of thing that
     * only shows up once two people have entered 2025.
     */
    year: text("year").notNull(),
    /** Headline figures shown in the "at a glance" strip. */
    alUniversityEntrants: text("al_university_entrants"),
    alThreeA: text("al_three_a"),
    olNineA: text("ol_nine_a"),
    scholarshipPassers: text("scholarship_passers"),
    /** Total 9A achievers, shown beside the big "9A". */
    nineATotal: text("nine_a_total"),
    scholarshipCutOff: text("scholarship_cut_off"),
    scholarshipHighest: text("scholarship_highest"),
    /** Link to the College's published results PDF, when there is one. */
    scholarshipPdfHref: text("scholarship_pdf_href"),
    /**
     * Who entered this year. Nullable and `set null` rather than the
     * `notNull`/`cascade` every other authored table uses: a published result
     * is a record of what happened in a past year, and it should outlive the
     * staff account that typed it in. Cascading would let a leaver's
     * resignation quietly delete the 2024 examination results.
     */
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [uniqueIndex("results_year_year_uq").on(table.year)]
);

export const resultsAlRanker = sqliteTable(
  "results_al_ranker",
  {
    id: text("id").primaryKey(),
    yearId: text("year_id")
      .notNull()
      .references(() => resultsYear.id, { onDelete: "cascade" }),
    /** Which stream's tab this ranker appears under. */
    stream: text("stream").notNull(),
    name: text("name").notNull(),
    /** The published result, e.g. "3A" or "2A B". */
    result: text("result").notNull(),
    zScore: text("z_score"),
    districtRank: text("district_rank"),
    islandRank: text("island_rank"),
    imageId: text("image_id").references(() => files.id, {
      onDelete: "set null",
    }),
    /** Display order within the stream's tab. */
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("results_al_ranker_year_stream_idx").on(table.yearId, table.stream),
    check(
      "results_al_ranker_stream_check",
      sql`${table.stream} in (${sql.raw(
        RESULTS_AL_STREAMS.map((value) => `'${value}'`).join(", ")
      )})`
    ),
  ]
);

export const resultsNineA = sqliteTable(
  "results_nine_a",
  {
    id: text("id").primaryKey(),
    yearId: text("year_id")
      .notNull()
      .references(() => resultsYear.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    imageId: text("image_id").references(() => files.id, {
      onDelete: "set null",
    }),
    /** Display order in the achievers grid. */
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [index("results_nine_a_year_idx").on(table.yearId)]
);

/**
 * The band breakdown beside the 9A grid - "9A: 86", "8A: 12".
 *
 * Its own table rather than a column on `results_nine_a` because a band is a
 * count of *every* student in it while a grid row is one named student: 86
 * achievers in the 9A band does not mean 86 rows in the grid, and merging them
 * would force one of the two to be a lie.
 */
export const resultsNineABand = sqliteTable(
  "results_nine_a_band",
  {
    id: text("id").primaryKey(),
    yearId: text("year_id")
      .notNull()
      .references(() => resultsYear.id, { onDelete: "cascade" }),
    /** The band as published, e.g. "9A", "8A". */
    band: text("band").notNull(),
    count: text("count").notNull(),
    /** Display order; the highest band first. */
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("results_nine_a_band_year_idx").on(table.yearId),
    uniqueIndex("results_nine_a_band_year_band_uq").on(
      table.yearId,
      table.band
    ),
  ]
);

export const resultsScholarship = sqliteTable(
  "results_scholarship",
  {
    id: text("id").primaryKey(),
    yearId: text("year_id")
      .notNull()
      .references(() => resultsYear.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    marks: text("marks").notNull(),
    /** The class awarded, e.g. "5-A". */
    className: text("class_name"),
    imageId: text("image_id").references(() => files.id, {
      onDelete: "set null",
    }),
    /**
     * Display order across the whole year's list.
     *
     * The page renders positions 1-3 as the podium and everything after them as
     * a numbered list. One ordered column rather than a separate "is this a
     * top-three" flag, because a flag is a second thing that can disagree with
     * the position and there is no reading in which they should.
     */
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [index("results_scholarship_year_idx").on(table.yearId)]
);
