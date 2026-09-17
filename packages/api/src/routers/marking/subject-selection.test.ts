import type { Database } from "@aloysius/db";
import { studentAdmission, subjectMark } from "@aloysius/db/schema/marking";
import { staff } from "@aloysius/db/schema/staff";
import { createTestDb } from "@aloysius/db/testing";
import { createRouterClient } from "@orpc/server";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import type { Context } from "../../context";
import { appRouter } from "../index";

const makeAdminSession = (userId = "admin-1") =>
  ({
    user: {
      id: userId,
      name: "Admin",
      email: "admin@example.com",
      role: "admin",
    },
    session: { id: "s1" },
  }) as unknown as Context["session"];

const makeStudentInput = (overrides: {
  admissionNumber: string;
  firstName: string;
  lastName: string;
  admissionType?: "grade6" | "grade12" | "transfer" | null;
  birthCertificateNumber?: string | null;
}) => ({
  dateOfBirth: null,
  gender: null,
  phone: null,
  parentPhone: null,
  admissionYear: null,
  admissionType: null,
  birthCertificateNumber: null,
  admissionGrade: null,
  ...overrides,
});

describe("subject selection suite", () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDb();
  });

  const client = (userId = "admin-1") =>
    createRouterClient(appRouter, {
      context: {
        auth: null,
        session: makeAdminSession(userId),
        db,
        storage: {} as Context["storage"],
      } satisfies Context,
    });

  /** Builds a grade-10 class in a fresh v1 academic year, plus a staff row for the acting admin. */
  const setupYearAndClass = async () => {
    const admin = client();
    const year = await admin.staff.createAcademicYear({
      year: 2025,
      startDate: null,
      endDate: null,
      structureVersionKey: "v1",
    });
    const cls = await admin.staff.createClass({
      academicYearId: year.id,
      gradeLevel: 10,
      name: "10A",
    });
    await db.insert(staff).values({ id: "admin-1", name: "Admin" }).run();
    return { year, cls };
  };

  describe("setSubjectSelection", () => {
    const runSelectionChangeScenario = async () => {
      const { year, cls } = await setupYearAndClass();
      const admin = client();

      const studentRecord = await admin.marking.createStudent(
        makeStudentInput({
          admissionNumber: "STU/2025/001",
          firstName: "Test",
          lastName: "Student",
        })
      );
      const assignment = await admin.marking.assignStudentToClass({
        studentId: studentRecord.id,
        academicYearId: year.id,
        classId: cls.id,
      });
      const examType = await admin.marking.createExamType({
        academicYearId: year.id,
        name: "First Term Exam 2025",
        category: "firstTerm",
        gradeLevel: 10,
        maxMark: 100,
        sortOrder: 0,
      });

      const firstSelection = await admin.marking.setSubjectSelection({
        studentId: studentRecord.id,
        academicYearId: year.id,
        basketCategory: "technicalVocational",
        subjectKey: "ict",
      });

      const markUnderIct = await admin.marking.enterSubjectMark({
        studentClassAssignmentId: assignment.id,
        examTypeId: examType.id,
        subjectKey: "ict",
        mark: 88,
        grade: null,
      });

      const secondSelection = await admin.marking.setSubjectSelection({
        studentId: studentRecord.id,
        academicYearId: year.id,
        basketCategory: "technicalVocational",
        subjectKey: "homeEconomics",
      });

      const current = await admin.marking.getCurrentSubjectSelections({
        studentId: studentRecord.id,
        academicYearId: year.id,
      });

      const history = await admin.marking.listSubjectSelectionHistory({
        studentId: studentRecord.id,
        academicYearId: year.id,
      });

      const markRow = await db
        .select()
        .from(subjectMark)
        .where(eq(subjectMark.id, markUnderIct.id))
        .get();

      return { firstSelection, secondSelection, current, history, markRow };
    };

    it("creates the first selection with no predecessor", async () => {
      const { firstSelection } = await runSelectionChangeScenario();
      expect(firstSelection.previousSelectionId).toBeNull();
    });

    it("supersedes the prior selection instead of editing it", async () => {
      const { firstSelection, secondSelection } =
        await runSelectionChangeScenario();
      expect(secondSelection.previousSelectionId).toBe(firstSelection.id);
    });

    it("getCurrentSubjectSelections returns only the active selection", async () => {
      const { current } = await runSelectionChangeScenario();
      expect(current).toHaveLength(1);
      expect(current[0]?.subjectKey).toBe("homeEconomics");
    });

    it("listSubjectSelectionHistory returns the full chain, oldest first", async () => {
      const { firstSelection, history } = await runSelectionChangeScenario();
      expect(history).toHaveLength(2);
      expect(history[0]?.subjectKey).toBe("ict");
      expect(history[0]?.id).toBe(firstSelection.id);
    });

    it("leaves marks entered under a superseded selection untouched", async () => {
      const { markRow } = await runSelectionChangeScenario();
      expect(markRow?.subjectKey).toBe("ict");
      expect(markRow?.mark).toBe(88);
    });

    it("rejects selecting a subject not offered for that basket/grade", async () => {
      const { year, cls } = await setupYearAndClass();
      const admin = client();
      const studentRecord = await admin.marking.createStudent(
        makeStudentInput({
          admissionNumber: "STU/2025/002",
          firstName: "Test",
          lastName: "Two",
        })
      );
      await admin.marking.assignStudentToClass({
        studentId: studentRecord.id,
        academicYearId: year.id,
        classId: cls.id,
      });

      await expect(
        admin.marking.setSubjectSelection({
          studentId: studentRecord.id,
          academicYearId: year.id,
          basketCategory: "technicalVocational",
          subjectKey: "notARealSubject",
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects selecting the compulsory category directly", async () => {
      const { year, cls } = await setupYearAndClass();
      const admin = client();
      const studentRecord = await admin.marking.createStudent(
        makeStudentInput({
          admissionNumber: "STU/2025/003",
          firstName: "Test",
          lastName: "Three",
        })
      );
      await admin.marking.assignStudentToClass({
        studentId: studentRecord.id,
        academicYearId: year.id,
        classId: cls.id,
      });

      await expect(
        admin.marking.setSubjectSelection({
          studentId: studentRecord.id,
          academicYearId: year.id,
          basketCategory: "compulsory",
          subjectKey: "mathematics",
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("assignStudentToClass admission records", () => {
    it("creates a studentAdmission only on the student's first-ever class assignment", async () => {
      const admin = client();
      const yearA = await admin.staff.createAcademicYear({
        year: 2025,
        startDate: null,
        endDate: null,
        structureVersionKey: "v1",
      });
      const yearB = await admin.staff.createAcademicYear({
        year: 2026,
        startDate: null,
        endDate: null,
      });
      const classA = await admin.staff.createClass({
        academicYearId: yearA.id,
        gradeLevel: 6,
        name: "6A",
      });
      const classB = await admin.staff.createClass({
        academicYearId: yearB.id,
        gradeLevel: 7,
        name: "7A",
      });

      const studentRecord = await admin.marking.createStudent(
        makeStudentInput({
          admissionNumber: "STU/2025/010",
          firstName: "Continuing",
          lastName: "Student",
          admissionType: "grade6",
          birthCertificateNumber: "BC-001",
        })
      );

      await admin.marking.assignStudentToClass({
        studentId: studentRecord.id,
        academicYearId: yearA.id,
        classId: classA.id,
      });
      await admin.marking.assignStudentToClass({
        studentId: studentRecord.id,
        academicYearId: yearB.id,
        classId: classB.id,
      });

      const admissions = await db
        .select()
        .from(studentAdmission)
        .where(eq(studentAdmission.studentId, studentRecord.id))
        .all();

      expect(admissions).toHaveLength(1);
      expect(admissions[0]?.academicYearId).toBe(yearA.id);
      expect(admissions[0]?.admissionType).toBe("grade6");
    });
  });
});
