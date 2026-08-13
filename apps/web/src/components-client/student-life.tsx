"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function LifeTile({
  src,
  label,
  className,
}: {
  src?: string;
  label: string;
  className?: string;
}) {
  return (
    <div data-tile className={`relative overflow-hidden ${className ?? ""}`}>
      {src ? (
        <img src={src} alt={label} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-green-dark/15 to-green-dark/5" />
      )}
      <div className="absolute left-4 sm:left-5 bottom-3 sm:bottom-4 bg-green-dark text-cream font-bold text-xs sm:text-[13px] tracking-[0.1em] px-3 sm:px-4 py-1.5 sm:py-2 pointer-events-none">
        {label}
      </div>
    </div>
  );
}

export function StudentLife({ settings }: { settings?: Record<string, string> }) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-tile]"),
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-cream py-24 sm:py-[120px] px-4 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1180px]">
        <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
          STUDENT LIFE
        </div>
        <h2 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] mb-12 sm:mb-15">
          The Aloysian Experience
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 auto-rows-[90px] sm:auto-rows-[110px] lg:auto-rows-[128px] gap-3 sm:gap-4">
          <LifeTile
            src={settings?.life_sports_image}
            label="SPORTS"
            className="col-span-2 sm:col-span-2 lg:col-span-3 row-span-3"
          />
          <LifeTile
            src={settings?.life_music_image}
            label="MUSIC & DRAMA"
            className="col-span-2 sm:col-span-2 lg:col-span-3 row-span-2"
          />
          <div
            data-tile
            className="col-span-1 sm:col-span-2 lg:col-span-2 row-span-1 bg-green-dark text-cream flex items-center justify-center text-center p-4"
          >
            <div>
              <div className="font-extrabold text-[15px] tracking-[0.08em]">
                CLUBS &amp; SOCIETIES
              </div>
              <div className="text-xs text-gold mt-1">Debate &bull; Science &bull; Media &bull; more</div>
            </div>
          </div>
          <div
            data-tile
            className="col-span-1 sm:col-span-1 lg:col-span-1 row-span-1 bg-red-brand text-cream flex items-center justify-center text-center font-extrabold text-sm tracking-[0.08em] p-3"
          >
            HOUSES
          </div>
          <LifeTile
            src={settings?.life_scouts_image}
            label="SCOUTS & CADETS"
            className="col-span-1 sm:col-span-2 lg:col-span-2 row-span-1"
          />
          <LifeTile
            src={settings?.life_faith_image}
            label="FAITH & SERVICE"
            className="col-span-1 sm:col-span-2 lg:col-span-2 row-span-1"
          />
          <div
            data-tile
            className="col-span-1 sm:col-span-1 lg:col-span-1 row-span-1 bg-gold text-green-dark flex items-center justify-center text-center font-extrabold text-[13px] tracking-[0.06em] p-3"
          >
            PREFECTS
          </div>
        </div>
      </div>
    </section>
  );
}
