"use client";

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";
import {
  EXAM_TYPE_LABELS,
  EXAM_TYPE_SHORT,
  STREAM_LABELS,
  examYearLabel,
  gradeSummary,
  pickRandomTopPerformers,
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
    <div className="min-h-screen bg-[#FFF8E7]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:border focus:border-[#FFB203] focus:bg-[#013405] focus:px-4 focus:py-2 focus:text-sm focus:text-[#FFB203] focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar />

      {/* Hero */}
      <section className="bg-[#013405] text-[#FFF8E7] pt-20 pb-16 sm:pt-24 sm:pb-19 px-4 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-295">
          <div className="text-xs tracking-[0.2em] text-[#FFF8E7]/60 mb-6.5">
            <Link to="/" className="hover:text-[#FFB203] transition-colors">
              HOME
            </Link>
            &nbsp;/&nbsp;<span className="text-[#FFB203]">EXAM RESULTS</span>
          </div>
          <div className="flex items-center gap-4.5 mb-6.5">
            <span className="h-px w-12 bg-[#FFB203]/50 shrink-0" />
            <span className="text-[11px] tracking-[0.4em] font-bold text-[#FFB203]">
              TOP SCORES
            </span>
          </div>
          <h1 className="font-heading font-semibold text-5xl sm:text-6xl lg:text-[72px] leading-[1.02] m-0">
            Exam Results
          </h1>
          <p className="text-[15px] sm:text-base text-[#FFF8E7]/65 mt-6 max-w-[62ch]">
            The highest achievers of St. Aloysius&rsquo; College across the G5 Scholarship, G.C.E.
            O/L and G.C.E. A/L examinations.
          </p>

          <div className="flex gap-3 flex-wrap mt-11">
            {FILTERS.map((f) => {
              const active = f.value === filter;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className="text-xs font-bold tracking-widest px-4.5 py-2.25 transition-colors"
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
      <main
        id="main-content"
        className="bg-[#fffdf6] border-t border-[#013405]/[0.08] pt-16 sm:pt-20 pb-22.5 px-4 sm:px-6 lg:px-12"
      >
        <div className="mx-auto max-w-295">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-[#013405]/50">
              No results published yet.
            </div>
          ) : (
            <div className="space-y-18">
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
  const students = useMemo(
    () => pickRandomTopPerformers(result.students ?? [], 6, 30),
    [result],
  );
  const admissions = (result.universityAdmissions ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
  const admissionStudent = useMemo(() => {
    const byName = new Map(
      (result.students ?? [])
        .filter((s) => s.photo)
        .map((s) => [s.name.trim().toLowerCase(), s.photo]),
    );
    return (name: string) => byName.get(name.trim().toLowerCase());
  }, [result]);

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <span className="h-px w-8 bg-[#A51919]/40 shrink-0" />
            <span className="text-[11px] tracking-[0.26em] font-bold text-[#A51919]">
              {EXAM_TYPE_SHORT[result.examType] ?? result.examType.toUpperCase()}
            </span>
          </div>
          <h2 className="font-heading font-semibold text-4xl sm:text-[44px] leading-none text-[#013405] m-0">
            {examYearLabel(result)}
          </h2>
          <p className="text-sm text-[#013405]/55 mt-3">
            {EXAM_TYPE_LABELS[result.examType]} &bull; {result.students?.length ?? 0} top performers
            {result.examType === "al" && " across all streams"}
          </p>
        </div>
      </div>

      {students.length === 0 ? (
        <p className="text-[#013405]/40 text-sm py-8">No students recorded yet.</p>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px border border-[#013405]/15"
          style={{ background: "rgba(1,52,5,0.12)" }}
        >
          {students.map((student) => (
            <div key={student.id} className="bg-[#fffdf6] p-5 sm:p-6">
              <div className="flex items-center gap-4 mb-4">
                {student.photo ? (
                  <img
                    src={student.photo}
                    alt={student.name}
                    className="size-16 sm:size-18 object-cover border-2 border-[#FFB203]"
                  />
                ) : (
                  <div className="size-16 sm:size-18 bg-[#013405]/10 flex items-center justify-center">
                    <span className="font-heading text-2xl font-semibold text-[#013405]/40">
                      {student.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="bg-[#FFB203] px-2 py-0.5 text-[10.5px] tracking-[0.14em] font-bold text-[#013405]">
                      {`#${student.sortOrder + 1}`}
                    </span>
                    {result.examType === "al" && student.stream && (
                      <span className="text-[10.5px] font-bold tracking-[0.16em] text-[#A51919]">
                        {STREAM_LABELS[student.stream] ?? student.stream.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="font-heading text-xl sm:text-[22px] font-semibold leading-tight text-[#013405] truncate">
                    {student.name}
                  </div>
                  {gradeSummary(student) && (
                    <div className="text-[10.5px] font-bold tracking-[0.14em] text-[#013405]/55 uppercase mt-1">
                      {gradeSummary(student)}
                    </div>
                  )}
                </div>
              </div>

              {(student.subjects ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(student.subjects ?? []).map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 border border-[#013405]/12 bg-white px-2 py-0.5 text-[10.5px]"
                    >
                      <span className="text-[#013405]/70">{s.subject}</span>
                      {s.grade && <span className="font-extrabold text-[#A51919]">{s.grade}</span>}
                    </span>
                  ))}
                </div>
              )}

              {student.quote && (
                <p className="font-heading italic text-[16px] leading-relaxed text-[#013405]/60">
                  &ldquo;{student.quote}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {result.examType === "al" && admissions.length > 0 && (
        <div className="mt-10 bg-[#013405] text-[#FFF8E7]">
          <div className="flex items-center gap-4 border-b border-[#FFB203]/20 px-6 py-5">
            <span className="h-px w-8 bg-[#FFB203]/60 shrink-0" />
            <span className="text-[11px] tracking-[0.26em] font-bold text-[#FFB203]">
              UNIVERSITY ADMISSIONS
            </span>
            <span className="ml-auto text-[11px] tracking-[0.14em] font-bold text-[#FFF8E7]/50">
              {admissions.length} placement{admissions.length === 1 ? "" : "s"}
            </span>
          </div>
          <div>
            {admissions.map((admission) => (
              <div
                key={admission.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 border-b border-[#FFB203]/10 px-6 py-4 last:border-0"
              >
                <div className="flex items-center gap-3 sm:shrink-0 sm:w-[35%] min-w-0">
                  {admissionStudent(admission.studentName) ? (
                    <img
                      src={admissionStudent(admission.studentName) as string}
                      alt={admission.studentName}
                      className="size-11 shrink-0 object-cover border-2 border-[#FFB203]"
                    />
                  ) : (
                    <div className="size-11 shrink-0 bg-[#FFF8E7]/10 flex items-center justify-center">
                      <span className="font-heading text-lg font-semibold text-[#FFB203]/60">
                        {admission.studentName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="font-heading text-lg leading-snug font-semibold text-[#FFF8E7] min-w-0">
                    {admission.studentName}
                  </div>
                </div>
                <div className="sm:flex-1 text-[13px] font-bold text-[#FFB203] sm:text-center">{admission.university}</div>
                <div className="sm:flex-1 text-[13px] text-[#FFF8E7]/70 sm:text-center">{admission.course}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}