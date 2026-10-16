import { fileIdSchema } from "@aloysius/db/schema/files";
import {
  RESULTS_AL_STREAMS,
  resultsAlRanker,
  resultsAlRankerIdSchema,
  resultsNineA,
  resultsNineABand,
  resultsNineABandIdSchema,
  resultsNineAIdSchema,
  resultsScholarship,
  resultsScholarshipIdSchema,
  resultsYear,
  resultsYearIdSchema,
} from "@aloysius/db/schema/results";
import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import * as v from "valibot";

import { cmsProcedure, publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

/**
 * Examination results, as CMS content.
 *
 * Read by `/results` and written by `/cms/results`. There is no review queue
 * and no status column, for the same reason `announcement`, `event` and
 * `news_post` have none: results are published by the College's office, there
 * is no club to submit them, and nothing to moderate.
 *
 * The shapes here mirror `YearResults` in `@aloysius/ui/content/results` - the
 * type `ResultsPage` already accepts - so the page component did not have to
 * change shape to read from the database. Every figure is optional text: a
 * figure the College did not supply is absent, not zero.
 */

const FIGURE = v.pipe(v.string(), v.maxLength(40));

/** Display order: a whole number, zero or more. */
const POSITION = v.pipe(v.number(), v.integer(), v.minValue(0));

const yearFieldsSchema = v.object({
  year: v.pipe(v.string(), v.minLength(4), v.maxLength(4)),
  alUniversityEntrants: v.optional(v.nullable(FIGURE)),
  alThreeA: v.optional(v.nullable(FIGURE)),
  olNineA: v.optional(v.nullable(FIGURE)),
  scholarshipPassers: v.optional(v.nullable(FIGURE)),
  nineATotal: v.optional(v.nullable(FIGURE)),
  scholarshipCutOff: v.optional(v.nullable(FIGURE)),
  scholarshipHighest: v.optional(v.nullable(FIGURE)),
  scholarshipPdfHref: v.optional(
    v.nullable(
      v.pipe(
        v.string(),
        v.url(),
        v.regex(/^https?:\/\//u, "Must be an http or https URL")
      )
    )
  ),
});

const alRankerFieldsSchema = v.object({
  yearId: resultsYearIdSchema,
  stream: v.picklist(RESULTS_AL_STREAMS),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  result: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
  zScore: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(20)))),
  districtRank: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(20)))),
  islandRank: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(20)))),
  imageId: v.optional(v.nullable(fileIdSchema)),
  position: v.optional(POSITION),
});

const nineAFieldsSchema = v.object({
  yearId: resultsYearIdSchema,
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  imageId: v.optional(v.nullable(fileIdSchema)),
  position: v.optional(POSITION),
});

const nineABandFieldsSchema = v.object({
  yearId: resultsYearIdSchema,
  band: v.pipe(v.string(), v.minLength(1), v.maxLength(20)),
  count: v.pipe(v.string(), v.minLength(1), v.maxLength(20)),
  position: v.optional(POSITION),
});

const scholarshipFieldsSchema = v.object({
  yearId: resultsYearIdSchema,
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  marks: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
  className: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(40)))),
  imageId: v.optional(v.nullable(fileIdSchema)),
  position: v.optional(POSITION),
});

/** Only the error a CMS screen shows when a row has gone underneath it. */
const notFound = (what: string) =>
  new ORPCError("NOT_FOUND", { message: `${what} not found` });

/**
 * Every published year and everything under it, newest first.
 *
 * One call rather than five: the page renders a year selector, so it needs
 * every year it is going to offer, and a selected year's children at the same
 * time. Five round trips to build one screen is five chances to render a year
 * whose rankers have not arrived.
 */
export const listResults = publicProcedure.handler(async ({ context }) => {
  const years = await context.db
    .select()
    .from(resultsYear)
    .orderBy(desc(resultsYear.year))
    .all();

  if (years.length === 0) {
    return [];
  }

  const yearIds = years.map((year) => year.id);

  const [rankers, achievers, bands, passers] = await Promise.all([
    context.db
      .select()
      .from(resultsAlRanker)
      .where(inArray(resultsAlRanker.yearId, yearIds))
      .orderBy(asc(resultsAlRanker.position))
      .all(),
    context.db
      .select()
      .from(resultsNineA)
      .where(inArray(resultsNineA.yearId, yearIds))
      .orderBy(asc(resultsNineA.position))
      .all(),
    context.db
      .select()
      .from(resultsNineABand)
      .where(inArray(resultsNineABand.yearId, yearIds))
      .orderBy(asc(resultsNineABand.position))
      .all(),
    context.db
      .select()
      .from(resultsScholarship)
      .where(inArray(resultsScholarship.yearId, yearIds))
      .orderBy(asc(resultsScholarship.position))
      .all(),
  ]);

  const urls = await resolveFileUrls(
    context.db,
    [...rankers, ...achievers, ...passers].flatMap((row) =>
      row.imageId ? [row.imageId] : []
    )
  );
  const urlFor = (imageId: string | null) =>
    imageId ? (urls.get(imageId) ?? null) : null;

  return years.map((year) => {
    /*
     * Grouped in JS rather than with one query per year: five years is five
     * queries, and the page only ever shows one year at a time, so the rows it
     * does not need are cheap to carry and expensive to fetch separately.
     */
    const yearRankers = rankers.filter((row) => row.yearId === year.id);
    const yearAchievers: {
      id: string;
      name: string;
      imageUrl: string | null;
    }[] = [];
    const yearBands: typeof bands = [];
    const yearScholarship = passers.filter((row) => row.yearId === year.id);

    for (const row of achievers) {
      if (row.yearId === year.id) {
        yearAchievers.push({
          id: row.id,
          name: row.name,
          imageUrl: urlFor(row.imageId),
        });
      }
    }
    for (const row of bands) {
      if (row.yearId === year.id) {
        yearBands.push(row);
      }
    }

    const alRankers: Record<
      string,
      {
        id: string;
        name: string;
        result: string;
        zScore?: string;
        districtRank?: string;
        islandRank?: string;
        imageUrl: string | null;
      }[]
    > = {};

    for (const row of yearRankers) {
      const bucket = alRankers[row.stream] ?? [];
      bucket.push({
        id: row.id,
        name: row.name,
        result: row.result,
        ...(row.zScore ? { zScore: row.zScore } : {}),
        ...(row.districtRank ? { districtRank: row.districtRank } : {}),
        ...(row.islandRank ? { islandRank: row.islandRank } : {}),
        imageUrl: urlFor(row.imageId),
      });
      alRankers[row.stream] = bucket;
    }

    const scholarshipEntries = yearScholarship.map((row) => ({
      id: row.id,
      name: row.name,
      marks: row.marks,
      ...(row.className ? { className: row.className } : {}),
      imageUrl: urlFor(row.imageId),
    }));

    return {
      id: year.id,
      year: year.year,
      /*
       * Absent keys rather than empty strings. `ResultsSummary` renders an
       * em dash for a missing figure and `null` for a blank one, so an absent
       * key is what makes "not published" read differently from "published as
       * nothing".
       */
      summary: {
        ...(year.alUniversityEntrants
          ? { alUniversityEntrants: year.alUniversityEntrants }
          : {}),
        ...(year.alThreeA ? { alThreeA: year.alThreeA } : {}),
        ...(year.olNineA ? { olNineA: year.olNineA } : {}),
        ...(year.scholarshipPassers
          ? { scholarshipPassers: year.scholarshipPassers }
          : {}),
      },
      alRankers,
      nineA: {
        ...(year.nineATotal ? { total: year.nineATotal } : {}),
        students: yearAchievers,
        bands: yearBands.map((row) => ({
          band: row.band,
          count: row.count,
        })),
      },
      scholarship: {
        ...(year.scholarshipPassers ? { passed: year.scholarshipPassers } : {}),
        ...(year.scholarshipCutOff ? { cutOff: year.scholarshipCutOff } : {}),
        ...(year.scholarshipHighest
          ? { highest: year.scholarshipHighest }
          : {}),
        ...(year.scholarshipPdfHref
          ? { pdfHref: year.scholarshipPdfHref }
          : {}),
        // The count of passers, not a stored figure - see `resultsYear`.
        ...(yearScholarship.length > 0
          ? { total: String(yearScholarship.length) }
          : {}),
        /*
         * Positions 1-3 are the podium and the rest is the numbered list: the
         * split `YearResults.scholarship` expresses as two arrays, derived here
         * from one ordering so the two cannot disagree.
         */
        top: scholarshipEntries.slice(0, 3),
        list: scholarshipEntries.slice(3),
      },
    };
  });
});

export const createResultsYear = cmsProcedure
  .input(yearFieldsSchema)
  .handler(async ({ input, context }) => {
    const record = await context.db
      .insert(resultsYear)
      .values({
        id: crypto.randomUUID(),
        ...input,
        alUniversityEntrants: input.alUniversityEntrants ?? null,
        alThreeA: input.alThreeA ?? null,
        olNineA: input.olNineA ?? null,
        scholarshipPassers: input.scholarshipPassers ?? null,
        nineATotal: input.nineATotal ?? null,
        scholarshipCutOff: input.scholarshipCutOff ?? null,
        scholarshipHighest: input.scholarshipHighest ?? null,
        scholarshipPdfHref: input.scholarshipPdfHref ?? null,
        createdById: context.session.user.id,
      })
      .returning({ id: resultsYear.id })
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return { id: record.id };
  });

export const updateResultsYear = cmsProcedure
  .input(v.object({ id: resultsYearIdSchema, ...yearFieldsSchema.entries }))
  .handler(async ({ input, context }) => {
    const record = await context.db
      .update(resultsYear)
      .set({
        year: input.year,
        alUniversityEntrants: input.alUniversityEntrants ?? null,
        alThreeA: input.alThreeA ?? null,
        olNineA: input.olNineA ?? null,
        scholarshipPassers: input.scholarshipPassers ?? null,
        nineATotal: input.nineATotal ?? null,
        scholarshipCutOff: input.scholarshipCutOff ?? null,
        scholarshipHighest: input.scholarshipHighest ?? null,
        scholarshipPdfHref: input.scholarshipPdfHref ?? null,
      })
      .where(eq(resultsYear.id, input.id))
      .returning({ id: resultsYear.id })
      .get();

    if (!record) {
      throw notFound("Results year");
    }

    return { id: record.id };
  });

/**
 * Deleting a year takes its rankers, achievers, bands and scholarship passers
 * with it. That is the schema's `onDelete: "cascade"` rather than a decision
 * made here, and it is the right one: a ranker with no year is a row nothing
 * can display, and a half-deleted year renders as an empty tab rather than as
 * an error.
 */
export const deleteResultsYear = cmsProcedure
  .input(v.object({ id: resultsYearIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(resultsYear)
      .where(eq(resultsYear.id, input.id))
      .returning({ id: resultsYear.id })
      .all();

    if (deleted.length === 0) {
      throw notFound("Results year");
    }

    return { id: input.id };
  });

export const createAlRanker = cmsProcedure
  .input(alRankerFieldsSchema)
  .handler(async ({ input, context }) => {
    const record = await context.db
      .insert(resultsAlRanker)
      .values({
        id: crypto.randomUUID(),
        yearId: input.yearId,
        stream: input.stream,
        name: input.name,
        result: input.result,
        zScore: input.zScore ?? null,
        districtRank: input.districtRank ?? null,
        islandRank: input.islandRank ?? null,
        imageId: input.imageId ?? null,
        position: input.position ?? 0,
      })
      .returning({ id: resultsAlRanker.id })
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return { id: record.id };
  });

export const updateAlRanker = cmsProcedure
  .input(
    v.object({ id: resultsAlRankerIdSchema, ...alRankerFieldsSchema.entries })
  )
  .handler(async ({ input, context }) => {
    const record = await context.db
      .update(resultsAlRanker)
      .set({
        stream: input.stream,
        name: input.name,
        result: input.result,
        zScore: input.zScore ?? null,
        districtRank: input.districtRank ?? null,
        islandRank: input.islandRank ?? null,
        imageId: input.imageId ?? null,
        position: input.position ?? 0,
      })
      .where(eq(resultsAlRanker.id, input.id))
      .returning({ id: resultsAlRanker.id })
      .get();

    if (!record) {
      throw notFound("A/L ranker");
    }

    return { id: record.id };
  });

export const deleteAlRanker = cmsProcedure
  .input(v.object({ id: resultsAlRankerIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(resultsAlRanker)
      .where(eq(resultsAlRanker.id, input.id))
      .returning({ id: resultsAlRanker.id })
      .all();

    if (deleted.length === 0) {
      throw notFound("A/L ranker");
    }

    return { id: input.id };
  });

export const createNineA = cmsProcedure
  .input(nineAFieldsSchema)
  .handler(async ({ input, context }) => {
    const record = await context.db
      .insert(resultsNineA)
      .values({
        id: crypto.randomUUID(),
        yearId: input.yearId,
        name: input.name,
        imageId: input.imageId ?? null,
        position: input.position ?? 0,
      })
      .returning({ id: resultsNineA.id })
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return { id: record.id };
  });

export const updateNineA = cmsProcedure
  .input(v.object({ id: resultsNineAIdSchema, ...nineAFieldsSchema.entries }))
  .handler(async ({ input, context }) => {
    const record = await context.db
      .update(resultsNineA)
      .set({
        name: input.name,
        imageId: input.imageId ?? null,
        position: input.position ?? 0,
      })
      .where(eq(resultsNineA.id, input.id))
      .returning({ id: resultsNineA.id })
      .get();

    if (!record) {
      throw notFound("9A achiever");
    }

    return { id: record.id };
  });

export const deleteNineA = cmsProcedure
  .input(v.object({ id: resultsNineAIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(resultsNineA)
      .where(eq(resultsNineA.id, input.id))
      .returning({ id: resultsNineA.id })
      .all();

    if (deleted.length === 0) {
      throw notFound("9A achiever");
    }

    return { id: input.id };
  });

export const createNineABand = cmsProcedure
  .input(nineABandFieldsSchema)
  .handler(async ({ input, context }) => {
    /*
     * Upsert rather than insert: a band is one figure per year, so re-entering
     * "9A" for a year that already has one is a correction, and failing it
     * would make fixing a typo in the count impossible without a delete.
     */
    const id = crypto.randomUUID();
    await context.db
      .insert(resultsNineABand)
      .values({
        id,
        yearId: input.yearId,
        band: input.band,
        count: input.count,
        position: input.position ?? 0,
      })
      .onConflictDoUpdate({
        target: [resultsNineABand.yearId, resultsNineABand.band],
        set: {
          count: input.count,
          position: input.position ?? 0,
        },
      })
      .run();

    return { id };
  });

export const updateNineABand = cmsProcedure
  .input(
    v.object({ id: resultsNineABandIdSchema, ...nineABandFieldsSchema.entries })
  )
  .handler(async ({ input, context }) => {
    const record = await context.db
      .update(resultsNineABand)
      .set({
        band: input.band,
        count: input.count,
        position: input.position ?? 0,
      })
      .where(
        and(
          eq(resultsNineABand.id, input.id),
          eq(resultsNineABand.yearId, input.yearId)
        )
      )
      .returning({ id: resultsNineABand.id })
      .get();

    if (!record) {
      throw notFound("9A band");
    }

    return { id: record.id };
  });

export const deleteNineABand = cmsProcedure
  .input(v.object({ id: resultsNineABandIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(resultsNineABand)
      .where(eq(resultsNineABand.id, input.id))
      .returning({ id: resultsNineABand.id })
      .all();

    if (deleted.length === 0) {
      throw notFound("9A band");
    }

    return { id: input.id };
  });

export const createScholarship = cmsProcedure
  .input(scholarshipFieldsSchema)
  .handler(async ({ input, context }) => {
    const record = await context.db
      .insert(resultsScholarship)
      .values({
        id: crypto.randomUUID(),
        yearId: input.yearId,
        name: input.name,
        marks: input.marks,
        className: input.className ?? null,
        imageId: input.imageId ?? null,
        position: input.position ?? 0,
      })
      .returning({ id: resultsScholarship.id })
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return { id: record.id };
  });

export const updateScholarship = cmsProcedure
  .input(
    v.object({
      id: resultsScholarshipIdSchema,
      ...scholarshipFieldsSchema.entries,
    })
  )
  .handler(async ({ input, context }) => {
    const record = await context.db
      .update(resultsScholarship)
      .set({
        name: input.name,
        marks: input.marks,
        className: input.className ?? null,
        imageId: input.imageId ?? null,
        position: input.position ?? 0,
      })
      .where(eq(resultsScholarship.id, input.id))
      .returning({ id: resultsScholarship.id })
      .get();

    if (!record) {
      throw notFound("Scholarship passer");
    }

    return { id: record.id };
  });

export const deleteScholarship = cmsProcedure
  .input(v.object({ id: resultsScholarshipIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(resultsScholarship)
      .where(eq(resultsScholarship.id, input.id))
      .returning({ id: resultsScholarship.id })
      .all();

    if (deleted.length === 0) {
      throw notFound("Scholarship passer");
    }

    return { id: input.id };
  });
