import type * as v from "valibot";
import type { UseMutationOptions } from "@tanstack/react-query";

export type FieldKind =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "date"
  | "slider"
  | "display"
  | "custom"
  | (string & {});

export type SelectOption = {
  value: string;
  label: string;
};

export type FieldEntry<TData extends Record<string, unknown> = Record<string, unknown>> = {
  name: keyof TData & string;
  kind: FieldKind;
  label: string;
  description?: string;
  placeholder?: string;
  options?: SelectOption[] | (() => SelectOption[] | Promise<SelectOption[]>);
  systemManaged?: boolean;
  hidden?: boolean | ((values: Record<string, unknown>) => boolean);
  disabled?: boolean | ((values: Record<string, unknown>) => boolean);
  required?: boolean;
  layout?: { row: number; column: number; columnSpan?: number };
  section?: string;
  inputProps?: Record<string, unknown>;
  onChangeOverride?: (value: unknown, handleChange: (val: unknown) => void) => void;
  customRenderer?: (args: {
    value: unknown;
    onChange: (val: unknown) => void;
    name: string;
    formValues: Record<string, unknown>;
    setFieldValue: (name: string, value: unknown) => void;
  }) => React.ReactNode;
  renderLabel?: (label: string) => React.ReactNode;
};

export type RowConfig = {
  columns: Array<{
    fields: string[];
    span?: number;
  }>;
};

export type SectionConfig = {
  id: string;
  title: string;
  description?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  step?: number;
  renderCustom?: (values: Record<string, unknown>) => React.ReactNode;
};

export type FormLifecycleHooks<TData> = {
  beforeSubmit?: (values: TData) => TData | Promise<TData>;
  onSuccess?: (result: unknown) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
};

export type FormConfig<TData extends Record<string, unknown> = Record<string, unknown>> = {
  fields: FieldEntry<TData>[];
  layout: RowConfig[];
  sections?: SectionConfig[];
  hooks?: FormLifecycleHooks<TData>;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  renderAboveFields?: (values: Record<string, unknown>) => React.ReactNode;
  renderBelowFields?: (values: Record<string, unknown>) => React.ReactNode;
};

export type FormBuilderProps<TData extends Record<string, unknown>, TMutateResult = unknown> = {
  children?: React.ReactNode;
  config: FormConfig<TData>;
  defaultValues: TData;
  valibotSchema?: v.GenericSchema<TData>;
  mutationOptions?: UseMutationOptions<TMutateResult, Error, { body: TData }, unknown>;
  queryKeysToInvalidate?: Array<unknown>;
  onSubmit?: (values: TData) => Promise<TMutateResult | void>;
  formId?: string;
  renderSubmitOutside?: boolean;
  hideDefaultButtons?: boolean;
  submitting?: boolean;
  currentStep?: number;
};
