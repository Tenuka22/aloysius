import { student, studentInsertSchema } from "@aloysius/db/schema/marking";
import { pick } from "valibot";

import { requireStudentPermission } from "../../index";

export const createStudent = requireStudentPermission("create")
  .input(
    pick(studentInsertSchema, [
      "admissionNumber",
      "firstName",
      "lastName",
      "dateOfBirth",
      "gender",
      "phone",
      "parentPhone",
      "admissionYear",
      "admissionType",
      "birthCertificateNumber",
      "admissionGrade",
    ])
  )
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();

    const record = await context.db
      .insert(student)
      .values({
        id,
        admissionNumber: input.admissionNumber,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        phone: input.phone,
        parentPhone: input.parentPhone,
        admissionYear: input.admissionYear,
        admissionType: input.admissionType,
        birthCertificateNumber: input.birthCertificateNumber,
        admissionGrade: input.admissionGrade,
      })
      .returning()
      .get();

    return {
      id: record.id,
      admissionNumber: record.admissionNumber,
      firstName: record.firstName,
      lastName: record.lastName,
      dateOfBirth: record.dateOfBirth,
      gender: record.gender,
      phone: record.phone,
      parentPhone: record.parentPhone,
      admissionYear: record.admissionYear,
      admissionType: record.admissionType,
      birthCertificateNumber: record.birthCertificateNumber,
      admissionGrade: record.admissionGrade,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  });
