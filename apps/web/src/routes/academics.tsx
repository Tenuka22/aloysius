import { useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DEFAULTS: Record<string, string> = {
  academics_title: "Academic Excellence",
  academics_intro:
    "Curriculum, streams and departments - from primary years to Advanced Level.",
  section1_grades: "GRADES 1-5",
  section1_name: "Primary Section",
  section1_desc: "Foundations in literacy, numeracy, faith and character.",
  section2_grades: "GRADES 6-11",
  section2_name: "Secondary Section",
  section2_desc: "The national curriculum through to G.C.E. Ordinary Level.",
  section3_grades: "GRADES 12-13",
  section3_name: "Advanced Level",
  section3_desc: "Specialised streams preparing students for university.",
  stream1_name: "Physical Science",
  stream1_desc: "Combined maths, physics, chemistry.",
  stream2_name: "Biological Science",
  stream2_desc: "Biology, chemistry, physics / agriculture.",
  stream3_name: "Commerce",
  stream3_desc: "Accounting, economics, business studies.",
  stream4_name: "Arts & Technology",
  stream4_desc: "Humanities, ICT and engineering technology.",
  dept_subject1_name: "Mathematics",
  dept_subject2_name: "Science",
  dept_subject3_name: "Sinhala",
  dept_subject4_name: "English",
  dept_subject5_name: "History & Religion",
  dept_subject6_name: "Commerce",
  dept_subject7_name: "ICT & Technology",
  dept_subject8_name: "Aesthetics (Art & Music)",
  dept_subject9_name: "Physical Education",
  results_cta_title: "Examination Results & Achievements",
  results_cta_subtitle: "O/L and A/L performance year by year.",
};

export const Route = createFileRoute("/academics")({
  loader: async () => {
    const settings = await client.settings.getAll();
    return { settings };
  },
  staleTime: 5 * 60_000,
  component: AcademicsPage,
});

function AcademicsPage() {
  const { settings: settingsRaw } = Route.useLoaderData();
  const settings = settingsRaw as Record<string, string>;
  const s = (key: string) => settings[key] || DEFAULTS[key] || "";

  const heroRef = useRef<HTMLElement>(null);
  const sectionsRef = useRef<HTMLElement>(null);
  const streamsRef = useRef<HTMLElement>(null);
  const deptsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      for (const ref of [heroRef, sectionsRef, streamsRef, deptsRef]) {
        gsap.fromTo(
          ref.current?.querySelectorAll("[data-animate]") ?? [],
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
          },
        );
      }
    });
    return () => ctx.revert();
  }, []);

  const sections = [1, 2, 3].map((i) => ({
    grades: s(`section${i}_grades`),
    name: s(`section${i}_name`),
    desc: s(`section${i}_desc`),
  }));

  const streams = [1, 2, 3, 4].map((i) => ({
    num: `0${i}`,
    name: s(`stream${i}_name`),
    desc: s(`stream${i}_desc`),
  }));

  const departments = Array.from({ length: 9 }, (_, i) => i + 1)
    .map((i) => ({
      name: s(`dept_subject${i}_name`),
      head: settings[`dept_subject${i}_head`],
    }))
    .filter((d) => d.name);

  return (
    <div className="min-h-screen bg-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        {/* Hero */}
        <section
          ref={heroRef}
          className="relative bg-green-dark text-cream overflow-hidden py-32.5 sm:pt-32.5 sm:pb-27.5 px-4 sm:px-6 lg:px-12"
        >
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none opacity-[0.07] hidden sm:block"
            style={{ right: -90, top: -60, height: 480, width: "auto" }}
          />
          <div className="relative mx-auto max-w-295">
            <div data-animate className="text-xs tracking-[0.2em] text-cream/60 mb-6.5">
              <a href="/" className="hover:text-gold transition-colors">
                HOME
              </a>
              &nbsp;/&nbsp;<span className="text-gold">ACADEMICS</span>
            </div>
            <h1 data-animate className="text-5xl sm:text-6xl lg:text-[76px] leading-[1.02] mb-6 max-w-[14ch]">
              {s("academics_title")}
            </h1>
            <p data-animate className="text-base sm:text-[17px] leading-[1.7] text-cream/75 max-w-[56ch]">
              {s("academics_intro")}
            </p>
          </div>
        </section>

        {/* Sections of Study */}
        <section ref={sectionsRef} className="bg-cream py-24 sm:py-30 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-295">
            <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
              THE COLLEGE
            </div>
            <h2 data-animate className="text-4xl sm:text-5xl lg:text-[54px] mb-16">
              Sections of Study
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {sections.map((sec, i) => (
                <div
                  key={i}
                  data-animate
                  className="border border-green-dark/15 border-t-2 border-t-gold px-8.5 py-10 bg-cream-warm"
                >
                  <div className="text-[11px] tracking-[0.2em] font-bold text-red-brand">{sec.grades}</div>
                  <div className="font-heading text-3xl font-semibold my-3.5">{sec.name}</div>
                  <div className="text-[14.5px] leading-[1.7] text-green-dark/75">{sec.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* A/L Streams */}
        <section
          ref={streamsRef}
          className="text-cream py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
          style={{ background: "linear-gradient(180deg, var(--green-dark), var(--green-darker))" }}
        >
          <div className="mx-auto max-w-295">
            <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-gold mb-4.5">
              ADVANCED LEVEL
            </div>
            <h2 data-animate className="text-4xl sm:text-5xl lg:text-[54px] mb-15">
              A/L Streams
            </h2>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px border border-gold/20"
              style={{ background: "rgba(255,178,3,0.2)" }}
            >
              {streams.map((stream) => (
                <div
                  key={stream.num}
                  data-animate
                  className="bg-green-dark hover:bg-green-darker transition-colors px-7 py-9"
                >
                  <div className="font-heading text-[38px] text-gold font-semibold">{stream.num}</div>
                  <div className="font-bold text-[17px] mt-3.5 mb-2">{stream.name}</div>
                  <div className="text-[13px] leading-relaxed text-cream/65">{stream.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Departments */}
        <section
          ref={deptsRef}
          className="bg-cream-warm border-t border-green-dark/8 py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
        >
          <div className="mx-auto max-w-295 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] gap-14 lg:gap-20 items-start">
            <div data-animate>
              <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
                DEPARTMENTS
              </div>
              <h2 className="text-3xl sm:text-[44px] mb-9">Subject Departments</h2>
              <div className="flex flex-col">
                {departments.map((dept, i) => (
                  <div
                    key={i}
                    className="flex justify-between gap-5 items-baseline py-5 border-b border-green-dark/10"
                  >
                    <span className="font-bold text-base">{dept.name}</span>
                    <span className="text-xs text-green-dark/50">{dept.head || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div data-animate className="flex flex-col gap-4">
              {settings.academics_image_1 ? (
                <img src={settings.academics_image_1} alt="" className="w-full h-70 object-cover" />
              ) : (
                <div className="w-full h-70 flex items-center justify-center bg-gradient-to-br from-green-dark/10 to-green-dark/5">
                  <span className="text-[11px] tracking-widest text-green-dark/40 font-semibold">
                    SCIENCE LABORATORY
                  </span>
                </div>
              )}
              {settings.academics_image_2 ? (
                <img
                  src={settings.academics_image_2}
                  alt=""
                  className="w-3/4 self-end h-45 object-cover"
                />
              ) : (
                <div className="w-3/4 self-end h-45 flex items-center justify-center bg-gradient-to-br from-green-dark/10 to-green-dark/5">
                  <span className="text-[11px] tracking-widest text-green-dark/40 font-semibold">
                    CLASSROOM
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Results CTA */}
        <section className="bg-green-dark text-cream py-20 sm:py-25 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-270 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div>
              <div className="font-heading text-3xl sm:text-[36px] font-semibold">{s("results_cta_title")}</div>
              <div className="text-sm text-cream/65 mt-2">{s("results_cta_subtitle")}</div>
            </div>
            <a
              href="/news-events"
              className="inline-flex items-center bg-gold text-green-dark font-extrabold text-sm px-8 py-3.75 whitespace-nowrap hover:bg-gold-light transition-colors"
            >
              View Results &rarr;
            </a>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </div>
  );
}
