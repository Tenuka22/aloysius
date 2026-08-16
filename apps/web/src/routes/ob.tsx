import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { client, orpc } from "@/utils/orpc";
import type { OBMember, OBEvent, OBDonation } from "@/lib/api-types";
import { useAuth } from "@clerk/tanstack-react-start";
import { Card, CardContent } from "@aloysius-web/ui/components/card";
import { Button } from "@aloysius-web/ui/components/button";
import { getAspectRatio, aspectRatioClass } from "@/lib/image-ratio";
import {
  IconCalendarEvent,
  IconHeart,
  IconUserPlus,
  IconPhoto,
  IconNews,
  IconSpeakerphone,
} from "@tabler/icons-react";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";

export const Route = createFileRoute("/ob")({
  beforeLoad: async () => {
    const settings = await client.settings.getAll();
    return { settings };
  },
  component: () => {
    const { settings } = Route.useRouteContext();
    return <OBPage settings={settings} />;
  },
});

export function OBFullContent({ settings }: { settings?: Record<string, string> } = {}) {
  const { isSignedIn } = useAuth();

  const { data: members = [] } = useQuery(orpc.ob.obMembers.list.queryOptions({ input: {} }));

  const { data: events = [], isLoading: eventsLoading } = useQuery(
    orpc.ob.obEvents.list.queryOptions({ input: {} }),
  );

  const { data: donations = [], isLoading: donationsLoading } = useQuery(
    orpc.ob.obDonations.list.queryOptions({ input: {} }),
  );

  const { data: obGalleries = [] } = useQuery(
    orpc.gallery.list.queryOptions({
      input: { scope: "ob", status: "published", pageSize: 12 },
      select: (result) => result.rows,
    }),
  );

  const { data: obNews = [] } = useQuery(
    orpc.ob.obNews.list.queryOptions({ input: { status: "published" } }),
  );

  const { data: obAnnouncements = [] } = useQuery(
    orpc.ob.obAnnouncements.list.queryOptions({ input: { status: "published" } }),
  );

  const { data: myMembership } = useQuery(
    orpc.ob.obMembers.myMembership.queryOptions({ enabled: isSignedIn }),
  );

  const isOBAdmin = myMembership?.isAdmin === true;

  const activeMembers = members.filter(
    (m: OBMember) => m.status === "approved" && m.role !== "ADMINISTRATOR",
  );

  const publishedEvents = events.filter((e: OBEvent) => e.status === "published");
  const confirmedDonations = donations.filter((d: OBDonation) => d.status === "confirmed");
  const totalConfirmed = confirmedDonations.reduce(
    (sum: number, d: OBDonation) => sum + (d.amount || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-green-dark text-cream py-16 px-4 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1180px] grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="text-[11px] tracking-[0.4em] font-bold text-gold mb-4">
              ST. ALOYSIUS&rsquo; COLLEGE
            </div>
            <h1 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05]">
              OLD BOYS&rsquo; ASSOCIATION <span className="text-gold">—</span>{" "}
              <span className="text-cream/80 text-2xl sm:text-3xl lg:text-4xl font-normal">
                The Aloysian Legacy Continues.
              </span>
            </h1>
          </div>
          <div className="overflow-hidden rounded-xl bg-cream/10 aspect-[16/10] hidden lg:flex items-center justify-center">
            {settings?.ob_archival_image_1 ? (
              <img
                src={settings.ob_archival_image_1}
                alt="Old Boys Association"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-cream/30 text-sm">Archival Photo</div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-12 py-16 space-y-20">
        {/* Archival Photos */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[settings?.ob_archival_image_1, settings?.ob_archival_image_2]
              .filter(Boolean)
              .map((src, i) => (
                <div key={i} className="overflow-hidden rounded-xl">
                  <img
                    src={src!}
                    alt={`Archival photograph ${i + 1}`}
                    className={`w-full ${aspectRatioClass(getAspectRatio(src!)) || "aspect-[4/3]"} object-cover`}
                  />
                </div>
              ))}
          </div>
        </section>

        {/* Committee Section */}
        <section>
          {(() => {
            const currentYear = String(new Date().getFullYear());
            const yearMembers = activeMembers.filter((m: OBMember) => m.year === currentYear || !m.year);
            const headRoles = [
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
            const headCommittee = yearMembers.filter((m: OBMember) =>
              headRoles.includes(m.role.toUpperCase()),
            );
            const regularMembers = yearMembers.filter(
              (m: OBMember) => !headRoles.includes(m.role.toUpperCase()),
            );

            return (
              <>
                {headCommittee.length > 0 && (
                  <div className="mb-12">
                    <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-green-dark mb-8">
                      Head Committee
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {headCommittee.map((member: OBMember) => (
                        <Card key={member.id} className="overflow-hidden border-gold/30">
                          <CardContent className="p-0">
                            <div className="flex gap-4 p-4">
                              {member.photo ? (
                                <img
                                  src={member.photo}
                                  alt={member.name}
                                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0">
                                  {member.name.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-sm text-green-dark">
                                  {member.name}
                                </div>
                                <div className="text-xs text-gold font-medium">{member.role}</div>
                                {member.bio && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {member.bio}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                {regularMembers.length > 0 && (
                  <div>
                    <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-green-dark mb-8">
                      Members
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {regularMembers.map((member: OBMember) => (
                        <Card key={member.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="flex gap-4 p-4">
                              {member.photo ? (
                                <img
                                  src={member.photo}
                                  alt={member.name}
                                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0">
                                  {member.name.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-sm text-green-dark">
                                  {member.name}
                                </div>
                                <div className="text-xs text-muted-foreground">{member.role}</div>
                                {member.bio && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {member.bio}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                {yearMembers.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No committee members for {currentYear} yet.
                  </div>
                )}
              </>
            );
          })()}
        </section>

        {/* Membership Request Section */}
        <section>
          <Card className="bg-green-dark text-cream">
            <CardContent className="p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-4">
                <IconUserPlus className="size-6 text-gold" />
                <h2 className="font-heading font-semibold text-2xl sm:text-3xl">
                  Join the Old Boys&apos; Association
                </h2>
              </div>
              <p className="text-cream/80 mb-6 max-w-2xl">
                Are you an alumnus of St. Aloysius&apos; College? Request membership to stay
                connected with the OB community.
              </p>
              {myMembership?.status === "approved" ? (
                <div className="bg-green-dark/50 border border-gold/30 rounded-lg p-4 text-center space-y-3">
                  <p className="text-gold font-semibold">You are an approved OB member.</p>
                  {isOBAdmin && (
                    <div>
                      <Button
                        render={<a href="/ob-admin" />}
                        className="bg-gold text-green-dark hover:bg-gold-light font-bold"
                      >
                        Open OB Panel
                      </Button>
                    </div>
                  )}
                </div>
              ) : myMembership?.status === "pending" ? (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                  <p className="text-yellow-300 font-semibold">
                    Your membership request is pending approval.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    render={
                      <a
                        href="/OB%20Membership%20Application.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                    nativeButton={false}
                    className="bg-gold text-green-dark hover:bg-gold-light font-bold"
                  >
                    Download Application Form
                  </Button>
                  <p className="text-cream/60 text-sm self-center">
                    Fill out the form and submit it to the OB office.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Events Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <IconCalendarEvent className="size-6 text-gold" />
            <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-green-dark">
              OB Events
            </h2>
          </div>
          {eventsLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : publishedEvents.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No events yet.</div>
          ) : (
            <div className="space-y-4">
              {publishedEvents.map((event: OBEvent) => (
                <Card key={event.id} className="overflow-hidden">
                  <CardContent className="p-5">
                    <h3 className="font-heading font-semibold text-xl text-green-dark mb-1">
                      {event.title}
                    </h3>
                    {event.location && (
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    )}
                    {event.eventDate && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.eventDate).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                        {event.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Donations Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <IconHeart className="size-6 text-red-brand" />
            <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-green-dark">
              Support Our Cause
            </h2>
          </div>
          {donationsLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-green-dark text-cream">
                <CardContent className="p-8 text-center">
                  <div className="text-5xl font-bold font-heading mb-2">
                    LKR {totalConfirmed.toLocaleString()}
                  </div>
                  <div className="text-cream/70">Total Confirmed Donations</div>
                  <div className="mt-4 text-sm text-cream/50">
                    {confirmedDonations.length} donation{confirmedDonations.length !== 1 ? "s" : ""}{" "}
                    received
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-8">
                  <h3 className="font-heading font-semibold text-xl text-green-dark mb-4">
                    Make a Donation
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Support the Old Boys&apos; Association initiatives.
                  </p>
                  <Button className="w-full bg-gold text-green-dark hover:bg-gold-light font-bold">
                    Contact Treasurer to Donate
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          {confirmedDonations.length > 0 && (
            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-bold tracking-[0.2em] text-red-brand">
                Recent Supporters
              </h3>
              {confirmedDonations.slice(0, 10).map((d: OBDonation) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between py-2 border-b border-green-dark/10"
                >
                  <div>
                    <span className="font-medium text-sm text-green-dark">
                      {d.isAnonymous ? "Anonymous" : d.donorName}
                    </span>
                    {d.purpose && (
                      <span className="text-xs text-muted-foreground ml-2">— {d.purpose}</span>
                    )}
                  </div>
                  <span className="font-semibold text-sm text-green-dark">
                    LKR {(d.amount || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* OB News Section */}
        {obNews.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <IconNews className="size-6 text-gold" />
              <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-green-dark">
                OB News
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {obNews.map((item) => (
                <Link
                  key={item.id}
                  to="/ob-news/$slug"
                  params={{ slug: item.slug }}
                  className="group block overflow-hidden rounded-xl border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        No cover image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {item.publishedAt && (
                      <span className="inline-block text-[10px] font-bold tracking-[0.15em] text-gold uppercase mb-1">
                        {new Date(item.publishedAt).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    <h3 className="font-heading font-semibold text-base text-green-dark line-clamp-1">
                      {item.title}
                    </h3>
                    {item.excerpt && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {item.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* OB Announcements Section */}
        {obAnnouncements.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <IconSpeakerphone className="size-6 text-gold" />
              <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-green-dark">
                OB Announcements
              </h2>
            </div>
            <div className="space-y-4">
              {obAnnouncements.map((item) => (
                <Link key={item.id} to="/ob-announcements/$slug" params={{ slug: item.slug }}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          {item.audience && (
                            <span className="inline-block text-[10px] font-bold tracking-[0.15em] text-gold uppercase mb-1">
                              {item.audience.charAt(0).toUpperCase() + item.audience.slice(1)}
                            </span>
                          )}
                          <h3 className="font-heading font-semibold text-xl text-green-dark mb-1">
                            {item.title}
                          </h3>
                          {item.excerpt && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.excerpt}
                            </p>
                          )}
                        </div>
                        {item.publishedAt && (
                          <p className="text-sm text-muted-foreground shrink-0">
                            {new Date(item.publishedAt).toLocaleDateString(undefined, {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Galleries Section */}
        {obGalleries.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <IconPhoto className="size-6 text-gold" />
              <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-green-dark">
                OB Galleries
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {obGalleries.map((g) => (
                <Link
                  key={g.id}
                  to="/gallery/$slug"
                  params={{ slug: g.slug }}
                  className="group block overflow-hidden rounded-xl border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {g.coverImage ? (
                      <img
                        src={g.coverImage}
                        alt={g.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        No cover image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="inline-block text-[10px] font-bold tracking-[0.15em] text-gold uppercase mb-1">
                      {g.obEventId ? "Event" : "Donation"}
                    </span>
                    <h3 className="font-heading font-semibold text-base text-green-dark line-clamp-1">
                      {g.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export function OBPage({ settings }: { settings?: Record<string, string> } = {}) {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar settings={settings} />
      <OBFullContent settings={settings} />
      <Footer settings={settings} />
    </div>
  );
}
