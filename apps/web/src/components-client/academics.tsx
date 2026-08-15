"use client";

import { useRef, useEffect, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  EXAM_TYPE_LABELS,
  EXAM_TYPE_SHORT,
  STREAM_LABELS,
  examYearLabel,
  gradeSummary,
  pickRandomTopPerformers,
} from "@/lib/exam-results";
import type { ExamResult } from "@/lib/exam-results";

gsap.registerPlugin(ScrollTrigger);

export function Academics({
  settings,
  stats,
  examResults = [],
}: {
  settings?: Record<string, string>;
  stats?: { id: string; value: string; label: string }[];
  examResults?: ExamResult[];
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-dept], [data-results]"),
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

  // Random spread of ~6 top performers per exam result (top 30 split into 6 bands).
  const shownPerformers = useMemo(() => {
    return examResults.map((result) => ({
      result,
      performers: pickRandomTopPerformers(result.students ?? [], 6, 30),
    }));
  }, [examResults]);

  const departments = [1, 2, 3, 4]
    .map((i) => ({
      num: `0${i}`,
      name: settings?.[`dept${i}_name`] ?? "",
      desc: settings?.[`dept${i}_desc`] ?? "",
    }))
    .filter((d) => d.name.trim().length > 0);

  const statRows = stats && stats.length > 0 ? stats.slice(0, 4) : [];
  const s = (key: string) => settings?.[key] ?? "";

  return (
    <section
      ref={sectionRef}
      className="text-cream py-24 sm:py-[120px] px-4 sm:px-6 lg:px-12"
      style={{ background: "linear-gradient(180deg, #013405, #062B0A)" }}
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
          <div>
            {s("academics_eyebrow") && (
              <div className="text-[11px] tracking-[0.4em] font-bold text-gold mb-4.5">
                {s("academics_eyebrow")}
              </div>
            )}
            <h2 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] m-0">
              {s("academics_heading")}
            </h2>
          </div>
          {s("academics_cta_text") && (
            <a
              href={s("academics_cta_url") || "/about"}
              className="text-gold font-bold text-sm border-b-2 border-gold pb-1.5 whitespace-nowrap hover:text-gold-light transition-colors"
            >
              {s("academics_cta_text")} &rarr;
            </a>
          )}
        </div>

        {departments.length > 0 && (
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
                <div className="font-heading text-[38px] text-gold font-semibold">{d.num}</div>
                <div className="font-bold text-[17px] mt-3.5 mb-2">{d.name}</div>
                <div className="text-[13px] leading-relaxed text-cream/65">{d.desc}</div>
              </div>
            ))}
          </div>
        )}

        {statRows.length > 0 && (
          <div className="flex flex-wrap gap-16 mt-18">
            {s("stats_heading") && (
              <div className="w-full font-heading text-2xl sm:text-3xl font-semibold text-cream">
                {s("stats_heading")}
              </div>
            )}
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

        {shownPerformers.length > 0 && (
          <div data-results className="mt-24 sm:mt-28">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
              <div>
                {s("results_eyebrow") && (
                  <div className="text-[11px] tracking-[0.4em] font-bold text-gold mb-4.5">
                    {s("results_eyebrow")}
                  </div>
                )}
                <h3 className="font-heading font-semibold text-3xl sm:text-4xl lg:text-[44px] leading-[1.08] m-0">
                  {s("results_heading") || "Exam Results"}
                </h3>
              </div>
              {s("results_cta_text") && (
                <a
                  href={s("results_cta_url") || "/exam-results"}
                  className="text-gold font-bold text-sm border-b-2 border-gold pb-1.5 whitespace-nowrap hover:text-gold-light transition-colors"
                >
                  {s("results_cta_text")} &rarr;
                </a>
              )}
            </div>

            <div className="space-y-14">
              {shownPerformers.map(({ result, performers }) => (
                <div key={result.id}>
                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-[11px] tracking-[0.26em] font-bold text-gold">
                      {EXAM_TYPE_SHORT[result.examType] ?? result.examType.toUpperCase()}
                    </span>
                    <span className="font-heading text-2xl font-semibold text-cream">
                      {examYearLabel(result)}
                    </span>
                    <span className="text-xs text-cream/50">
                      {EXAM_TYPE_LABELS[result.examType]} &bull; Top Performers
                    </span>
                  </div>

                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px border border-gold/20"
                    style={{ background: "rgba(255,178,3,0.2)" }}
                  >
                    {performers.map((student) => (
                      <div key={student.id} className="bg-green-dark/90 p-4 sm:p-5 flex flex-col">
                        {student.photo ? (
                          <div className="relative mb-3">
                            <img
                              src={student.photo}
                              alt={student.name}
                              className="aspect-square w-full object-cover"
                            />
                            <span className="absolute top-1.5 left-1.5 bg-gold text-green-dark text-[10px] font-extrabold px-1.5 py-0.5 tracking-wider">
                              #{student.sortOrder + 1}
                            </span>
                          </div>
                        ) : (
                          <div className="aspect-square w-full mb-3 flex items-center justify-center bg-cream/10">
                            <span className="font-heading text-4xl font-semibold text-gold/50">
                              {student.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="font-bold text-[13.5px] leading-snug">{student.name}</div>
                        {result.examType === "al" && student.stream && (
                          <div className="text-[10px] tracking-[0.18em] font-bold text-gold mt-1">
                            {STREAM_LABELS[student.stream] ?? student.stream.toUpperCase()}
                          </div>
                        )}
                        <div className="text-[11px] font-semibold text-cream/80 mt-1">
                          {gradeSummary(student)}
                        </div>
                        {student.quote && (
                          <p className="text-[11px] leading-relaxed text-cream/55 italic mt-2 line-clamp-3">
                            &ldquo;{student.quote}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
