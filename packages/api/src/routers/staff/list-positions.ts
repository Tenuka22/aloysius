import {
  POSITION_TYPES,
  SECTIONAL_SCOPES,
} from "@aloysius/db/constants/positions";

import { adminProcedure } from "../../index";

export const listPositions = adminProcedure.handler(() => ({
  positions: Object.entries(POSITION_TYPES).map(([key, value]) => ({
    key,
    name: value.name,
    category: value.category,
  })),
  sectionalScopes: [...SECTIONAL_SCOPES],
}));
