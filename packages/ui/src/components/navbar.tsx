"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@aloysius-web/ui/lib/utils"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@aloysius-web/ui/components/navigation-menu"
import { Button } from "@aloysius-web/ui/components/button"

export interface NavItem {
  label: string
  href: string
}

export interface NavbarProps {
  logo?: React.ReactNode
  items: NavItem[]
  actions?: React.ReactNode
  className?: string
  onApplyNow?: () => void
}

export function Navbar({ logo, items, actions, className, onApplyNow }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleResize = useCallback(() => {
    if (window.innerWidth >= 768) setIsOpen(false)
  }, [])

  useEffect(() => {
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [handleResize])

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {logo && <div className="shrink-0">{logo}</div>}

        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            {items.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink
                  href={item.href}
                  className={navigationMenuTriggerStyle()}
                >
                  {item.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-3">
          {onApplyNow && (
            <Button
              size="sm"
              className="hidden sm:inline-flex bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onApplyNow}
            >
              Apply Now
            </Button>
          )}
          {actions}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="User account"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-5"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-5"
            >
              {isOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden border-t">
          <div className="space-y-1 px-4 py-3">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            {onApplyNow && (
              <Button
                size="sm"
                className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  onApplyNow()
                  setIsOpen(false)
                }}
              >
                Apply Now
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
