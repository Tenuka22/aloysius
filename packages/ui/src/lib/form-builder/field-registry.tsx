import { Input } from "@aloysius-web/ui/components/input"
import { Textarea } from "@aloysius-web/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aloysius-web/ui/components/select"
import { Checkbox } from "@aloysius-web/ui/components/checkbox"
import { Slider } from "@aloysius-web/ui/components/slider"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@aloysius-web/ui/components/field"
import type { FieldKind, SelectOption } from "./types"

export type RenderFieldArgs = {
  kind: FieldKind
  name: string
  value: unknown
  label: string
  description?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  options?: SelectOption[] | (() => SelectOption[] | Promise<SelectOption[]>)
  isInvalid: boolean
  onValueChange: (val: unknown) => void
  onBlur: () => void
  errors: Array<{ message?: string } | undefined>
  inputProps?: Record<string, unknown>
  children?: React.ReactNode
  renderLabel?: (label: string) => React.ReactNode
}

export type FieldRenderer = (args: RenderFieldArgs) => React.ReactNode

type Registry = Record<string, FieldRenderer | undefined>

function renderText(args: RenderFieldArgs) {
  return (
    <Input
      id={args.name}
      name={args.name}
      value={(args.value as string) ?? ""}
      onChange={(e) => args.onValueChange(e.target.value)}
      onBlur={args.onBlur}
      aria-invalid={args.isInvalid}
      placeholder={args.placeholder}
      disabled={args.disabled}
      required={args.required}
      {...args.inputProps}
    />
  )
}

function renderNumber(args: RenderFieldArgs) {
  return (
    <Input
      id={args.name}
      name={args.name}
      type="number"
      value={args.value != null ? String(args.value) : ""}
      onChange={(e) => {
        const v = e.target.value
        args.onValueChange(v === "" ? "" : Number(v))
      }}
      onBlur={args.onBlur}
      aria-invalid={args.isInvalid}
      placeholder={args.placeholder}
      disabled={args.disabled}
      required={args.required}
      {...args.inputProps}
    />
  )
}

function renderTextarea(args: RenderFieldArgs) {
  return (
    <Textarea
      id={args.name}
      name={args.name}
      value={(args.value as string) ?? ""}
      onChange={(e) => args.onValueChange(e.target.value)}
      onBlur={args.onBlur}
      aria-invalid={args.isInvalid}
      placeholder={args.placeholder}
      disabled={args.disabled}
      required={args.required}
      {...args.inputProps}
    />
  )
}

function renderSelect(args: RenderFieldArgs) {
  const resolvedOptions = resolveOptions(args.options)
  const value = (args.value as string) ?? ""
  return (
    <Select
      name={args.name}
      value={value}
      onValueChange={(val) => {
        if (val !== undefined) args.onValueChange(val)
      }}
      disabled={args.disabled}
      required={args.required}
      items={resolvedOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
    >
      <SelectTrigger id={args.name} className="w-full" aria-invalid={args.isInvalid}>
        <SelectValue placeholder={args.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {resolvedOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function renderCheckbox(args: RenderFieldArgs) {
  return (
    <Checkbox
      id={args.name}
      checked={!!args.value}
      onCheckedChange={(v) => args.onValueChange(v === true)}
      onBlur={args.onBlur}
      aria-invalid={args.isInvalid}
      disabled={args.disabled}
      required={args.required}
      {...args.inputProps}
    />
  )
}

function renderSlider(args: RenderFieldArgs) {
  const val = (args.value as number) ?? 0
  const min = (args.inputProps?.min as number) ?? 0
  const max = (args.inputProps?.max as number) ?? 100
  const step = (args.inputProps?.step as number) ?? 1
  return (
    <Slider
      id={args.name}
      value={[val]}
      onValueChange={(v) => args.onValueChange(Array.isArray(v) ? v[0] : v)}
      min={min}
      max={max}
      step={step}
      disabled={args.disabled}
      {...args.inputProps}
    />
  )
}

function renderDisplay(args: RenderFieldArgs) {
  const displayVal =
    args.value != null && args.value !== "" ? String(args.value) : args.placeholder || "\u2014"
  return (
    <div className="flex h-8 items-center rounded-lg border border-transparent px-2.5 py-1 text-sm text-foreground">
      {displayVal}
    </div>
  )
}

function renderCustom(_args: RenderFieldArgs) {
  return null
}

function resolveOptions(
  options?: SelectOption[] | (() => SelectOption[] | Promise<SelectOption[]>)
): SelectOption[] {
  if (!options) return []
  if (Array.isArray(options)) return options
  return []
}

export const registry: Registry = {
  text: renderText,
  number: renderNumber,
  textarea: renderTextarea,
  select: renderSelect,
  checkbox: renderCheckbox,
  slider: renderSlider,
  display: renderDisplay,
  custom: renderCustom,
}

export function registerFieldRenderer(kind: string, renderer: FieldRenderer) {
  registry[kind as FieldKind] = renderer
}

export function getFieldRenderer(kind: FieldKind): FieldRenderer {
  const renderer = registry[kind]
  if (!renderer) return renderText
  return renderer
}

export function renderField(args: RenderFieldArgs): React.ReactNode {
  const renderer = getFieldRenderer(args.kind)
  return renderer(args)
}

export function FieldControl(args: RenderFieldArgs): React.ReactNode {
  const labelNode = (
    <>
      {args.label}
      {args.required && <span className="text-destructive ml-0.5">*</span>}
    </>
  )

  return (
    <Field data-invalid={args.isInvalid}>
      {args.kind === "checkbox" ? (
        <div className="flex flex-row items-center gap-2">
          <FieldContent>
            {renderField(args)}
            <div className="flex flex-col gap-0.5">
              <label
                data-slot="field-label"
                htmlFor={args.name}
                className="flex w-fit gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]/field:opacity-50"
              >
                {labelNode}
              </label>
              {args.description && <FieldDescription>{args.description}</FieldDescription>}
            </div>
          </FieldContent>
        </div>
      ) : (
        <>
          {args.renderLabel ? (
            args.renderLabel(args.label)
          ) : (
            <FieldLabel htmlFor={args.name}>{labelNode}</FieldLabel>
          )}
          {args.description && <FieldDescription>{args.description}</FieldDescription>}
          <FieldContent>
            {renderField(args)}
            {args.isInvalid && (
              <FieldError errors={args.errors as Array<{ message?: string } | undefined>} />
            )}
          </FieldContent>
        </>
      )}
    </Field>
  )
}
