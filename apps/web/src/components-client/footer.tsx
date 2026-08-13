"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@tanstack/react-router";

gsap.registerPlugin(ScrollTrigger);

const collegeLinks = [
  { label: "About", to: "/about" },
  { label: "Student Works", to: "/student-works" },
  { label: "Achievements", to: "/achievements" },
  { label: "Admissions", to: "/admissions" },
];
const communityLinks = [
  { label: "Gallery", to: "/gallery" },
  { label: "News & Events", to: "/news-events" },
  { label: "Admin", to: "/admin" },
];

const socials = [
  {
    name: "facebook",
    label: "Facebook",
    initials: "f",
  },
  {
    name: "instagram",
    label: "Instagram",
    initials: "ig",
  },
  {
    name: "youtube",
    label: "YouTube",
    initials: "yt",
  },
];

export function Footer({ settings }: { settings?: Record<string, string> } = {}) {
  const ref = useRef<HTMLElement>(null);

  const address = settings?.address || "St. Aloysius' College\nTemplars' Road\nGalle 80000\nSouthern Province, Sri Lanka";
  const phone = settings?.contact_phone || "091 2 333 233";
  const email = settings?.contact_email || "info@aloysiuscollege.lk";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-animate]"),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={ref} role="contentinfo" className="bg-green-darker text-cream border-t-2 border-gold">
      <div className="mx-auto max-w-295 px-4 sm:px-6 lg:px-12 pt-16 sm:pt-22.5 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr] gap-10 lg:gap-14">
          {/* Brand */}
          <div data-animate>
            <img src="/logo.png" alt="St. Aloysius' College crest" className="h-27.5 w-auto object-contain mb-5.5" />
            <div className="font-extrabold text-[17px] tracking-[0.06em]">ST. ALOYSIUS&rsquo; COLLEGE</div>
            <div className="text-[11px] tracking-[0.26em] text-gold mt-1">GALLE, SRI LANKA</div>
            <div className="font-heading italic text-lg text-cream/70 mt-4">
              Certa Viriliter
            </div>
          </div>

          {/* College */}
          <nav data-animate aria-label="College links">
            <h3 className="text-[11px] tracking-[0.24em] font-bold text-gold mb-5">COLLEGE</h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              {collegeLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-cream/80 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Community */}
          <nav data-animate aria-label="Community links">
            <h3 className="text-[11px] tracking-[0.24em] font-bold text-gold mb-5">COMMUNITY</h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              {communityLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-cream/80 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div data-animate>
            <h3 className="text-[11px] tracking-[0.24em] font-bold text-gold mb-5">CONTACT</h3>
            <div className="flex flex-col gap-2.5 text-sm text-cream/80">
              <address className="not-italic whitespace-pre-line">{address}</address>
              <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-gold transition-colors">
                {phone}
              </a>
              <a href={`mailto:${email}`} className="hover:text-gold transition-colors">
                {email}
              </a>
              <div className="flex gap-3 mt-2.5" role="list" aria-label="Social media links">
                {socials.map((social) => (
                  <a
                    key={social.name}
                    href={`https://${social.name}.com/aloysiuscollege`}
                    aria-label={social.label}
                    role="listitem"
                    className="size-8.5 border border-cream/35 flex items-center justify-center text-[11px] font-bold hover:border-gold hover:text-gold transition-colors"
                  >
                    {social.initials}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-cream/15 mt-17.5 pt-6.5 flex flex-col sm:flex-row justify-between gap-5 text-[12.5px] text-cream/55">
          <span>&copy; {new Date().getFullYear()} St. Aloysius&rsquo; College, Galle. All Rights Reserved.</span>
          <span className="tracking-[0.2em]">CERTA VIRILITER</span>
        </div>
      </div>
    </footer>
  );
}
