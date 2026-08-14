import { useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";
import { client } from "@/utils/orpc";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DEFAULTS: Record<string, string> = {
  alumni_page_title: "Once an Aloysian, Always an Aloysian",
  alumni_page_intro: "The Old Boys' Association and the global Aloysian family.",
  branch1_name: "Galle (Main Branch)",
  branch1_contact: "",
  branch1_url: "#",
  branch2_name: "Colombo Branch",
  branch2_contact: "",
  branch2_url: "#",
  branch3_name: "Overseas Branches",
  branch3_contact: "",
  branch3_url: "#",
  notable1_name: "",
  notable1_field: "Public Service",
  notable2_name: "",
  notable2_field: "Academia",
  notable3_name: "",
  notable3_field: "Sport",
  notable4_name: "",
  notable4_field: "Arts & Culture",
  join_cta_title: "Reconnect with the College",
  join_cta_desc:
    "Register with the Old Boys' Association to receive news, event invitations and ways to give back.",
  join_cta_button_url: "#",
};

export const Route = createFileRoute("/alumni")({
  loader: async () => {
    const settings = await client.settings.getAll();
    return { settings };
  },
  staleTime: 5 * 60_000,
  component: AlumniPage,
});

function AlumniPage() {
  const { settings } = Route.useLoaderData();
  const s = (key: string) => settings[key] || DEFAULTS[key] || "";

  const heroRef = useRef<HTMLElement>(null);
  const branchesRef = useRef<HTMLElement>(null);
  const notablesRef = useRef<HTMLElement>(null);
  const joinRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      for (const ref of [heroRef, branchesRef, notablesRef, joinRef]) {
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

  const branches = [1, 2, 3].map((i) => ({
    name: s(`branch${i}_name`),
    contact: settings[`branch${i}_contact`],
    url: s(`branch${i}_url`) || "#",
  }));

  const notables = [1, 2, 3, 4]
    .map((i) => ({
      name: settings[`notable${i}_name`],
      field: s(`notable${i}_field`),
      photo: settings[`notable${i}_photo`],
    }))
    .filter((n) => n.name);

  const registerUrl = s("join_cta_button_url") !== "#" ? s("join_cta_button_url") : settings.contact_email ? `mailto:${settings.contact_email}` : "#";

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
              &nbsp;/&nbsp;<span className="text-gold">ALUMNI</span>
            </div>
            <h1 data-animate className="text-5xl sm:text-6xl lg:text-[76px] leading-[1.02] mb-6 max-w-[14ch]">
              {s("alumni_page_title")}
            </h1>
            <p data-animate className="text-base sm:text-[17px] leading-[1.7] text-cream/75 max-w-[56ch] mb-11">
              {s("alumni_page_intro")}
            </p>
            <div data-animate className="flex gap-4 flex-wrap">
              <a
                href="#join"
                className="inline-flex items-center bg-gold text-green-dark font-extrabold text-sm px-8 py-3.75 hover:bg-gold-light transition-colors"
              >
                Join the OBA
              </a>
              <a
                href="#distinguished"
                className="inline-flex items-center border border-cream/60 text-cream font-bold text-sm px-8 py-3.75 hover:border-gold hover:text-gold transition-colors"
              >
                Distinguished Aloysians
              </a>
            </div>
          </div>
        </section>

        {/* OBA Branches */}
        <section ref={branchesRef} className="bg-cream py-24 sm:py-30 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-295">
            <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-red-brand mb-4.5">
              THE ASSOCIATION
            </div>
            <h2 data-animate className="text-4xl sm:text-5xl lg:text-[54px] mb-15">
              OBA Branches Worldwide
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {branches.map((branch, i) => (
                <div
                  key={i}
                  data-animate
                  className="border border-green-dark/15 border-t-2 border-t-gold px-8 py-9.5 bg-cream-warm"
                >
                  <div className="font-heading text-3xl font-semibold">{branch.name}</div>
                  {branch.contact && (
                    <div className="text-[13px] text-green-dark/60 my-2.5">{branch.contact}</div>
                  )}
                  <a
                    href={branch.url}
                    className="inline-block mt-3.5 font-bold text-[13px] border-b-2 border-gold pb-1"
                  >
                    Branch Details &rarr;
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Distinguished Aloysians */}
        <section
          id="distinguished"
          ref={notablesRef}
          className="relative overflow-hidden bg-black text-cream py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(135deg, #000000, var(--green-dark))" }}
          />
          <div className="relative mx-auto max-w-295">
            <div data-animate className="text-[11px] tracking-[0.4em] font-bold text-gold mb-4.5">
              HALL OF FAME
            </div>
            <h2 data-animate className="text-4xl sm:text-5xl lg:text-[54px] mb-15">
              Distinguished Aloysians
            </h2>
            {notables.length === 0 ? (
              <div className="text-cream/50">No distinguished Aloysians published yet.</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-7">
                {notables.map((notable, i) => (
                  <div key={i} data-animate>
                    {notable.photo ? (
                      <img src={notable.photo} alt={notable.name} className="w-full h-65 object-cover" />
                    ) : (
                      <div className="w-full h-65 flex items-center justify-center bg-cream/5">
                        <span className="text-[10px] tracking-widest text-cream/40 font-semibold">
                          PORTRAIT
                        </span>
                      </div>
                    )}
                    <div className="font-bold text-base mt-4 mb-1">{notable.name}</div>
                    <div className="text-xs tracking-[0.12em] text-gold">
                      {notable.field.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Join CTA */}
        <section
          id="join"
          ref={joinRef}
          className="bg-cream-warm border-t border-green-dark/8 py-24 sm:py-30 px-4 sm:px-6 lg:px-12"
        >
          <div className="mx-auto max-w-190 text-center">
            <img src="/logo.png" alt="" className="h-24 w-auto mx-auto mb-7" />
            <h2 data-animate className="text-3xl sm:text-[50px] mb-4.5">
              {s("join_cta_title")}
            </h2>
            <p data-animate className="text-base leading-[1.7] text-green-dark/75 max-w-[52ch] mx-auto mb-10">
              {s("join_cta_desc")}
            </p>
            <div data-animate className="flex gap-4 justify-center flex-wrap">
              <a
                href={registerUrl}
                className="inline-flex items-center bg-green-dark text-gold font-extrabold text-sm px-8.5 py-3.75 hover:bg-green-darker transition-colors"
              >
                Register as a Member
              </a>
              <a
                href="/contact"
                className="inline-flex items-center border border-green-dark font-bold text-sm px-8.5 py-3.75 hover:border-red-brand hover:text-red-brand transition-colors"
              >
                Contact the OBA
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </div>
  );
}
