import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@aloysius-web/ui/components/card";
import {
  IconCalendarEvent,
  IconHeart,
  IconUsers,
} from "@tabler/icons-react";

export function OBHomeSection({
  settings,
  obMembers = [],
  obEvents = [],
  obDonations = [],
}: {
  settings?: Record<string, string>;
  obMembers?: any[];
  obEvents?: any[];
  obDonations?: any[];
} = {}) {
  const heading = settings?.ob_heading || "OLD BOYS' ASSOCIATION";
  const description =
    settings?.ob_description ||
    "The Aloysian Legacy Continues. Stay connected with fellow alumni, explore upcoming events, and support the college community.";

  const HEAD_ROLES = [
  "PATRON",
  "JESUIT REPRESENTATIVE",
  "PARISH PRIEST",
  "PRESIDENT",
  "VICE PRESIDENT - ADMINISTRATION",
  "VICE PRESIDENT - ACADEMICS",
  "VICE PRESIDENT - SOCIAL & CURRICULAR EVENTS",
  "VICE PRESIDENT - FUNDRAISING",
  "VICE PRESIDENT - MEMBERSHIP",
  "VICE PRESIDENT - PLAYGROUND & SPORTS",
  "SECRETARY",
  "ASSISTANT SECRETARY",
  "TREASURER",
  "ASSISTANT TREASURER",
];

  const approved = (obMembers ?? [])
    .filter((m: any) => m.status === "approved")
    .filter(
      (m: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x.id === m.id) === idx,
    );

  const headCommittee = approved.filter((m: any) =>
    HEAD_ROLES.includes((m.role || "").toUpperCase()),
  );

  const publishedEvents = (obEvents ?? []).filter(
    (e: any) => e.status === "published",
  );

  const confirmedDonations = (obDonations ?? []).filter(
    (d: any) => d.status === "confirmed",
  );

  const totalRaised = confirmedDonations.reduce(
    (sum: number, d: any) => sum + (d.amount || 0),
    0,
  );

  return (
    <section className="bg-[#013405] py-24 sm:py-[120px] px-4 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1180px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 lg:mb-16">
          <div>
            <h2 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] text-cream m-0">
              {heading}
            </h2>
            <p className="text-[15px] text-cream/60 max-w-[60ch] mt-4">
              {description}
            </p>
          </div>
          <Link
            to="/ob"
            className="text-gold font-bold text-sm border-b-2 border-gold pb-1.5 whitespace-nowrap hover:text-gold-light transition-colors"
          >
            Full Directory &rarr;
          </Link>
        </div>

        {/* Head Committee Grid */}
        {headCommittee.length > 0 && (
          <div className="mb-16 lg:mb-20">
            <div className="flex items-center gap-3 mb-6">
              <IconUsers className="size-5 text-gold" />
              <h3 className="text-[11px] tracking-[0.2em] font-bold text-gold">
                HEAD COMMITTEE
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {headCommittee.map((member: any) => (
                <Card
                  key={member.id}
                  className="bg-cream/[0.03] border-gold/20 overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-5">
                      <div className="w-12 h-12 shrink-0 overflow-hidden rounded-sm bg-cream/10">
                        {member.photo ? (
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-heading text-lg text-gold/60">
                            {member.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-cream leading-tight truncate">
                          {member.name}
                        </div>
                        <div className="text-[10px] text-gold tracking-wider mt-1 uppercase">
                          {member.role}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Events Grid */}
        {publishedEvents.length > 0 && (
          <div className="mb-16 lg:mb-20">
            <div className="flex items-center gap-3 mb-6">
              <IconCalendarEvent className="size-5 text-gold" />
              <h3 className="text-[11px] tracking-[0.2em] font-bold text-gold">
                UPCOMING EVENTS
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {publishedEvents.slice(0, 3).map((event: any) => (
                <Link
                  key={event.id}
                  to="/ob"
                  className="group block bg-green-dark border-2 border-gold hover:bg-gold transition-colors duration-300"
                >
                  <div className="relative w-full overflow-hidden">
                    {event.coverImage ? (
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className="w-full aspect-[16/9] object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full aspect-[16/9] bg-green-dark/5 flex items-center justify-center">
                        <span className="text-[11px] tracking-widest text-green-dark/30 font-semibold">
                          EVENT
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 lg:p-5">
                    <div className="font-heading text-base sm:text-lg font-semibold leading-snug text-green-dark group-hover:underline">
                      {event.title}
                    </div>
                    {event.location && (
                      <div className="text-[13px] text-green-dark/50 mt-1.5">
                        {event.location}
                      </div>
                    )}
                    {event.eventDate && (
                      <div className="text-[11px] tracking-wider text-gold mt-2.5 font-bold">
                        {new Date(event.eventDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Donations */}
        {confirmedDonations.length > 0 && (
          <div className="mb-12 lg:mb-16">
            <div className="flex items-center gap-3 mb-6">
              <IconHeart className="size-5 text-gold" />
              <h3 className="text-[11px] tracking-[0.2em] font-bold text-gold">
                SUPPORT
              </h3>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div>
                <div className="font-heading text-4xl sm:text-5xl font-semibold text-cream">
                  LKR {totalRaised.toLocaleString()}
                </div>
                <div className="text-cream/50 mt-2">
                  {confirmedDonations.length} donation{confirmedDonations.length !== 1 ? "s" : ""} received
                </div>
              </div>
              <div className="flex-1 max-w-xl">
                <div className="border-t border-gold/10">
                  {confirmedDonations.slice(0, 5).map((d: any) => {
                    const date = d.donatedAt
                      ? new Date(d.donatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : null;
                    return (
                      <div
                        key={d.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 py-3 border-b border-gold/10 px-4 hover:bg-green-darker transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-cream/5 flex items-center justify-center shrink-0">
                            <span className="text-gold/70 font-bold text-[11px]">
                              {(d.isAnonymous ? "A" : d.donorName?.charAt(0) || "?").toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-[12px] text-cream/80 truncate">
                              {d.isAnonymous ? "Anonymous" : d.donorName}
                            </div>
                            <div className="text-[11px] text-cream/40 truncate">
                              {d.purpose || "General Contribution"}
                              {date ? ` • ${date}` : ""}
                            </div>
                          </div>
                        </div>
                        <span className="text-[12px] text-gold/80 font-semibold shrink-0 sm:ml-3">
                          {d.currency === "USD" ? "USD " : "LKR "}
                          {(d.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {headCommittee.length === 0 && publishedEvents.length === 0 && confirmedDonations.length === 0 && (
          <div className="text-center text-cream/30 py-12">
            The Old Boys&apos; Association section is being updated. Check back soon.
          </div>
        )}
      </div>
    </section>
  );
}
