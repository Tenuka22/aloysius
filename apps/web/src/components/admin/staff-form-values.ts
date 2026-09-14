export interface StaffFormValues {
  name: string;
  email: string;
  nic: string;
  phone: string;
  gender: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
}

export const emptyStaffFormValues: StaffFormValues = {
  name: "",
  email: "",
  nic: "",
  phone: "",
  gender: "",
  birthDay: "",
  birthMonth: "",
  birthYear: "",
};

/** Converts a form field's empty string to undefined for optional schema fields. */
export const toOptionalField = (value: string): string | undefined =>
  value.trim() === "" ? undefined : value;

export interface IsoDateParts {
  day: string;
  month: string;
  year: string;
}

const ISO_DATE_RE = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/u;

/** One-way: seeds the three birth-date fields from an existing ISO date. */
export const splitIsoDate = (iso: string): IsoDateParts => {
  const groups = ISO_DATE_RE.exec(iso)?.groups;
  if (!groups) {
    return { day: "", month: "", year: "" };
  }
  return { day: groups.day, month: groups.month, year: groups.year };
};

/** Combines the three birth-date fields back into an ISO date at submit time. */
export const joinIsoDate = (parts: IsoDateParts): string =>
  parts.day && parts.month && parts.year
    ? `${parts.year}-${parts.month}-${parts.day}`
    : "";
