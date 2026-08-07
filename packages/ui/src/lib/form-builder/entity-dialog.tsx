"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@web-template/ui/components/dialog"
import { FormBuilder } from "./form-builder"

import type { FormConfig, FormBuilderProps } from "./types"

export type EntityDialogProps<TData extends Record<string, unknown>> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  config: FormConfig<TData>
  defaultValues: TData
  valibotSchema?: FormBuilderProps<TData>["valibotSchema"]
  queryKeysToInvalidate?: FormBuilderProps<TData>["queryKeysToInvalidate"]
  onSubmit: (values: TData) => Promise<void>
  actionLabel?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
  submitting?: boolean
}

const sizeClasses: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-2xl",
}

export function EntityDialog<TData extends Record<string, unknown>>({
  open,
  onOpenChange,
  title,
  description,
  config,
  defaultValues,
  valibotSchema,
  queryKeysToInvalidate,
  onSubmit,
  actionLabel,
  size = "lg",
  submitting,
}: EntityDialogProps<TData>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-h-[90vh] overflow-y-auto ${sizeClasses[size] ?? sizeClasses.lg}`}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <FormBuilder<TData>
          config={{
            ...config,
            submitLabel: actionLabel ?? "Save",
            onCancel: () => onOpenChange(false),
          }}
          defaultValues={defaultValues}
          valibotSchema={valibotSchema}
          queryKeysToInvalidate={queryKeysToInvalidate}
          onSubmit={onSubmit}
          formId="entity-dialog-form"
          submitting={submitting}
        />
      </DialogContent>
    </Dialog>
  )
}
