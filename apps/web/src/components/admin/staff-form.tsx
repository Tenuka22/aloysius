import { Grid } from "@astryxdesign/core/Grid";
import { VStack } from "@astryxdesign/core/Layout";
import { Selector } from "@astryxdesign/core/Selector";
import { TextInput } from "@astryxdesign/core/TextInput";

import type { StaffFormValues } from "./staff-form-values";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => {
  const padded = String(index + 1).padStart(2, "0");
  return { value: padded, label: String(index + 1) };
});

const CURRENT_YEAR = new Date().getFullYear();
const OLDEST_STAFF_AGE = 75;
const YOUNGEST_STAFF_AGE = 18;
const YEAR_OPTIONS = Array.from(
  { length: OLDEST_STAFF_AGE - YOUNGEST_STAFF_AGE + 1 },
  (_, index) => {
    const year = String(CURRENT_YEAR - YOUNGEST_STAFF_AGE - index);
    return { value: year, label: year };
  }
);

interface StaffFormProps {
  values: StaffFormValues;
  onChange: (values: StaffFormValues) => void;
}

/**
 * Shared field set for both the create and edit staff dialogs, so the two
 * flows stay in lockstep instead of drifting into separate field lists.
 *
 * Birth date uses three plain Selectors (day/month/year) rather than
 * Astryx's DateInput calendar: its own docs recommend against a calendar
 * for dates far in the past, since jumping back decades one month at a
 * time is slow.
 */
export const StaffForm = ({ values, onChange }: StaffFormProps) => {
  const setField = <K extends keyof StaffFormValues>(
    key: K,
    value: StaffFormValues[K]
  ) => onChange({ ...values, [key]: value });

  return (
    <VStack gap={4}>
      <TextInput
        isRequired
        label="Name"
        onChange={(value) => setField("name", value)}
        value={values.name}
      />
      <TextInput
        label="Email"
        onChange={(value) => setField("email", value)}
        type="email"
        value={values.email}
      />
      <TextInput
        label="NIC"
        onChange={(value) => setField("nic", value)}
        value={values.nic}
      />
      <TextInput
        label="Phone"
        onChange={(value) => setField("phone", value)}
        value={values.phone}
      />
      <Selector
        hasClear
        label="Gender"
        onChange={(value) => setField("gender", value ?? "")}
        options={GENDER_OPTIONS}
        value={values.gender || null}
      />
      <Grid columns={3} gap={2}>
        <Selector
          hasClear
          hasSearch
          label="Birth day"
          onChange={(value) => setField("birthDay", value ?? "")}
          options={DAY_OPTIONS}
          value={values.birthDay || null}
          width="100%"
        />
        <Selector
          hasClear
          hasSearch
          label="Birth month"
          onChange={(value) => setField("birthMonth", value ?? "")}
          options={MONTH_OPTIONS}
          value={values.birthMonth || null}
          width="100%"
        />
        <Selector
          hasClear
          hasSearch
          label="Birth year"
          onChange={(value) => setField("birthYear", value ?? "")}
          options={YEAR_OPTIONS}
          value={values.birthYear || null}
          width="100%"
        />
      </Grid>
    </VStack>
  );
};
