"use client"

import { useRef, useEffect, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Link } from "@tanstack/react-router"
import { UserMenu } from "@/components-client/user-menu"

gsap.registerPlugin(ScrollTrigger)

export function Navbar() {
  const headerRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [logoRef.current, linksRef.current, ctaRef.current],
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
      )
    }, headerRef)

    return () => ctx.revert()
  }, [])

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" aria-label="Aloysius College - Home" ref={logoRef} className="flex items-center gap-2 shrink-0">
          <div className="size-10 rounded-full bg-muted flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6 text-muted-foreground">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="leading-none">
            <div className="text-sm font-bold tracking-wide">ALOYSIUS COLLEGE</div>
            <div className="text-[10px] tracking-widest text-muted-foreground">NIL DESPERANDUM</div>
          </div>
        </a>

        {/* Nav Links */}
        <nav ref={linksRef} aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
          {[
            { label: "About Us", to: "/about" },
            { label: "Student Works", to: "/student-works" },
            { label: "Achievements", to: "/achievements" },
            { label: "Gallery", to: "/gallery" },
            { label: "News & Events", to: "/news-events" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div ref={ctaRef} className="flex items-center gap-3">
          <UserMenu />
          <button
            className="lg:hidden inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
