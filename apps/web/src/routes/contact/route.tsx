import { useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { PageError } from "@/components-client/page-error";
import { client } from "@/utils/orpc";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DEFAULTS: Record<string, string> = {
  contact_page_title: "Contact the College",
  address: "St. Aloysius' College\nTemplars' Road\nGalle 80000\nSouthern Province, Sri Lanka",
  contact_phone: "091 2 333 233",
  contact_email: "info@aloysiuscollege.lk",
  office_hours: "Monday - Friday, 7:30am - 2:30pm",
  contact_form_note: "Enquiries are directed to the College office.",
};

export const Route = createFileRoute("/contact")({
  loader: async () => {
    const settings = await client.settings.getAll();
    return { settings };
  },
  staleTime: 5 * 60_000,
  errorComponent: PageError,
  component: ContactPage,
});

function ContactPage() {
  const { settings } = Route.useLoaderData();
  const s = (key: string) => settings[key] || DEFAULTS[key] || "";

  const heroRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      for (const ref of [heroRef, detailsRef]) {
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

  const address = s("address");
  const mapQuery = encodeURIComponent(address.replace(/\n/g, ", "));

  return (
    <div className="min-h-screen bg-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>
      <Navbar settings={settings} />
      <main id="main-content">
        {/* Hero */}
        <section
          ref={heroRef}
          className="relative bg-green-dark text-cream overflow-hidden pt-27.5 pb-22.5 px-4 sm:px-6 lg:px-12"
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
              &nbsp;/&nbsp;<span className="text-gold">CONTACT</span>
            </div>
            <h1 data-animate className="text-5xl sm:text-6xl lg:text-[72px] leading-[1.02] m-0">
              {s("contact_page_title")}
            </h1>
          </div>
        </section>

        {/* Details and form */}
        <section ref={detailsRef} className="bg-cream py-20 sm:py-25 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-295 grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-16 lg:gap-20 items-start">
            <div data-animate>
              <div className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-6.5">
                COLLEGE OFFICE
              </div>
              <div className="flex flex-col">
                <div className="py-5.5 border-b border-green-dark/12">
                  <div className="text-[11px] tracking-[0.18em] font-bold text-green-dark/55 mb-2">
                    ADDRESS
                  </div>
                  <div className="text-[15.5px] leading-[1.6] whitespace-pre-line">{address}</div>
                </div>
                <div className="py-5.5 border-b border-green-dark/12">
                  <div className="text-[11px] tracking-[0.18em] font-bold text-green-dark/55 mb-2">
                    TELEPHONE
                  </div>
                  <a
                    href={`tel:${s("contact_phone").replace(/\s+/g, "")}`}
                    className="text-[15.5px] text-green-dark/60 hover:text-red-brand transition-colors"
                  >
                    {s("contact_phone")}
                  </a>
                </div>
                <div className="py-5.5 border-b border-green-dark/12">
                  <div className="text-[11px] tracking-[0.18em] font-bold text-green-dark/55 mb-2">
                    EMAIL
                  </div>
                  <a
                    href={`mailto:${s("contact_email")}`}
                    className="text-[15.5px] text-green-dark/60 hover:text-red-brand transition-colors"
                  >
                    {s("contact_email")}
                  </a>
                </div>
                <div className="py-5.5">
                  <div className="text-[11px] tracking-[0.18em] font-bold text-green-dark/55 mb-2">
                    OFFICE HOURS
                  </div>
                  <div className="text-[15.5px] text-green-dark/60">{s("office_hours")}</div>
                </div>
              </div>
              <div className="mt-9 relative h-65">
                <iframe
                  src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="St. Aloysius' College location"
                />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute left-3.5 bottom-3 bg-green-dark text-gold font-bold text-[11px] tracking-[0.12em] px-3.5 py-1.75"
                >
                  VIEW ON MAP
                </a>
              </div>
            </div>

            <div data-animate className="flex flex-col gap-8">
              {/* College photo */}
              <div className="overflow-hidden border border-green-dark/12">
                <img
                  src="/old1.png"
                  alt="St. Aloysius' College"
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Social links */}
              <div className="border border-green-dark/12 border-t-2 border-t-gold bg-cream-warm px-8 py-10">
                <h2 className="text-2xl sm:text-[38px] mb-2.5">Connect With Us</h2>
                <p className="text-sm text-green-dark/65 mb-9">
                  Follow the college on social media for updates and events.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      key: "footer_social_facebook",
                      label: "Facebook",
                      icon: (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      ),
                    },
                    {
                      key: "footer_social_instagram",
                      label: "Instagram",
                      icon: (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                        </svg>
                      ),
                    },
                    {
                      key: "footer_social_youtube",
                      label: "YouTube",
                      icon: (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      ),
                    },
                  ].map((social) => {
                    const url = s(social.key);
                    if (!url) return null;
                    return (
                      <a
                        key={social.key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col items-center justify-center bg-green-dark text-gold py-8 px-4 hover:bg-green-dark/90 transition-colors"
                      >
                        <span className="mb-3">{social.icon}</span>
                        <span className="text-[11px] tracking-[0.18em] font-bold">{social.label.toUpperCase()}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </div>
  );
}
