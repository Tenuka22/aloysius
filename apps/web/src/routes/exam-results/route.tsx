"use client";

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";
import {
  EXAM_TYPE_LABELS,
  EXAM_TYPE_SHORT,
  STREAM_LABELS,
  examYearLabel,
  gradeSummary,
} from "@/lib/exam-results";
import type { ExamResult } from "@/lib/exam-results";

type Filter = "all" | "scholarship" | "ol" | "al";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "ALL EXAMS" },
  { value: "scholarship", label: "G5 SCHOLARSHIP" },
  { value: "ol", label: "G.C.E. O/L" },
  { value: "al", label: "G.C.E. A/L" },
];

export const Route = createFileRoute("/exam-results")({
  loader: async () => {
    const [resultsData, settings] = await Promise.all([
      client.examResults.list({
        page: 1,
        pageSize: 100,
        status: "published",
        sort: "resultsYear",
        sortDir: "desc",
      }),
      client.settings.getAll(),
    ]);
    const results = await Promise.all(
      resultsData.rows.map(async (r) => {
        const full = await client.examResults.get({ id: r.id });
        return full;
      }),
    );
    return { results, settings };
  },
  staleTime: 5 * 60_000,
  component: ExamResultsPage,
});

function ExamResultsPage() {
  const { results, settings } = Route.useLoaderData() as {
    results: ExamResult[];
    settings: Record<string, string>;
  };
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const list = filter === "all" ? results : results.filter((r) => r.examType === filter);
    return [...list].sort((a, b) => b.resultsYear - a.resultsYear || b.examYear - a.examYear);
  }, [results, filter]);

  return (
    <div className="min-h-screen bg-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar />

      {/* Hero */}
      <section className="bg-green-dark py-20 sm:py-28 px-4 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1080px]">
          <div className="text-xs tracking-[0.2em] text-cream/60 mb-6.5">
            <a href="/" className="hover:text-gold transition-colors">
              HOME
            </a>
            &nbsp;/&nbsp;<span className="text-gold">EXAM RESULTS</span>
          </div>
          <div className="text-[11px] tracking-[0.4em] font-bold text-gold mb-4">TOP SCORES</div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-[56px] font-bold text-cream leading-[1.1] mb-5">
            Exam Results
          </h1>
          <p className="text-cream/70 text-lg sm:text-xl max-w-[600px] leading-relaxed">
            The highest achievers of St. Aloysius&rsquo; College across the G5 Scholarship, G.C.E.
            O/L and G.C.E. A/L examinations.
          </p>

          <div className="flex gap-3 flex-wrap mt-10">
            {FILTERS.map((f) => {
              const active = f.value === filter;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className="text-xs font-bold tracking-widest px-4.5 py-2.5 transition-colors"
                  style={{
                    border: `1px solid ${active ? "#FFB203" : "rgba(255,178,3,0.4)"}`,
                    background: active ? "#FFB203" : "transparent",
                    color: active ? "#013405" : "#FFB203",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Results */}
      <main id="main-content" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1080px]">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-green-dark/40">No results published yet.</div>
          ) : (
            <div className="space-y-16">
              {filtered.map((result) => (
                <ResultSection key={result.id} result={result} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}

function ResultSection({ result }: { result: ExamResult }) {
  const students = [...(result.students ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-[11px] tracking-[0.26em] font-bold text-red-brand mb-2">
            {EXAM_TYPE_SHORT[result.examType] ?? result.examType.toUpperCase()}
          </div>
          <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-green-dark m-0">
            {examYearLabel(result)}
          </h2>
          <p className="text-sm text-green-dark/55 mt-1.5">
            {EXAM_TYPE_LABELS[result.examType]} &bull; {students.length} top performers
            {result.examType === "al" && " across all streams"}
          </p>
        </div>
      </div>

      {students.length === 0 ? (
        <p className="text-green-dark/40 text-sm py-8">No students recorded yet.</p>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px border border-green-dark/15"
          style={{ background: "rgba(1,52,5,0.12)" }}
        >
          {students.map((student) => (
            <div key={student.id} className="bg-cream p-5 sm:p-6">
              <div className="flex items-center gap-4 mb-4">
                {student.photo ? (
                  <img
                    src={student.photo}
                    alt={student.name}
                    className="size-16 sm:size-18 rounded-full object-cover border-2 border-gold"
                  />
                ) : (
                  <div className="size-16 sm:size-18 rounded-full bg-green-dark/10 flex items-center justify-center">
                    <span className="font-heading text-2xl font-semibold text-green-dark/40">
                      {student.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold tracking-wider text-gold bg-green-dark px-1.5 py-0.5">
                      #{student.sortOrder + 1}
                    </span>
                    {result.examType === "al" && student.stream && (
                      <span className="text-[10px] font-bold tracking-[0.16em] text-red-brand">
                        {STREAM_LABELS[student.stream] ?? student.stream.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-green-dark text-[15px] leading-snug mt-1.5 truncate">
                    {student.name}
                  </div>
                  <div className="text-xs font-semibold text-gold mt-0.5">
                    {gradeSummary(student)}
                  </div>
                </div>
              </div>

              {(student.subjects ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(student.subjects ?? []).map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded border border-green-dark/15 bg-white px-2 py-0.5 text-[11px]"
                    >
                      <span className="text-green-dark/70">{s.subject}</span>
                      {s.grade && <span className="font-extrabold text-gold">{s.grade}</span>}
                    </span>
                  ))}
                </div>
              )}

              {student.quote && (
                <p className="text-[12.5px] leading-relaxed text-green-dark/60 italic">
                  &ldquo;{student.quote}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
