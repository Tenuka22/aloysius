import { useRef, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    title: "Review Requirements",
    description:
      "Check eligibility and the documents needed before applying. Ensure you meet the academic and age requirements for your desired grade level.",
  },
  {
    number: "02",
    title: "Submit Application",
    description:
      "Complete and hand in the official application form by the deadline. Include all required supporting documents and the application fee.",
  },
  {
    number: "03",
    title: "Interview & Selection",
    description:
      "Shortlisted families are invited for the selection process. This includes an interview, entrance assessment, and interaction with faculty.",
  },
  {
    number: "04",
    title: "Enrolment",
    description:
      "Successful applicants complete enrolment and join the College. Confirm your place by paying the enrolment fee and attending orientation.",
  },
];

export const Route = createFileRoute("/admissions")({
  component: AdmissionsPage,
});

function AdmissionsPage() {
  const headingRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

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
        stepsRef.current?.children ?? [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: stepsRef.current, start: "top 85%", once: true },
        },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <section className="px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="mx-auto max-w-3xl">
            <div ref={headingRef}>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a227] mb-2 block">
                Join Us
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                How to Apply
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Become part of the St. Aloysius' College family. Follow these simple steps to begin your journey with us.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mx-auto max-w-3xl">
            <div ref={stepsRef} className="relative">
              <div className="absolute left-[23px] top-12 bottom-0 w-px bg-border" />

              {steps.map((step) => (
                <div key={step.number} className="relative flex gap-6 pb-12 last:pb-0">
                  <div className="shrink-0">
                    <div className="size-12 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{step.number}</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 p-8 rounded-2xl border bg-card text-center">
              <h3 className="text-2xl font-semibold mb-3">Ready to Apply?</h3>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Download the application form or contact our admissions office for more information.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Download Application Form
                </Link>
                <a
                  href="mailto:admissions@aloysiuscollege.lk"
                  className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Contact Admissions
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
