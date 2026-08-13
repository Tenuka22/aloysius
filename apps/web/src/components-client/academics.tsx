"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_DEPARTMENTS = [
  { name: "Science & Mathematics", desc: "Physical sciences, biology and mathematics streams." },
  { name: "Languages & Humanities", desc: "Sinhala, English, Tamil, history and religion." },
  { name: "Commerce", desc: "Accounting, economics and business studies." },
  { name: "Technology & Aesthetics", desc: "ICT, engineering technology, art and music." },
];

export function Academics({
  settings,
  stats,
}: {
  settings?: Record<string, string>;
  stats?: { id: string; value: string; label: string }[];
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-dept]"),
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  const departments = [1, 2, 3, 4].map((i) => ({
    num: `0${i}`,
    name: settings?.[`dept${i}_name`] || DEFAULT_DEPARTMENTS[i - 1].name,
    desc: settings?.[`dept${i}_desc`] || DEFAULT_DEPARTMENTS[i - 1].desc,
  }));

  const statRows = stats && stats.length > 0 ? stats.slice(0, 4) : [];

  return (
    <section
      ref={sectionRef}
      className="text-cream py-24 sm:py-[120px] px-4 sm:px-6 lg:px-12"
      style={{ background: "linear-gradient(180deg, #013405, #062B0A)" }}
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
          <div>
            <div className="text-[11px] tracking-[0.4em] font-bold text-gold mb-4.5">
              ACADEMICS
            </div>
            <h2 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] m-0">
              Academic Excellence
            </h2>
          </div>
          <a
            href="/about"
            className="text-gold font-bold text-sm border-b-2 border-gold pb-1.5 whitespace-nowrap hover:text-gold-light transition-colors"
          >
            All Departments &rarr;
          </a>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px border border-gold/20"
          style={{ background: "rgba(255,178,3,0.2)" }}
        >
          {departments.map((d) => (
            <div
              key={d.num}
              data-dept
              className="bg-green-dark hover:bg-green-darker transition-colors px-7 py-9"
            >
              <div className="font-heading text-[38px] text-gold font-semibold">
                {d.num}
              </div>
              <div className="font-bold text-[17px] mt-3.5 mb-2">{d.name}</div>
              <div className="text-[13px] leading-relaxed text-cream/65">{d.desc}</div>
            </div>
          ))}
        </div>

        {statRows.length > 0 && (
          <div className="flex flex-wrap gap-16 mt-18">
            {statRows.map((stat) => (
              <div key={stat.id}>
                <div className="font-heading text-5xl font-semibold text-gold leading-none">
                  {stat.value}
                </div>
                <div className="text-xs tracking-[0.16em] text-cream/70 mt-2.5">
                  {stat.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
