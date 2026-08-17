import type { OBMember } from "./api-types";

const ROLE_PRIORITY: Record<string, number> = {
  PATRON: 0,
  "JESUIT REPRESENTATIVE": 1,
  "PARISH PRIEST": 2,
  PRESIDENT: 3,
  SECRETARY: 4,
  TREASURER: 5,
  "VICE PRESIDENT - ADMINISTRATION": 6,
  "VICE PRESIDENT - ACADEMICS": 7,
  "VICE PRESIDENT - SOCIAL & CURRICULAR EVENTS": 8,
  "VICE PRESIDENT - FUNDRAISING": 9,
  "VICE PRESIDENT - MEMBERSHIP": 10,
  "VICE PRESIDENT - PLAYGROUND & SPORTS": 11,
  "ASSISTANT SECRETARY": 12,
  "ASSISTANT TREASURER": 13,
  "COMMITTEE MEMBER": 14,
  "ADVISORY BOARD": 15,
};

function getRolePriority(role: string): number {
  return ROLE_PRIORITY[role.toUpperCase()] ?? 99;
}

export function sortByRole(members: OBMember[]): OBMember[] {
  return [...members].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return getRolePriority(a.role) - getRolePriority(b.role);
  });
}
