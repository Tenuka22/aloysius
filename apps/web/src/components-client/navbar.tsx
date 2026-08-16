"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { UserMenu } from "@/components-client/user-menu";
import {
  IconHome2,
  IconUsers,
  IconMenu2,
} from "@tabler/icons-react";

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
  const location = useLocation();

  const schoolName = settings?.school_name || "ST. ALOYSIUS\u2019 COLLEGE";
  const isOBRoute =
    location.pathname === "/ob" ||
    location.pathname.startsWith("/admin/ob");

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        [logoRef.current, linksRef.current, ctaRef.current],
        { opacity: 0, y: -18 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 },
      );
    }, header);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const el = mobileMenuRef.current;
    if (!el) return;
    if (mobileMenuOpen) {
      gsap.fromTo(
        el,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.4, ease: "power2.out" },
      );
    } else {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.3, ease: "power2.in" });
    }
  }, [mobileMenuOpen]);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full bg-green-dark text-cream">
      <div
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-gold/80 via-gold/40 to-transparent"
        aria-hidden="true"
      />

      {isOBRoute ? (
        <div className="relative mx-auto flex h-14 items-center gap-2 px-4 sm:px-6 lg:px-12 flex-row justify-between">
          {/* Logo */}
          <a
            href="/"
            aria-label={`${schoolName} - Home`}
            ref={logoRef}
            className="flex items-center gap-2 shrink-0 group"
          >
            <img
              src="/logo.png"
              alt={`${schoolName} crest`}
              className="h-8 w-auto object-contain"
            />
          </a>

          {/* Right Side - 2 icon buttons */}
          <div ref={ctaRef} className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex size-9 items-center justify-center text-cream/90 hover:text-gold transition-colors duration-300"
              aria-label="Home"
            >
              <IconHome2 className="size-5" />
            </Link>
            <Link
              to="/ob"
              className="inline-flex size-9 items-center justify-center text-cream/90 hover:text-gold transition-colors duration-300"
              aria-label="Old Boys Association"
            >
              <IconUsers className="size-5" />
            </Link>
            <button
              className="lg:hidden inline-flex size-9 items-center justify-center text-cream hover:text-gold transition-colors duration-300 relative mx-auto"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <IconMenu2 className="size-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative mx-auto flex h-[78px] max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-12 flex-row justify-between">
          {/* Logo */}
          <a
            href="/"
            aria-label={`${schoolName} - Home`}
            ref={logoRef}
            className="flex items-center gap-3 shrink-0 group"
          >
            <div className="relative">
              <img
                src="/logo.png"
                alt={`${schoolName} crest`}
                className="h-11 w-auto object-contain"
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: "radial-gradient(circle, color-mix(in oklab, var(--gold) 15%, transparent) 0%, transparent 70%)",
                }}
              />
            </div>
            <span className="logo-text leading-[1.15] origin-left hidden sm:block">
              <span className="block font-extrabold text-[15px] tracking-[0.08em]">{schoolName}</span>
              <span className="block text-[10px] tracking-[0.32em] text-gold/90 font-semibold">
                GALLE &bull; SRI LANKA
              </span>
            </span>
          </a>

          {/* Nav Links */}
          <nav
            ref={linksRef}
            aria-label="Main navigation"
            className="hidden xl:flex items-center gap-1 ml-auto"
          >
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="relative px-4 py-2 text-[13px] font-semibold tracking-wide text-cream/90 hover:text-gold transition-colors duration-300 whitespace-nowrap"
                activeProps={{
                  className: "!text-gold",
                }}
                activeOptions={{ exact: item.to === "/" }}
              >
                <span className="relative z-10">{item.label}</span>
                <span
                  className="absolute inset-x-2 bottom-0.5 h-0.5 bg-gold origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                  style={{ transformOrigin: "left" }}
                />
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div ref={ctaRef} className="flex items-center gap-2 xl:ml-6">
            <Link
              to="/admissions"
              className="hidden sm:inline-flex items-center gap-2 bg-gold text-green-dark px-4 py-2 text-[12px] font-bold tracking-wider hover:bg-gold-light transition-all duration-300 relative overflow-hidden group"
            >
              <span className="relative z-10">Admissions</span>
              <div className="absolute inset-0 bg-gradient-to-r from-gold-light to-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <UserMenu />
            <button
              className="xl:hidden inline-flex size-9 items-center justify-center text-cream hover:text-gold transition-colors duration-300 relative mx-auto"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <div className="relative w-5 h-4 flex flex-col justify-between">
                <span
                  className="block h-0.5 w-full bg-current transition-all duration-300 origin-center"
                  style={{
                    transform: mobileMenuOpen ? "rotate(45deg) translate(2px, 2px)" : "none",
                  }}
                />
                <span
                  className="block h-0.5 w-full bg-current transition-all duration-300"
                  style={{
                    opacity: mobileMenuOpen ? 0 : 1,
                    transform: mobileMenuOpen ? "translateX(-4px)" : "none",
                  }}
                />
                <span
                  className="block h-0.5 w-full bg-current transition-all duration-300 origin-center"
                  style={{
                    transform: mobileMenuOpen ? "rotate(-45deg) translate(2px, -2px)" : "none",
                  }}
                />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {!isOBRoute && (
        <div
          ref={mobileMenuRef}
          className="xl:hidden overflow-hidden bg-green-dark/98 backdrop-blur-sm"
          style={{ height: 0, opacity: 0 }}
        >
          <div className="px-4 py-6 space-y-1 border-b-gold-light bg-green-darker">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-sm font-semibold text-cream/90 hover:text-gold hover:bg-green-darker/50 transition-all duration-300 border-l-2 border-transparent hover:border-gold -ml-px"
                activeProps={{ className: "!text-gold !border-gold" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-gold/15">
              {!isSignedIn && (
                <div className="flex gap-2">
                  <Link
                    to="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center border border-gold/50 text-gold px-3 py-2.5 text-[12px] font-bold tracking-wider hover:bg-gold/10 transition-colors duration-300"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/sign-up"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center border border-gold/50 text-gold px-3 py-2.5 text-[12px] font-bold tracking-wider hover:bg-gold/10 transition-colors duration-300"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
