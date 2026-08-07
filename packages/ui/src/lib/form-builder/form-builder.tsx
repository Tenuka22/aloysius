"use client"

import { useCallback } from "react"
import { useForm, useStore } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@aloysius-web/ui/components/button"
import { FieldGroup, FieldSet, FieldLegend } from "@aloysius-web/ui/components/field"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@aloysius-web/ui/components/collapsible"
import { FieldControl, type RenderFieldArgs } from "./field-registry"
import { FormContext } from "./form-context"

import type { FormBuilderProps, FieldEntry, RowConfig } from "./types"

const SPAN_CLASSES: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
}

function findField<TData extends Record<string, unknown>>(
  fields: FieldEntry<TData>[],
  name: string
): FieldEntry<TData> | undefined {
  return fields.find((f) => f.name === name)
}

function useFormBuilderSubmit<TData extends Record<string, unknown>>(props: FormBuilderProps<TData>) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: props.mutationOptions?.mutationFn ?? (async () => {}),
    ...props.mutationOptions,
  })

  const handleSubmit = useCallback(
    async (values: TData) => {
      try {
        if (props.config.hooks?.beforeSubmit) {
          values = await props.config.hooks.beforeSubmit(values)
        }
        if (props.onSubmit) {
          await props.onSubmit(values)
        } else if (props.mutationOptions) {
          await mutation.mutateAsync({ body: values })
        }
        if (props.queryKeysToInvalidate?.length) {
          for (const key of props.queryKeysToInvalidate) {
            queryClient.invalidateQueries({ queryKey: key as any })
          }
        }
        if (props.config.hooks?.onSuccess) {
          await props.config.hooks.onSuccess(mutation.data)
        }
      } catch (err) {
        if (props.config.hooks?.onError) {
          const message = err instanceof Error ? err.message : "An unexpected error occurred"
          await props.config.hooks.onError(
            err instanceof Error ? err : new Error(message)
          )
        }
      }
    },
    [
      props.onSubmit,
      props.mutationOptions,
      props.queryKeysToInvalidate,
      props.config.hooks,
      mutation.mutateAsync,
      mutation.data,
      queryClient,
    ]
  )

  return {
    handleSubmit,
    isPending: props.submitting ?? mutation.isPending,
  }
}

export function FormBuilder<TData extends Record<string, unknown>>(props: FormBuilderProps<TData>) {
  const { config, defaultValues, valibotSchema } = props
  const { handleSubmit, isPending } = useFormBuilderSubmit(props)

  const form = useForm({
    defaultValues: defaultValues as any,
    validators: valibotSchema ? ({ onSubmit: valibotSchema } as any) : undefined,
    onSubmit: async ({ value }) => {
      await handleSubmit(value as TData)
    },
  })

  const formValues = useStore(form.store, (state) => state.values) as Record<string, unknown>
  const formId = props.formId ?? "form-builder-form"

  function renderSingleField(field: FieldEntry<TData>) {
    if (field.systemManaged) {
      return (
        <FieldControl
          key={field.name}
          kind="display"
          name={field.name}
          value={defaultValues[field.name]}
          label={field.label}
          description={field.description}
          placeholder={field.placeholder}
          disabled
          isInvalid={false}
          onValueChange={() => {}}
          onBlur={() => {}}
          errors={[]}
        />
      )
    }

    if (field.kind === "custom" && field.customRenderer) {
      return (
        <form.Field
          key={field.name}
          name={field.name as any}
          children={(f: any) => {
            const fieldApi = f as {
              state: { value: unknown }
              handleChange: (val: unknown) => void
            }
            return (
              <div className="space-y-1.5">
                {field.label && (
                  <label className="text-sm font-medium leading-none">
                    {field.label}
                    {field.required && <span className="text-destructive ml-0.5">*</span>}
                  </label>
                )}
                {field.customRenderer!({
                  value: fieldApi.state.value,
                  onChange: (val) => fieldApi.handleChange(val),
                  name: field.name,
                  formValues: formValues as Record<string, unknown>,
                  setFieldValue: (n, v) => form.setFieldValue(n as any, v),
                })}
              </div>
            )
          }}
        />
      )
    }

    return (
      <form.Field
        key={field.name}
        name={field.name as any}
        children={(f: any) => {
          const fieldApi = f as {
            state: {
              value: unknown
              meta: { isTouched: boolean; isValid: boolean; errors: any[] }
            }
            handleChange: (val: unknown) => void
            handleBlur: () => void
          }
          const isInvalid = fieldApi.state.meta.isTouched && !fieldApi.state.meta.isValid

          const changeHandler = field.onChangeOverride
            ? (val: unknown) => field.onChangeOverride!(val, fieldApi.handleChange)
            : fieldApi.handleChange

          const renderArgs: RenderFieldArgs = {
            kind: field.kind,
            name: field.name,
            value: fieldApi.state.value,
            label: field.label,
            description: field.description,
            placeholder: field.placeholder,
            disabled: isFieldDisabled(field),
            required: field.required,
            options: field.options,
            isInvalid,
            onValueChange: (val) => changeHandler(val),
            onBlur: fieldApi.handleBlur,
            errors: fieldApi.state.meta.errors,
            inputProps: field.inputProps,
            renderLabel: field.renderLabel,
          }

          return <FieldControl {...renderArgs} />
        }}
      />
    )
  }

  function isFieldHidden(field: FieldEntry<TData>): boolean {
    if (typeof field.hidden === "function") {
      return field.hidden(formValues as Record<string, unknown>)
    }
    return !!field.hidden
  }

  function isFieldDisabled(field: FieldEntry<TData>): boolean {
    if (typeof field.disabled === "function") {
      return field.disabled(formValues as Record<string, unknown>)
    }
    return !!field.disabled
  }

  function getSectionRows(sectionId: string | undefined): RowConfig[] {
    const rowIds: number[] = []
    const sectionFieldNames = new Set(
      config.fields
        .filter((f) => f.section === sectionId && !isFieldHidden(f))
        .map((f) => f.name)
    )
    config.layout.forEach((row, idx) => {
      const hasFieldInSection = row.columns.some((col) =>
        col.fields.some((fn) => sectionFieldNames.has(fn))
      )
      if (hasFieldInSection) rowIds.push(idx)
    })
    return rowIds.map((i) => config.layout[i]).filter((row): row is RowConfig => row !== undefined)
  }

  const systemFields = config.fields.filter((f) => f.systemManaged)
  const hiddenFields = config.fields.filter((f) => isFieldHidden(f))

  function renderLayoutContent(rows: RowConfig[]) {
    return rows.map((row) => {
      const rowIdx = config.layout.indexOf(row)
      return (
        <div key={`row-${rowIdx}`} className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {row.columns.map((col, colIdx) => {
            const spanClass = col.span
              ? SPAN_CLASSES[col.span] ?? `md:col-span-${col.span}`
              : "md:col-span-12"
            return (
              <div
                key={`col-${colIdx}`}
                className={`col-span-1 ${spanClass} flex flex-col gap-4`}
              >
              {col.fields.map((fieldName) => {
                const field = findField(config.fields, fieldName)
                if (!field) return null
                return renderSingleField(field)
              })}
            </div>
            )
          })}
        </div>
      )
    })
  }

  function renderLayout() {
    const visibleSections = props.currentStep != null
      ? (config.sections ?? []).filter((s) => s.step == null || s.step === props.currentStep)
      : (config.sections ?? [])

    return (
      <FieldGroup>
        {visibleSections.map((section) => {
          const sectionRows = getSectionRows(section.id)
          if (sectionRows.length === 0) return null

          const content = (
            <div className="space-y-4">
              {section.description && (
                <p className="text-sm text-muted-foreground">{section.description}</p>
              )}
              {renderLayoutContent(sectionRows)}
            </div>
          )

          if (section.collapsible) {
            return (
              <Collapsible key={section.id} defaultOpen={section.defaultOpen ?? true}>
                <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 text-base font-medium">
                  <FieldLegend variant="label">{section.title}</FieldLegend>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">{content}</CollapsibleContent>
              </Collapsible>
            )
          }

          return (
            <FieldSet key={section.id}>
              <FieldLegend>{section.title}</FieldLegend>
              {content}
            </FieldSet>
          )
        })}

        {config.layout
          .filter((row) => {
            const allFields = row.columns.flatMap((c) => c.fields)
            return allFields.some((fn) => {
              const field = findField(config.fields, fn)
              if (!field) return false
              if (isFieldHidden(field)) return false
              if (field.systemManaged) return false
              if (field.section) return false
              return true
            })
          })
          .map((row) => (
            <div key={`row-${config.layout.indexOf(row)}`} className="space-y-4">
              {renderLayoutContent([row])}
            </div>
          ))}

        {systemFields.length > 0 && (
          <FieldSet>
            <FieldLegend>System Fields</FieldLegend>
            {systemFields.map((field) => renderSingleField(field))}
          </FieldSet>
        )}

        {hiddenFields.map((field) => (
          <input key={field.name} type="hidden" name={field.name} />
        ))}
      </FieldGroup>
    )
  }

  function renderDefaultButtons() {
    return (
      <div className="flex justify-end gap-3 pt-4">
        {config.onCancel && (
          <Button type="button" variant="outline" onClick={config.onCancel} disabled={isPending}>
            {config.cancelLabel ?? "Cancel"}
          </Button>
        )}
        <Button type="submit" form={formId} disabled={isPending}>
          {isPending ? "Saving\u2026" : config.submitLabel ?? "Save"}
        </Button>
      </div>
    )
  }

  return (
    <FormContext.Provider value={form}>
      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-6"
      >
        {config.renderAboveFields?.(formValues)}
        {renderLayout()}
        {config.renderBelowFields?.(formValues)}
        {props.children}
        {!props.renderSubmitOutside && !props.hideDefaultButtons && renderDefaultButtons()}
      </form>
      {props.renderSubmitOutside && !props.hideDefaultButtons && renderDefaultButtons()}
    </FormContext.Provider>
  )
}
