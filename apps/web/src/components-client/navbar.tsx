"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { UserMenu } from "@/components-client/user-menu";

gsap.registerPlugin(ScrollTrigger);

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Achievements", to: "/achievements" },
  { label: "Education", to: "/exam-results" },
  { label: "Gallery", to: "/gallery" },
  { label: "News & Events", to: "/news-events" },
  { label: "Contact", to: "/contact" },
  { label: "Alumni", to: "/ob" },
];

export function Navbar({ settings }: { settings?: Record<string, string> } = {}) {
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();

  const schoolName = settings?.school_name || "ST. ALOYSIUS\u2019 COLLEGE";

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [logoRef.current, linksRef.current, ctaRef.current],
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" },
      );
    }, headerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (mobileMenuRef.current) {
      if (mobileMenuOpen) {
        gsap.fromTo(
          mobileMenuRef.current,
          { height: 0, opacity: 0 },
          { height: "auto", opacity: 1, duration: 0.3, ease: "power2.out" },
        );
      } else {
        gsap.to(mobileMenuRef.current, { height: 0, opacity: 0, duration: 0.2, ease: "power2.in" });
      }
    }
  }, [mobileMenuOpen]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full bg-green-dark text-cream border-b border-gold/25"
    >
      <div className="mx-auto flex h-[78px] max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-12 flex-row justify-between">
        {/* Logo */}
        <a
          href="/"
          aria-label={`${schoolName} - Home`}
          ref={logoRef}
          className="flex items-center gap-3 shrink-0"
        >
          <img src="/logo.png" alt={`${schoolName} crest`} className="h-11 w-auto object-contain" />
          <span className="leading-[1.15] hidden sm:block">
            <span className="block font-extrabold text-[15px] tracking-[0.06em]">
              {schoolName}
            </span>
            <span className="block text-[10px] tracking-[0.28em] text-gold">
              GALLE &bull; SRI LANKA
            </span>
          </span>
        </a>

        {/* Nav Links */}
        <nav
          ref={linksRef}
          aria-label="Main navigation"
          className="hidden lg:flex items-center gap-6 ml-auto text-[13.5px] font-semibold"
        >
          {navLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="py-1.5 border-b-2 border-transparent text-cream hover:text-gold transition-colors whitespace-nowrap"
              activeProps={{
                className: "!text-gold !border-gold",
              }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div ref={ctaRef} className="flex items-center gap-3 lg:ml-6">
          <Link
            to="/admissions"
            className="hidden sm:inline-flex items-center bg-gold text-green-dark px-3 py-1.5 text-[12px] font-bold tracking-wider hover:bg-gold-light transition-colors whitespace-nowrap"
          >
            Admissions
          </Link>
          <UserMenu />
          <button
            className="lg:hidden inline-flex size-8 items-center justify-center text-cream hover:text-gold transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-5"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-5"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        ref={mobileMenuRef}
        className="lg:hidden overflow-hidden border-t border-gold/20 bg-green-dark"
        style={{ height: 0, opacity: 0 }}
      >
        <nav className="flex flex-col px-4 py-3 gap-1">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 text-sm font-semibold text-cream hover:text-gold transition-colors"
              activeProps={{ className: "!text-gold" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/admissions"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-2 inline-flex items-center justify-center bg-gold text-green-dark px-4 py-2 text-[12px] font-bold tracking-wider hover:bg-gold-light transition-colors"
          >
            Admissions
          </Link>
          {!isSignedIn && (
            <div className="flex gap-2 mt-2">
              <Link
                to="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 inline-flex items-center justify-center border border-gold/40 text-gold px-3 py-2 text-[12px] font-bold tracking-wider"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 inline-flex items-center justify-center border border-gold/40 text-gold px-3 py-2 text-[12px] font-bold tracking-wider"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
