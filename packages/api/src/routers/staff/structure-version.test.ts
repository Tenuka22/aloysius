import type { Database } from "@aloysius/db";
import { gradeSubjectConfig } from "@aloysius/db/schema/academics";
import { createTestDb } from "@aloysius/db/testing";
import { createRouterClient } from "@orpc/server";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import type { Context } from "../../context";
import { appRouter } from "../index";

const makeAdminSession = () =>
  ({
    user: {
      id: "u1",
      name: "Admin",
      email: "admin@example.com",
      role: "admin",
    },
    session: { id: "s1" },
  }) as unknown as Context["session"];

describe("createAcademicYear structure versioning suite", () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDb();
  });

  const client = () =>
    createRouterClient(appRouter, {
      context: {
        auth: null,
        session: makeAdminSession(),
        db,
        storage: {} as Context["storage"],
      } satisfies Context,
    });

  describe("createAcademicYear structure versioning", () => {
    it("materializes gradeSubjectConfig rows from the v1 structure version, filtered by school config", async () => {
      const year = await client().staff.createAcademicYear({
        year: 2025,
        startDate: null,
        endDate: null,
        structureVersionKey: "v1",
      });

      expect(year.structureVersionKey).toBe("v1");

      const rows = await db
        .select()
        .from(gradeSubjectConfig)
        .where(eq(gradeSubjectConfig.academicYearId, year.id))
        .all();

      // v1 has 352 raw entries; this school's config excludes the
      // engineeringTechnology/bioSystemsTechnology A/L streams (5 subjects x 2
      // grades x 2 streams = 20 rows), leaving 332.
      expect(rows).toHaveLength(332);
      expect(
        rows.some(
          (row) =>
            row.gradeLevel === 10 &&
            row.basketCategory === "languagesHumanities" &&
            row.subjectKey === "geography"
        )
      ).toBeTruthy();
      expect(
        rows.some((row) => row.basketCategory === "engineeringTechnology")
      ).toBeFalsy();
    });

    it("rejects an unknown structureVersionKey", async () => {
      await expect(
        client().staff.createAcademicYear({
          year: 2025,
          startDate: null,
          endDate: null,
          structureVersionKey: "does-not-exist",
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("defaults to the most recently created year's structure version", async () => {
      await client().staff.createAcademicYear({
        year: 2025,
        startDate: null,
        endDate: null,
        structureVersionKey: "v1",
      });

      const secondYear = await client().staff.createAcademicYear({
        year: 2026,
        startDate: null,
        endDate: null,
      });

      expect(secondYear.structureVersionKey).toBe("v1");
    });

    it("gives two academic years on the same version independent, isolated rows", async () => {
      const yearA = await client().staff.createAcademicYear({
        year: 2025,
        startDate: null,
        endDate: null,
        structureVersionKey: "v1",
      });
      const yearB = await client().staff.createAcademicYear({
        year: 2026,
        startDate: null,
        endDate: null,
        structureVersionKey: "v1",
      });

      // Mutate one year's materialized config directly.
      const [yearARow] = await db
        .select()
        .from(gradeSubjectConfig)
        .where(eq(gradeSubjectConfig.academicYearId, yearA.id))
        .limit(1)
        .all();
      if (!yearARow) {
        throw new Error("expected at least one materialized row for yearA");
      }
      await db
        .update(gradeSubjectConfig)
        .set({ subjectKey: "mutatedSubject" })
        .where(eq(gradeSubjectConfig.id, yearARow.id))
        .run();

      const yearBRows = await db
        .select()
        .from(gradeSubjectConfig)
        .where(eq(gradeSubjectConfig.academicYearId, yearB.id))
        .all();

      expect(
        yearBRows.some((row) => row.subjectKey === "mutatedSubject")
      ).toBeFalsy();
      expect(yearBRows).toHaveLength(332);
    });
  });

  describe("listStructureVersions", () => {
    it("lists the registered v1 structure version", async () => {
      const versions = await client().staff.listStructureVersions();
      expect(versions.some((v) => v.key === "v1")).toBeTruthy();
    });
  });
});
