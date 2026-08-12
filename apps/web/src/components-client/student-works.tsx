"use client";

import { useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const categoryLabels: Record<string, string> = {
  film: "Short Film",
  art: "Digital Art",
  music: "Music",
  writing: "Writing",
  design: "UI/UX Design",
  photography: "Photography",
  code: "Code",
  other: "Other",
};

interface StudentWorkRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  studentNames: string[] | null;
  studentGrade: string | null;
  authorType: string | null;
  coverImage: string | null;
  contentUrl: string | null;
  tags: string[] | null;
}

export function StudentWorks({
  initialData,
  settings,
}: {
  initialData?: StudentWorkRow[];
  settings?: Record<string, string>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  const works = initialData ?? [];
  const heading = settings?.student_works_heading || "Latest Student Works";

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: headingRef.current, start: "top 90%", once: true },
        },
      );

      gsap.fromTo(
        ref.current?.children ?? [],
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div ref={headingRef} className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
              Showcase
            </span>
            <h2 className="text-2xl sm:text-3xl font-light">{heading}</h2>
          </div>
          <a
            href="/student-works"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            View All
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-4"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div ref={ref}>
          {works.length === 0 ? (
            <div className="w-full text-center text-muted-foreground py-12">
              No student works published yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {works.map((work) => (
                <Link
                  key={work.id}
                  to="/student-works/$slug"
                  params={{ slug: work.slug }}
                  className="group relative block pb-4"
                >
                  <span className="absolute inset-y-0 left-0 w-0 bg-primary/90 group-hover:w-full transition-all duration-700 ease-out -z-0" />
                  <div className="relative z-10 aspect-[3/4] bg-muted overflow-hidden mb-3">
                    {work.coverImage ? (
                      <img
                        src={work.coverImage}
                        alt={work.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          className="size-10 text-primary/30"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="inline-block text-[10px] font-medium uppercase tracking-wider bg-black/50 backdrop-blur-sm text-white px-2 py-1">
                        {categoryLabels[work.category] ?? work.category}
                      </span>
                    </div>
                  </div>
                  <div className="relative z-10 px-4 text-sm font-semibold mb-0.5 text-primary group-hover:text-white transition-colors">
                    {work.title}
                  </div>
                  <div className="relative z-10 px-4 text-xs text-primary/60 group-hover:text-white/70 transition-colors">
                    {work.studentNames && work.studentNames.length > 0
                      ? work.studentNames.join(", ")
                      : ""}
                    {work.studentGrade && ` · ${work.studentGrade}`}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
