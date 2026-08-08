"use client"

import * as React from "react"
import { cn } from "@aloysius-web/ui/lib/utils"
import { Toggle } from "@aloysius-web/ui/components/toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@aloysius-web/ui/components/tooltip"

interface ToolbarButtonProps extends React.ComponentProps<typeof Toggle> {
  isActive?: boolean
  tooltip?: string
}

export const ToolbarButton = ({
  isActive,
  children,
  tooltip,
  className,
  ...props
}: ToolbarButtonProps) => {
  const toggleButton = (
    <Toggle
      size="sm"
      className={cn("size-7 min-w-7 p-0", { "bg-accent": isActive }, className)}
      {...props}
    >
      {children}
    </Toggle>
  )

  if (!tooltip) return toggleButton

  return (
    <Tooltip>
      <TooltipTrigger render={toggleButton} />
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

ToolbarButton.displayName = "ToolbarButton"
