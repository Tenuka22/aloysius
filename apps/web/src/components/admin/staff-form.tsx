import { Field, FieldGrid } from "@aloysius/ui/components/cms/cms-primitives";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";

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

const selectStyles = stylex.create({
  select: {
    width: "100%",
    paddingBlock: space["2xs"],
    paddingInline: space.xs,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: color.borderStrong,
    borderRadius: "0.25rem",
    backgroundColor: color.surfaceSunken,
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: font.sizeMd,
    lineHeight: font.leadingNormal,
  },
  dateRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: space["2xs"],
  },
});

interface StaffFormProps {
  values: StaffFormValues;
  onChange: (values: StaffFormValues) => void;
}

export const StaffForm = ({ values, onChange }: StaffFormProps) => {
  const setField = <K extends keyof StaffFormValues>(
    key: K,
    value: StaffFormValues[K]
  ) => onChange({ ...values, [key]: value });

  return (
    <FieldGrid>
      <Field
        label="Name"
        kind="text"
        value={values.name}
        onChange={(value) => setField("name", value)}
      />
      <Field
        label="Email"
        kind="email"
        value={values.email}
        onChange={(value) => setField("email", value)}
      />
      <Field
        label="NIC"
        kind="text"
        value={values.nic}
        onChange={(value) => setField("nic", value)}
      />
      <Field
        label="Phone"
        kind="text"
        value={values.phone}
        onChange={(value) => setField("phone", value)}
      />

      {/* Gender select */}
      <div>
        <label
          htmlFor="staff-gender"
          style={{
            display: "block",
            marginBlockEnd: space["2xs"],
            fontSize: font.sizeSm,
            fontWeight: font.weightSemibold,
            color: color.onSurface,
          }}
        >
          Gender
        </label>
        <select
          id="staff-gender"
          {...stylex.props(selectStyles.select)}
          value={values.gender}
          onChange={(e) => setField("gender", e.currentTarget.value)}
        >
          <option value="">—</option>
          {GENDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Birth date */}
      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend
          style={{
            display: "block",
            marginBlockEnd: space["2xs"],
            fontSize: font.sizeSm,
            fontWeight: font.weightSemibold,
            color: color.onSurface,
          }}
        >
          Birth date
        </legend>
        <div {...stylex.props(selectStyles.dateRow)}>
          <select
            {...stylex.props(selectStyles.select)}
            value={values.birthDay}
            onChange={(e) => setField("birthDay", e.currentTarget.value)}
          >
            <option value="">Day</option>
            {DAY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            {...stylex.props(selectStyles.select)}
            value={values.birthMonth}
            onChange={(e) => setField("birthMonth", e.currentTarget.value)}
          >
            <option value="">Month</option>
            {MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            {...stylex.props(selectStyles.select)}
            value={values.birthYear}
            onChange={(e) => setField("birthYear", e.currentTarget.value)}
          >
            <option value="">Year</option>
            {YEAR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </fieldset>
    </FieldGrid>
  );
};
