import { useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DEFAULTS: Record<string, string> = {
  admissions_badge: "Join Us",
  admissions_title: "How to Apply",
  admissions_subtitle:
    "Become part of the St. Aloysius' College family. Follow these simple steps to begin your journey with us.",
  admissions_step1_title: "Review Requirements",
  admissions_step1_desc:
    "Check eligibility and the documents needed before applying. Ensure you meet the academic and age requirements for your desired grade level.",
  admissions_step2_title: "Submit Application",
  admissions_step2_desc:
    "Complete and hand in the official application form by the deadline. Include all required supporting documents.",
  admissions_step3_title: "Interview & Selection",
  admissions_step3_desc:
    "Shortlisted families are invited for the selection process. This includes an interview, entrance assessment, and interaction with faculty.",
  admissions_step4_title: "Enrolment",
  admissions_step4_desc:
    "Successful applicants complete enrolment and join the College. Confirm your place by attending orientation.",
  admissions_cta_title: "Ready to Apply?",
  admissions_cta_desc:
    "Download the application form or contact our admissions office for more information.",
  admissions_cta_button_text: "Contact Admissions",
  admissions_cta_button_url: "mailto:admissions@aloysiuscollege.lk",
  admissions_contact_email: "admissions@aloysiuscollege.lk",
};

export const Route = createFileRoute("/admissions")({
  loader: async () => {
    const [settings] = await Promise.all([client.settings.getAll()]);
    return { settings };
  },
  staleTime: 5 * 60_000,
  component: AdmissionsPage,
});

function AdmissionsPage() {
  const heroRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const { settings: settingsRaw } = Route.useLoaderData();
  const settings = settingsRaw as Record<string, string>;

  const getSetting = (key: string) => settings[key] || DEFAULTS[key] || "";

  const steps = [
    {
      title: getSetting("admissions_step1_title"),
      description: getSetting("admissions_step1_desc"),
    },
    {
      title: getSetting("admissions_step2_title"),
      description: getSetting("admissions_step2_desc"),
    },
    {
      title: getSetting("admissions_step3_title"),
      description: getSetting("admissions_step3_desc"),
    },
    {
      title: getSetting("admissions_step4_title"),
      description: getSetting("admissions_step4_desc"),
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" },
      );

      gsap.fromTo(
        stepsRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: stepsRef.current, start: "top 80%", once: true },
        },
      );

      gsap.fromTo(
        ctaRef.current?.querySelectorAll("[data-animate]") ?? [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ctaRef.current, start: "top 85%", once: true },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        {/* Hero */}
        <section ref={heroRef} className="py-16 sm:py-20">
          <div className="mx-auto max-w-5xl text-center px-4 sm:px-6 lg:px-8">
            <div
              data-animate
              className="inline-flex items-center gap-2 text-[#c9a227]/80 text-xs sm:text-sm font-medium tracking-widest uppercase mb-6"
            >
              <span className="w-8 h-px bg-[#c9a227]/40" />
              {getSetting("admissions_badge")}
              <span className="w-8 h-px bg-[#c9a227]/40" />
            </div>
            <h1
              data-animate
              className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight mb-4"
            >
              {getSetting("admissions_title")}
            </h1>
            <p data-animate className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {getSetting("admissions_subtitle")}
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 sm:py-20 bg-muted/30 border-y border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 data-animate className="text-2xl sm:text-3xl font-light mb-12">
              Admission Steps
            </h2>
            <div ref={stepsRef} className="max-w-4xl">
              {steps.map((step, i) => (
                <div
                  key={i}
                  data-animate
                  className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 md:gap-8 py-8 border-b border-border last:border-b-0"
                >
                  <div>
                    <h3 className="text-xl sm:text-2xl font-medium tracking-tight">
                      {step.title}
                    </h3>
                  </div>
                  <div>
                    <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section ref={ctaRef} className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div data-animate className="p-8 sm:p-12 rounded-none border border-border bg-card">
              <h2 className="text-2xl sm:text-3xl font-light mb-3">
                {getSetting("admissions_cta_title")}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg text-base sm:text-lg">
                {getSetting("admissions_cta_desc")}
              </p>
              <a
                href={getSetting("admissions_cta_button_url")}
                className="inline-flex items-center justify-center rounded-none border border-[#c9a227] bg-transparent px-8 py-3 text-sm font-medium text-[#c9a227] hover:bg-[#c9a227] hover:text-background transition-colors"
              >
                {getSetting("admissions_cta_button_text")}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
