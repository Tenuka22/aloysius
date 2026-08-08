"use client"

import { useCallback, useRef, useState } from "react"
import { cn } from "@aloysius-web/ui/lib/utils"
import { IconX } from "@tabler/icons-react"

interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function TagInput({ value, onChange, placeholder = "Add tags...", className }: TagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = useCallback(() => {
    const tag = inputValue.trim()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
    }
    setInputValue("")
  }, [inputValue, value, onChange])

  const removeTag = useCallback((tagToRemove: string) => {
    onChange(value.filter((t) => t !== tagToRemove))
  }, [value, onChange])

  return (
    <div
      className={cn(
        "flex min-h-8 flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
            className="ml-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50"
          >
            <IconX className="size-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            addTag()
          }
          if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
            removeTag(value[value.length - 1])
          }
        }}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex min-h-6 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  )
}
