import { STRUCTURE_VERSIONS } from "@aloysius/db/constants/structureVersions/index";

import { adminProcedure } from "../../index";

export const listStructureVersions = adminProcedure.handler(() =>
  Object.values(STRUCTURE_VERSIONS).map((version) => ({
    key: version.key,
    description: version.description,
    entryCount: version.entries.length,
  }))
);
