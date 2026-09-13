import { SCHOOL } from "@aloysius/db/config/school";
import {
  PRIMARY_SUBJECTS,
  JUNIOR_SECONDARY_SUBJECTS,
  OL_COMPULSORY_SUBJECTS,
  BASKET_SUBJECTS,
  AL_SUBJECTS,
  AL_COMMON_SUBJECTS,
} from "@aloysius/db/constants/subjects";

import { adminProcedure } from "../../index";

export const listSubjects = adminProcedure.handler(() => {
  const maxGrade = SCHOOL.gradeRange.max;
  const subjects: {
    key: string;
    name: string;
    level: string;
    category?: string;
  }[] = [];

  // Primary subjects
  if (maxGrade >= 1) {
    for (const key of PRIMARY_SUBJECTS) {
      subjects.push({ key, name: key, level: "primary" });
    }
  }

  // Junior Secondary subjects
  if (maxGrade >= 6) {
    for (const key of JUNIOR_SECONDARY_SUBJECTS) {
      subjects.push({ key, name: key, level: "juniorSecondary" });
    }
  }

  // O/L compulsory subjects
  if (maxGrade >= 10) {
    for (const key of OL_COMPULSORY_SUBJECTS) {
      subjects.push({ key, name: key, level: "olCompulsory" });
    }

    // O/L basket subjects (filtered by school config)
    for (const category of SCHOOL.offeredOLBasketCategories) {
      const catKey = category as keyof typeof BASKET_SUBJECTS;
      for (const key of BASKET_SUBJECTS[catKey]) {
        subjects.push({
          key,
          name: key,
          level: "olBasket",
          category: catKey,
        });
      }
    }
  }

  // A/L subjects (filtered by school config)
  if (maxGrade >= 12) {
    for (const stream of SCHOOL.offeredALStreams) {
      const streamKey = stream as keyof typeof AL_SUBJECTS;
      for (const key of AL_SUBJECTS[streamKey]) {
        subjects.push({
          key,
          name: key,
          level: "alStream",
          category: streamKey,
        });
      }
    }

    // A/L common subjects
    for (const key of AL_COMMON_SUBJECTS) {
      subjects.push({ key, name: key, level: "alCommon" });
    }
  }

  return subjects;
});
