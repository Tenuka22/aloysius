"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DEFAULTS: Record<string, string> = {
  principal_quote:
    "Every Aloysian carries forward a tradition of faith, discipline and excellence - certa viriliter.",
  principal_name: "The Principal",
};

export function PrincipalMessage({ settings }: { settings?: Record<string, string> }) {
  const sectionRef = useRef<HTMLElement>(null);
  const s = (key: string) => settings?.[key] || DEFAULTS[key] || "";
  const photo = settings?.principal_photo;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-animate]"),
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-cream-warm border-t border-green-dark/[0.08] py-24 sm:py-[110px] px-4 sm:px-6 lg:px-12"
    >
      <div className="mx-auto max-w-[1080px] grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 lg:gap-[72px] items-center">
        <div data-animate className="relative max-w-[340px] mx-auto lg:mx-0 w-full">
          <div className="absolute -right-3.5 -bottom-3.5 w-full h-full border border-gold -z-10 pointer-events-none" />
          {photo ? (
            <img src={photo} alt={s("principal_name")} className="w-full h-[420px] object-cover" />
          ) : (
            <div className="w-full h-[420px] flex items-center justify-center bg-gradient-to-br from-green-dark/10 to-green-dark/5">
              <span className="text-[11px] tracking-widest text-green-dark/40 font-semibold">
                PRINCIPAL PORTRAIT
              </span>
            </div>
          )}
        </div>
        <div data-animate>
          <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
            FROM THE PRINCIPAL
          </div>
          <p className="font-heading text-2xl sm:text-[32px] leading-[1.35] font-medium text-green-dark mb-6.5">
            &ldquo;{s("principal_quote")}&rdquo;
          </p>
          <div className="font-heading italic text-[28px] text-green-dark/50">
            &mdash; {s("principal_name")}
          </div>
          <div className="text-xs tracking-[0.16em] text-green-dark/60 my-1.5 mb-7.5">
            PRINCIPAL, ST. ALOYSIUS&rsquo; COLLEGE
          </div>
          <a
            href="/about"
            className="inline-flex items-center gap-2.5 font-bold text-sm text-green-dark border-b-2 border-gold pb-1.5"
          >
            Read the Full Message <span>&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
