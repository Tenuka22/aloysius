import { useRef, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DEFAULTS: Record<string, string> = {
  admissions_title: "Become an Aloysian",
  admissions_subtitle:
    "Everything a parent needs to know about joining St. Aloysius' College - process, requirements and key dates.",
  admissions_notice_text: "",
  admissions_step1_title: "Review Requirements",
  admissions_step1_desc: "Check eligibility and the documents needed before applying.",
  admissions_step2_title: "Submit Application",
  admissions_step2_desc: "Complete and hand in the official application form by the deadline.",
  admissions_step3_title: "Interview / Selection",
  admissions_step3_desc: "Shortlisted families are invited for the selection process.",
  admissions_step4_title: "Enrolment",
  admissions_step4_desc: "Successful applicants complete enrolment and join the College.",
  requirement1: "Completed official application form",
  requirement2: "Birth certificate and identity documents",
  requirement3: "Proof of residence",
  requirement4: "Previous school records where applicable",
  requirement5: "Requirements per Ministry of Education circulars",
  date1_label: "Applications open",
  date1_value: "",
  date2_label: "Application deadline",
  date2_value: "",
  date3_label: "Interviews / selection",
  date3_value: "",
  date4_label: "Term begins",
  date4_value: "",
  download1_title: "Grade 1 Application Form",
  download1_url: "#",
  download2_title: "Admission Instructions & Circular",
  download2_url: "#",
  download3_title: "Required Documents Checklist",
  download3_url: "#",
  faq1_q: "When do admissions open?",
  faq1_a: "Answer text managed by the school office.",
  faq2_q: "What grades accept new students?",
  faq2_a: "Answer text managed by the school office.",
  faq3_q: "What documents are required?",
  faq3_a: "Answer text managed by the school office.",
  faq4_q: "How are applicants selected?",
  faq4_a: "Answer text managed by the school office.",
  admissions_cta_title: "Still have questions?",
  admissions_cta_desc: "The College office is happy to help.",
  admissions_cta_button_text: "Contact the College",
  admissions_cta_button_url: "mailto:admissions@aloysiuscollege.lk",
};

export const Route = createFileRoute("/admissions")({
  head: () => ({
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap",
      },
    ],
  }),
  loader: async () => {
    const settings = await client.settings.getAll();
    return { settings };
  },
  staleTime: 5 * 60_000,
  component: AdmissionsPage,
});

function AdmissionsPage() {
  const { settings: settingsRaw } = Route.useLoaderData();
  const settings = settingsRaw as Record<string, string>;
  const s = (key: string) => settings[key] || DEFAULTS[key] || "";

  const heroRef = useRef<HTMLElement>(null);
  const processRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLElement>(null);
  const downloadsRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      for (const ref of [heroRef, processRef, detailsRef, downloadsRef, faqRef]) {
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

  const steps = [1, 2, 3, 4].map((i) => ({
    num: `0${i}`,
    title: s(`admissions_step${i}_title`),
    body: s(`admissions_step${i}_desc`),
  }));

  const requirements = [1, 2, 3, 4, 5].map((i) => s(`requirement${i}`)).filter(Boolean);
  const dates = [1, 2, 3, 4].map((i) => ({
    label: s(`date${i}_label`),
    value: s(`date${i}_value`),
  }));
  const downloads = [1, 2, 3].map((i) => ({
    title: s(`download${i}_title`),
    url: s(`download${i}_url`) || "#",
  }));
  const faqs = [1, 2, 3, 4].map((i) => ({
    q: s(`faq${i}_q`),
    a: s(`faq${i}_a`),
  }));

  return (
    <div className="min-h-screen bg-[#FFF8E7]" style={{ fontFamily: "'Manrope', sans-serif" }}>
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
          className="relative bg-[#013405] text-[#FFF8E7] overflow-hidden py-32.5 sm:pt-32.5 sm:pb-27.5 px-4 sm:px-6 lg:px-12"
        >
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none opacity-[0.07] hidden sm:block"
            style={{ right: -90, top: -60, height: 480, width: "auto" }}
          />
          <div className="relative mx-auto max-w-295">
            <div data-animate className="text-xs tracking-[0.2em] text-[#FFF8E7]/60 mb-6.5">
              <a href="/" className="hover:text-[#FFB203] transition-colors">
                HOME
              </a>
              &nbsp;/&nbsp;<span className="text-[#FFB203]">ADMISSIONS</span>
            </div>
            <h1
              data-animate
              className="font-['Cormorant_Garamond'] font-semibold text-5xl sm:text-6xl lg:text-[76px] leading-[1.02] mb-6 max-w-[14ch]"
            >
              {s("admissions_title")}
            </h1>
            <p
              data-animate
              className="text-base sm:text-[17px] leading-[1.7] text-[#FFF8E7]/75 max-w-[56ch] mb-11"
            >
              {s("admissions_subtitle")}
            </p>
            <div data-animate className="flex gap-4 flex-wrap">
              <a
                href="#process"
                className="inline-flex items-center bg-[#FFB203] text-[#013405] font-extrabold text-sm px-8 py-3.75 hover:bg-[#FFD45A] transition-colors"
              >
                Application Process
              </a>
              <a
                href="#downloads"
                className="inline-flex items-center border border-[#FFF8E7]/60 text-[#FFF8E7] font-bold text-sm px-8 py-3.75 hover:border-[#FFB203] hover:text-[#FFB203] transition-colors"
              >
                Downloads
              </a>
            </div>
          </div>
        </section>

        {/* Priority notice */}
        {s("admissions_notice_text") && (
          <div className="bg-[#A51919] text-[#FFF8E7] px-4 sm:px-6 lg:px-12 py-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 text-[13.5px]">
            <span className="font-extrabold tracking-[0.12em] text-[11px] border border-[#FFF8E7]/50 px-2.5 py-1 shrink-0">
              IMPORTANT
            </span>
            <span>{s("admissions_notice_text")}</span>
            <a
              href="#dates"
              className="sm:ml-auto text-[#FFF8E7] font-bold text-xs border-b border-[#FFF8E7]/60 whitespace-nowrap hover:text-[#FFD45A] transition-colors"
            >
              Key dates &rarr;
            </a>
          </div>
        )}

        {/* Application Process */}
        <section
          id="process"
          ref={processRef}
          className="bg-[#FFF8E7] py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
        >
          <div className="mx-auto max-w-295">
            <div
              data-animate
              className="text-[11px] tracking-[0.4em] font-bold text-[#A51919] mb-4.5"
            >
              HOW TO APPLY
            </div>
            <h2
              data-animate
              className="font-['Cormorant_Garamond'] font-semibold text-4xl sm:text-5xl lg:text-[54px] mb-17.5"
            >
              The Application Process
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step) => (
                <div key={step.num} data-animate className="border-t-2 border-[#FFB203] pt-6.5">
                  <div className="font-['Cormorant_Garamond'] text-5xl font-semibold text-[#013405]/25 leading-none">
                    {step.num}
                  </div>
                  <div className="font-bold text-lg mt-4 mb-2.5">{step.title}</div>
                  <div className="text-sm leading-[1.7] text-[#013405]/70">{step.body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements & Key Dates */}
        <section
          ref={detailsRef}
          className="bg-[#fffdf6] border-t border-[#013405]/8 py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
        >
          <div className="mx-auto max-w-295 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-start">
            <div data-animate>
              <div className="text-[11px] tracking-[0.4em] font-bold text-[#A51919] mb-4.5">
                REQUIREMENTS
              </div>
              <h2 className="font-['Cormorant_Garamond'] font-semibold text-3xl sm:text-[44px] mb-9">
                What You&rsquo;ll Need
              </h2>
              <div className="flex flex-col">
                {requirements.map((req, i) => (
                  <div
                    key={i}
                    className="flex gap-4.5 py-5 border-b border-[#013405]/10 items-baseline"
                  >
                    <span className="w-2 h-2 bg-[#FFB203] shrink-0 rotate-45" />
                    <span className="text-[15px] leading-[1.6] text-[#013405]/85">{req}</span>
                  </div>
                ))}
              </div>
            </div>
            <div id="dates" data-animate>
              <div className="text-[11px] tracking-[0.4em] font-bold text-[#A51919] mb-4.5">
                IMPORTANT DATES
              </div>
              <h2 className="font-['Cormorant_Garamond'] font-semibold text-3xl sm:text-[44px] mb-9">
                Key Dates
              </h2>
              <div className="bg-[#013405] text-[#FFF8E7] py-3">
                {dates.map((date, i) => (
                  <div
                    key={i}
                    className="flex justify-between gap-5 px-5 sm:px-8 py-5 border-b border-[#FFF8E7]/10 last:border-b-0"
                  >
                    <span className="text-sm font-semibold">{date.label}</span>
                    <span className="text-xs text-[#FFB203]">{date.value || "TBA"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Downloads */}
        <section
          id="downloads"
          ref={downloadsRef}
          className="bg-[#013405] text-[#FFF8E7] py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
        >
          <div className="mx-auto max-w-295">
            <div
              data-animate
              className="text-[11px] tracking-[0.4em] font-bold text-[#FFB203] mb-4.5"
            >
              DOWNLOADS
            </div>
            <h2
              data-animate
              className="font-['Cormorant_Garamond'] font-semibold text-4xl sm:text-5xl lg:text-[54px] mb-15"
            >
              Forms &amp; Documents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {downloads.map((dl, i) => (
                <a
                  key={i}
                  data-animate
                  href={dl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-5 border border-[#FFB203]/35 px-7 py-6.5 text-[#FFF8E7] hover:bg-[#062B0A] hover:border-[#FFB203] transition-colors"
                >
                  <span className="font-mono text-[11px] font-bold text-[#013405] bg-[#FFB203] px-2.5 py-2">
                    PDF
                  </span>
                  <span>
                    <span className="block font-bold text-[15px]">{dl.title}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section ref={faqRef} className="bg-[#FFF8E7] py-24 sm:py-30 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-215">
            <div
              data-animate
              className="text-[11px] tracking-[0.4em] font-bold text-[#A51919] mb-4.5"
            >
              FAQS
            </div>
            <h2
              data-animate
              className="font-['Cormorant_Garamond'] font-semibold text-4xl sm:text-5xl lg:text-[54px] mb-12.5"
            >
              Frequently Asked Questions
            </h2>
            <div>
              {faqs.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} className="border-b border-[#013405]/12">
                    <button
                      onClick={() => setOpenFaq(open ? -1 : i)}
                      className="w-full flex justify-between items-center gap-5 py-6.5 text-left"
                    >
                      <span className="font-bold text-[17px]">{faq.q}</span>
                      <span className="font-['Cormorant_Garamond'] text-3xl text-[#FFB203] leading-none shrink-0">
                        {open ? "−" : "+"}
                      </span>
                    </button>
                    {open && (
                      <div className="pb-6.5 text-[15px] leading-[1.7] text-[#013405]/75 max-w-[64ch]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div
              data-animate
              className="mt-15 bg-[#062B0A] text-[#FFF8E7] px-6 sm:px-12 py-11 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            >
              <div>
                <div className="font-['Cormorant_Garamond'] text-2xl sm:text-[28px] font-semibold">
                  {s("admissions_cta_title")}
                </div>
                <div className="text-sm text-[#FFF8E7]/65 mt-1.5">{s("admissions_cta_desc")}</div>
              </div>
              <a
                href={s("admissions_cta_button_url")}
                className="inline-flex items-center bg-[#FFB203] text-[#013405] font-extrabold text-sm px-7.5 py-3.5 whitespace-nowrap hover:bg-[#FFD45A] transition-colors"
              >
                {s("admissions_cta_button_text")}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </div>
  );
}
