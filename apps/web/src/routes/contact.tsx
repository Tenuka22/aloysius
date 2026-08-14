import { useRef, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
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
  component: ContactPage,
});

function ContactPage() {
  const { settings } = Route.useLoaderData();
  const s = (key: string) => settings[key] || DEFAULTS[key] || "";

  const heroRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

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

  const handleSend = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in your name, email and message.");
      return;
    }
    const to = s("contact_email");
    const body = `From: ${name} <${email}>\n\n${message}`;
    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject || "Website enquiry")}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    toast.success("Opening your email client to send the message.");
  };

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
      <Navbar />
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

            <div data-animate className="bg-cream-warm border border-green-dark/12 border-t-2 border-t-gold px-8 sm:px-12 py-13">
              <h2 className="text-2xl sm:text-[38px] mb-2.5">Send a Message</h2>
              <p className="text-sm text-green-dark/65 mb-9">{s("contact_form_note")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5.5">
                <label className="block">
                  <span className="block text-[11px] tracking-[0.14em] font-bold mb-2">FULL NAME</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full box-border border border-green-dark/25 bg-cream px-3.5 py-3.25 text-sm text-green-dark outline-none"
                  />
                </label>
                <label className="block">
                  <span className="block text-[11px] tracking-[0.14em] font-bold mb-2">EMAIL</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full box-border border border-green-dark/25 bg-cream px-3.5 py-3.25 text-sm text-green-dark outline-none"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="block text-[11px] tracking-[0.14em] font-bold mb-2">SUBJECT</span>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Admissions enquiry"
                    className="w-full box-border border border-green-dark/25 bg-cream px-3.5 py-3.25 text-sm text-green-dark outline-none"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="block text-[11px] tracking-[0.14em] font-bold mb-2">MESSAGE</span>
                  <textarea
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Your message"
                    className="w-full box-border border border-green-dark/25 bg-cream px-3.5 py-3.25 text-sm text-green-dark outline-none resize-y"
                  />
                </label>
              </div>
              <div className="flex items-center justify-between gap-5 mt-7.5 flex-wrap">
                <span className="text-xs text-green-dark/50">Responses within school working days.</span>
                <button
                  onClick={handleSend}
                  className="bg-green-dark text-gold font-extrabold text-sm tracking-wider px-9 py-3.5"
                >
                  SEND MESSAGE
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </div>
  );
}
