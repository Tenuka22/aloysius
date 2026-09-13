import { SCHOOL } from "@aloysius/db/config/school";
import { GRADE_LEVELS, getStageForGrade } from "@aloysius/db/constants/grades";

import { adminProcedure } from "../../index";

export const listGrades = adminProcedure.handler(() => {
  const grades: { level: number; stage: string }[] = [];
  for (const level of GRADE_LEVELS) {
    if (level >= SCHOOL.gradeRange.min && level <= SCHOOL.gradeRange.max) {
      grades.push({ level, stage: getStageForGrade(level) });
    }
  }
  return grades;
});
