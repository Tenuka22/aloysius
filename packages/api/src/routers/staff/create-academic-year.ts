import { isStructureEntryOfferedBySchool } from "@aloysius/db/config/school";
import {
  COMPULSORY_BASKET_CATEGORY,
  getStructureVersion,
} from "@aloysius/db/constants/structureVersions/index";
import type {
  StructureVersionEntry,
  StructureVersion,
} from "@aloysius/db/constants/structureVersions/index";
import { gradeSubjectConfig } from "@aloysius/db/schema/academics";
import {
  academicYear,
  academicYearInsertSchema,
} from "@aloysius/db/schema/staff";
import { ORPCError } from "@orpc/server";
import { desc } from "drizzle-orm";
import { object, optional, pick } from "valibot";

import { adminProcedure } from "../../index";

const inputSchema = object({
  ...pick(academicYearInsertSchema, ["year", "startDate", "endDate"]).entries,
  structureVersionKey: optional(
    pick(academicYearInsertSchema, ["structureVersionKey"]).entries
      .structureVersionKey
  ),
});

export const createAcademicYear = adminProcedure
  .input(inputSchema)
  .handler(async ({ input, context }) => {
    // Default to the most recently created academic year's structure
    // version — the common case (no scheme change) needs no explicit pick.
    const mostRecent = await context.db
      .select({ structureVersionKey: academicYear.structureVersionKey })
      .from(academicYear)
      .orderBy(desc(academicYear.createdAt))
      .get();

    const structureVersionKey =
      input.structureVersionKey ?? mostRecent?.structureVersionKey;

    if (!structureVersionKey) {
      throw new ORPCError("BAD_REQUEST", {
        message:
          "structureVersionKey is required: no prior academic year exists to default from",
      });
    }

    // Validates against the code registry — throws if the key is unknown,
    // rather than silently accepting a typo'd or unshipped version.
    let version: StructureVersion;
    try {
      version = getStructureVersion(structureVersionKey);
    } catch {
      throw new ORPCError("BAD_REQUEST", {
        message: `Unknown structure version key: "${structureVersionKey}"`,
      });
    }

    const id = crypto.randomUUID();

    const record = await context.db
      .insert(academicYear)
      .values({
        id,
        year: input.year,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        structureVersionKey,
      })
      .returning()
      .get();

    // One-time materialization: copy the version's entries into this year's
    // own gradeSubjectConfig rows. Later additions to the registry, or to
    // other years using the same key, can never retroactively change these.
    const offeredEntries = version.entries.filter((entry) =>
      isStructureEntryOfferedBySchool(
        entry.gradeLevel,
        entry.basketCategory,
        COMPULSORY_BASKET_CATEGORY
      )
    );
    if (offeredEntries.length > 0) {
      await context.db
        .insert(gradeSubjectConfig)
        .values(
          offeredEntries.map((entry: StructureVersionEntry) => ({
            id: crypto.randomUUID(),
            academicYearId: id,
            gradeLevel: entry.gradeLevel,
            basketCategory: entry.basketCategory,
            subjectKey: entry.subjectKey,
            sortOrder: entry.sortOrder,
          }))
        )
        .run();
    }

    return {
      id: record.id,
      year: record.year,
      startDate: record.startDate,
      endDate: record.endDate,
      structureVersionKey: record.structureVersionKey,
      isCurrent: record.isCurrent,
      createdAt: record.createdAt.toISOString(),
    };
  });
