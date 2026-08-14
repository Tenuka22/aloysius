"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@tanstack/react-router";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandYoutube,
  IconMapPin,
  IconPhone,
  IconMail,
  IconClock,
  IconArrowUp,
  IconSend,
} from "@tabler/icons-react";
import { toast } from "sonner";

gsap.registerPlugin(ScrollTrigger);

const exploreLinks = [
  { label: "About", to: "/about" },
  { label: "Academics", to: "/academics" },
  { label: "Student Life", to: "/students" },
  { label: "Achievements", to: "/achievements" },
  { label: "Gallery", to: "/gallery" },
];
const communityLinks = [
  { label: "Admissions", to: "/admissions" },
  { label: "Principals", to: "/principals" },
  { label: "News & Events", to: "/news-events" },
  { label: "Alumni", to: "/alumni" },
  { label: "Contact", to: "/contact" },
];

const socials = [
  { name: "facebook", label: "Facebook", Icon: IconBrandFacebook },
  { name: "instagram", label: "Instagram", Icon: IconBrandInstagram },
  { name: "youtube", label: "YouTube", Icon: IconBrandYoutube },
];

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="group relative inline-flex w-fit items-center text-sm text-cream/65 hover:text-cream transition-colors">
      {children}
      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gold transition-all duration-300 ease-out group-hover:w-full" />
    </Link>
  );
}

export function Footer({ settings }: { settings?: Record<string, string> } = {}) {
  const ref = useRef<HTMLElement>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const address = settings?.address || "St. Aloysius' College\nTemplars' Road\nGalle 80000\nSouthern Province, Sri Lanka";
  const phone = settings?.contact_phone || "091 2 333 233";
  const email = settings?.contact_email || "info@aloysiuscollege.lk";
  const officeHours = settings?.office_hours || "Monday - Friday, 7:30am - 2:30pm";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll("[data-animate]"),
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error("Enter your email to stay connected.");
      return;
    }
    const mailto = `mailto:${email}?subject=${encodeURIComponent(
      "Newsletter Subscription",
    )}&body=${encodeURIComponent(`Please add ${newsletterEmail} to the College newsletter list.`)}`;
    window.location.href = mailto;
    toast.success("Opening your email client to confirm your subscription.");
    setNewsletterEmail("");
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer
      ref={ref}
      role="contentinfo"
      className="relative overflow-hidden bg-gradient-to-b from-green-darker to-black text-cream"
    >
      <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

      {/* Ambient glow + watermark */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--gold) 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -bottom-24 hidden h-125 w-auto opacity-[0.04] sm:block"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-295 px-4 sm:px-6 lg:px-12 pt-24 sm:pt-32 pb-10">
        {/* Brand moment + newsletter */}
        <div
          data-animate
          className="grid grid-cols-1 lg:grid-cols-[1.2fr_auto] gap-10 lg:gap-16 items-end pb-14 sm:pb-18 border-b border-cream/10"
        >
          <div>
            <img src="/logo.png" alt="St. Aloysius' College crest" className="h-16 w-auto object-contain mb-6" />
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] leading-[1.1]">
              St. Aloysius&rsquo; College
            </h2>
            <p className="font-heading italic text-xl sm:text-2xl text-gold mt-2">Certa Viriliter</p>
            <p className="text-sm text-cream/55 max-w-md mt-5 leading-relaxed">
              A Catholic institution of academic and moral excellence, forming young men of
              competence, conscience and compassion in Galle, Sri Lanka.
            </p>
          </div>

          <div className="w-full lg:w-90">
            <div className="text-[11px] tracking-[0.24em] font-bold text-gold mb-3.5">
              STAY CONNECTED
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex items-stretch gap-0">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Your email address"
                aria-label="Email address"
                className="min-w-0 flex-1 border border-cream/20 bg-cream/[0.04] px-4 py-3.25 text-sm text-cream placeholder:text-cream/40 outline-none transition-colors focus:border-gold"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="flex items-center justify-center gap-1.5 bg-gold px-4 text-green-dark transition-colors hover:bg-gold-light"
              >
                <IconSend className="size-4" stroke={2} />
              </button>
            </form>
            <p className="text-xs text-cream/40 mt-3">
              News, admissions updates and event invitations - no spam.
            </p>
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 py-14 sm:py-16">
          <nav data-animate aria-label="Explore links">
            <h3 className="text-[11px] tracking-[0.24em] font-bold text-gold mb-5">EXPLORE</h3>
            <ul className="flex flex-col gap-3.5">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink to={link.to}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav data-animate aria-label="Community links">
            <h3 className="text-[11px] tracking-[0.24em] font-bold text-gold mb-5">COMMUNITY</h3>
            <ul className="flex flex-col gap-3.5">
              {communityLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink to={link.to}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          <div data-animate className="col-span-2 lg:col-span-1">
            <h3 className="text-[11px] tracking-[0.24em] font-bold text-gold mb-5">CONNECT</h3>
            <ul className="flex flex-col gap-4 text-sm text-cream/70">
              <li className="flex items-start gap-3">
                <IconMapPin className="size-4 shrink-0 mt-0.5 text-gold/70" stroke={1.75} />
                <address className="not-italic whitespace-pre-line leading-relaxed">{address}</address>
              </li>
              <li className="flex items-center gap-3">
                <IconPhone className="size-4 shrink-0 text-gold/70" stroke={1.75} />
                <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-cream transition-colors">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <IconMail className="size-4 shrink-0 text-gold/70" stroke={1.75} />
                <a href={`mailto:${email}`} className="hover:text-cream transition-colors break-all">
                  {email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <IconClock className="size-4 shrink-0 text-gold/70" stroke={1.75} />
                <span>{officeHours}</span>
              </li>
            </ul>
          </div>

          <div data-animate>
            <h3 className="text-[11px] tracking-[0.24em] font-bold text-gold mb-5">FOLLOW</h3>
            <div className="flex gap-3" role="list" aria-label="Social media links">
              {socials.map(({ name, label, Icon }) => (
                <a
                  key={name}
                  href={`https://${name}.com/aloysiuscollege`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  role="listitem"
                  className="group flex size-10 items-center justify-center border border-cream/20 text-cream/70 transition-all duration-300 hover:scale-110 hover:border-gold hover:bg-gold hover:text-green-dark"
                >
                  <Icon className="size-4.5" stroke={1.75} />
                </a>
              ))}
            </div>
            <Link
              to="/admin"
              className="mt-8 hidden lg:inline-block text-xs text-cream/35 hover:text-cream/60 transition-colors"
            >
              Staff Login
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 border-t border-cream/10 pt-7 text-[12.5px] text-cream/45">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-5 text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} St. Aloysius&rsquo; College, Galle. All Rights Reserved.</span>
            <span className="hidden sm:inline text-cream/25">&bull;</span>
            <a href="#" className="hover:text-cream/70 transition-colors">
              Privacy Policy
            </a>
            <span className="text-cream/25">&bull;</span>
            <a href="#" className="hover:text-cream/70 transition-colors">
              Terms of Use
            </a>
          </div>

          <div className="flex items-center gap-5">
            <span className="tracking-[0.2em] text-cream/35">CERTA VIRILITER</span>
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              className="group flex size-9 items-center justify-center rounded-full border border-cream/20 transition-all duration-300 hover:border-gold hover:bg-gold"
            >
              <IconArrowUp
                className="size-4 text-cream/70 transition-colors group-hover:text-green-dark"
                stroke={1.75}
              />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
