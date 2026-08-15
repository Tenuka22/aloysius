import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { client } from "@/utils/orpc";
import { useAuth } from "@clerk/tanstack-react-start";
import { Card, CardContent } from "@aloysius-web/ui/components/card";
import { Button } from "@aloysius-web/ui/components/button";
import { Input } from "@aloysius-web/ui/components/input";
import { getAspectRatio, aspectRatioClass } from "@/lib/image-ratio";
import {
  IconCalendarEvent,
  IconHeart,
  IconUserPlus,
  IconCheck,
  IconX,
  IconPlus,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useState } from "react";
import { Navbar } from "@/components-client/navbar";
import { Footer } from "@/components-client/footer";

export const Route = createFileRoute("/ob")({
  beforeLoad: async () => {
    const settings = await client.settings.getAll();
    return { settings };
  },
  component: () => {
    const { settings } = Route.useRouteContext({ from: "/ob" });
    return <OBPage settings={settings} />;
  },
});

export function OBFullContent({ settings }: { settings?: Record<string, string> } = {}) {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["ob-members"],
    queryFn: () => client.ob.obMembers.list({}),
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["ob-events"],
    queryFn: () => client.ob.obEvents.list({}),
  });

  const { data: donations = [], isLoading: donationsLoading } = useQuery({
    queryKey: ["ob-donations"],
    queryFn: () => client.ob.obDonations.list({}),
  });

  const { data: myMembership } = useQuery({
    queryKey: ["ob-my-membership"],
    queryFn: () => client.ob.obMembers.myMembership(),
    enabled: isSignedIn,
  });

  const isOBAdmin = myMembership?.isAdmin === true;

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    location: "",
    eventDate: "",
  });
  const [donationForm, setDonationForm] = useState({
    donorName: "",
    amount: "",
    purpose: "",
    message: "",
  });

  const eventMutation = useMutation({
    mutationFn: () =>
      client.ob.obEvents.create({ ...eventForm, eventDate: eventForm.eventDate || undefined }),
    onSuccess: () => {
      toast.success("Event submitted for approval");
      setEventForm({ title: "", description: "", location: "", eventDate: "" });
      queryClient.invalidateQueries({ queryKey: ["ob-events"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const donationMutation = useMutation({
    mutationFn: () =>
      client.ob.obDonations.create({
        ...donationForm,
        amount: donationForm.amount ? Number(donationForm.amount) : undefined,
      }),
    onSuccess: () => {
      toast.success("Donation submitted for approval");
      setDonationForm({ donorName: "", amount: "", purpose: "", message: "" });
      queryClient.invalidateQueries({ queryKey: ["ob-donations"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const publishEventMutation = useMutation({
    mutationFn: (id: string) =>
      client.ob.obEvents.update({ id, status: "published", publishNow: true }),
    onSuccess: () => {
      toast.success("Event published");
      queryClient.invalidateQueries({ queryKey: ["ob-events"] });
    },
  });

  const archiveEventMutation = useMutation({
    mutationFn: (id: string) => client.ob.obEvents.update({ id, status: "archived" }),
    onSuccess: () => {
      toast.success("Event archived");
      queryClient.invalidateQueries({ queryKey: ["ob-events"] });
    },
  });

  const confirmDonationMutation = useMutation({
    mutationFn: (id: string) =>
      client.ob.obDonations.update({ id, status: "confirmed" }),
    onSuccess: () => {
      toast.success("Donation confirmed");
      queryClient.invalidateQueries({ queryKey: ["ob-donations"] });
    },
  });

  const cancelDonationMutation = useMutation({
    mutationFn: (id: string) => client.ob.obDonations.update({ id, status: "cancelled" }),
    onSuccess: () => {
      toast.success("Donation cancelled");
      queryClient.invalidateQueries({ queryKey: ["ob-donations"] });
    },
  });

  const activeMembers = members.filter(
    (m: any) => m.status === "approved" && m.role !== "ADMINISTRATOR",
  );

  const publishedEvents = events.filter((e: any) => e.status === "published");
  const pendingEvents = events.filter((e: any) => e.status === "draft");
  const confirmedDonations = donations.filter((d: any) => d.status === "confirmed");
  const pendingDonations = donations.filter((d: any) => d.status === "pending");
  const totalConfirmed = confirmedDonations.reduce(
    (sum: number, d: any) => sum + (d.amount || 0),
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
            const yearMembers = activeMembers.filter((m: any) => m.year === currentYear || !m.year);
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
            const headCommittee = yearMembers.filter((m: any) =>
              headRoles.includes(m.role.toUpperCase()),
            );
            const regularMembers = yearMembers.filter(
              (m: any) => !headRoles.includes(m.role.toUpperCase()),
            );

            return (
              <>
                {headCommittee.length > 0 && (
                  <div className="mb-12">
                    <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-green-dark mb-8">
                      Head Committee
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {headCommittee.map((member: any) => (
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
                      {regularMembers.map((member: any) => (
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <IconCalendarEvent className="size-6 text-gold" />
              <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-green-dark">
                OB Events
              </h2>
            </div>
            {isOBAdmin && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  eventMutation.mutate();
                }}
                className="flex gap-2"
              >
                <Input
                  value={eventForm.title}
                  onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="New event title"
                  required
                  className="h-9 w-[200px]"
                />
                <Button
                  size="sm"
                  type="submit"
                  disabled={eventMutation.isPending}
                  className="bg-gold text-green-dark hover:bg-gold-light font-bold"
                >
                  <IconPlus className="size-4 mr-1" /> Add
                </Button>
              </form>
            )}
          </div>
          {eventsLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : events.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No events yet.</div>
          ) : (
            <div className="space-y-4">
              {publishedEvents.map((event: any) => (
                <Card key={event.id} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
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
                      </div>
                      {isOBAdmin && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => archiveEventMutation.mutate(event.id)}
                          >
                            Archive
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pendingEvents.length > 0 && isOBAdmin && (
                <div className="mt-8">
                  <h3 className="text-sm font-bold tracking-[0.2em] text-yellow-600 mb-4">
                    Pending Approval ({pendingEvents.length})
                  </h3>
                  <div className="space-y-4">
                    {pendingEvents.map((event: any) => (
                      <Card key={event.id} className="border-yellow-500/30">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
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
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                onClick={() => publishEventMutation.mutate(event.id)}
                                className="bg-green-dark text-cream hover:bg-green-darker"
                              >
                                <IconCheck className="size-4 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => archiveEventMutation.mutate(event.id)}
                              >
                                <IconX className="size-4 mr-1" /> Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Donations Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <IconHeart className="size-6 text-red-brand" />
              <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-green-dark">
                Support Our Cause
              </h2>
            </div>
            {isOBAdmin && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  donationMutation.mutate();
                }}
                className="flex gap-2"
              >
                <Input
                  value={donationForm.donorName}
                  onChange={(e) => setDonationForm((f) => ({ ...f, donorName: e.target.value }))}
                  placeholder="Donor name"
                  required
                  className="h-9 w-[180px]"
                />
                <Input
                  type="number"
                  value={donationForm.amount}
                  onChange={(e) => setDonationForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="Amount"
                  className="h-9 w-[120px]"
                />
                <Button
                  size="sm"
                  type="submit"
                  disabled={donationMutation.isPending}
                  className="bg-gold text-green-dark hover:bg-gold-light font-bold"
                >
                  <IconPlus className="size-4 mr-1" /> Add
                </Button>
              </form>
            )}
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
              {confirmedDonations.slice(0, 10).map((d: any) => (
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
          {pendingDonations.length > 0 && isOBAdmin && (
            <div className="mt-8">
              <h3 className="text-sm font-bold tracking-[0.2em] text-yellow-600 mb-4">
                Pending Donations ({pendingDonations.length})
              </h3>
              <div className="space-y-3">
                {pendingDonations.map((d: any) => (
                  <Card key={d.id} className="border-yellow-500/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">
                          {d.isAnonymous ? "Anonymous" : d.donorName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {d.amount ? `${d.currency} ${d.amount.toLocaleString()}` : "No amount"} •{" "}
                          {d.purpose || "General"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => confirmDonationMutation.mutate(d.id)}
                          className="bg-green-dark text-cream hover:bg-green-darker"
                        >
                          <IconCheck className="size-4 mr-1" /> Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelDonationMutation.mutate(d.id)}
                        >
                          <IconX className="size-4 mr-1" /> Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </section>
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

  const committee = (obMembers ?? []).filter(
    (m: any) => m.status === "approved",
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
    <section className="bg-green-dark py-24 sm:py-[120px] px-4 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 lg:mb-14">
          <div>
            <h2 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05] text-cream m-0">
              {heading}
            </h2>
            <p className="text-[15px] text-cream/60 max-w-[60ch] mt-3.5">
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

        {committee.length > 0 && (
          <div className="mb-10 lg:mb-12">
            <h3 className="text-[11px] tracking-[0.2em] font-bold text-gold mb-6">
              COMMITTEE
            </h3>
            {(() => {
              const sections = [
                {
                  section: "Patron & Clergy",
                  roles: [
                    "PATRON",
                    "JESUIT REPRESENTATIVE",
                    "PARISH PRIEST",
                  ],
                },
                {
                  section: "Executive Committee",
                  roles: [
                    "PRESIDENT",
                    "SECRETARY",
                    "TREASURER",
                  ],
                },
                {
                  section: "Vice Presidents",
                  roles: [
                    "VICE PRESIDENT - ADMINISTRATION",
                    "VICE PRESIDENT - ACADEMICS",
                    "VICE PRESIDENT - SOCIAL & CURRICULAR EVENTS",
                    "VICE PRESIDENT - FUNDRAISING",
                    "VICE PRESIDENT - MEMBERSHIP",
                    "VICE PRESIDENT - PLAYGROUND & SPORTS",
                  ],
                },
                {
                  section: "Assistant Officers",
                  roles: ["ASSISTANT SECRETARY", "ASSISTANT TREASURER"],
                },
                {
                  section: "Committee Members",
                  roles: ["COMMITTEE MEMBER"],
                },
                {
                  section: "Advisory Board",
                  roles: ["ADVISORY BOARD"],
                },
              ];

              const roleToSection = new Map<string, string>();
              sections.forEach((s) => {
                s.roles.forEach((r) => roleToSection.set(r, s.section));
              });

              const grouped = committee.reduce((acc: Record<string, any[]>, member: any) => {
                const key = (member.role || "").toUpperCase();
                const section = roleToSection.get(key) || "OTHER";
                if (!acc[section]) acc[section] = [];
                acc[section].push(member);
                return acc;
              }, {});

              const visible = sections.filter((s) => (grouped[s.section] || []).length > 0);

              return visible.map((s, idx) => {
                const members = grouped[s.section] || [];
                const hasNext = idx < visible.length - 1;

                return (
                  <div key={s.section} className={hasNext ? "mb-8 lg:mb-10" : ""}>
                    <h4 className="text-[11px] tracking-[0.2em] font-bold text-gold mb-3 pb-2 border-b border-gold/20">
                      {s.section.toUpperCase()}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
                      {members.map((member: any) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-4 py-3 border-b border-gold/10 last:border-b-0"
                        >
                          <div className="w-12 h-12 shrink-0 overflow-hidden rounded-sm bg-cream/10">
                            {member.photo ? (
                              <img
                                src={member.photo}
                                alt={member.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-heading text-lg text-gold/40">
                                {member.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-cream leading-tight truncate">
                              {member.name}
                            </div>
                            <div className="text-[10px] text-gold tracking-wider mt-0.5 uppercase">
                              {member.role}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {confirmedDonations.length > 0 && (
          <div className="mb-4 lg:mb-5">
            <div className="flex items-baseline gap-4 mb-5">
              <h3 className="text-[11px] tracking-[0.2em] font-bold text-gold">
                SUPPORT
              </h3>
              <div className="font-heading text-2xl sm:text-3xl font-semibold text-cream">
                LKR {totalRaised.toLocaleString()}
              </div>
              <div className="text-[13px] text-cream/50">
                {confirmedDonations.length} donation{confirmedDonations.length !== 1 ? "s" : ""} received
              </div>
            </div>
            <div className="border-t border-gold/10">
              {confirmedDonations.slice(0, 10).map((d: any) => {
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
        )}

        {publishedEvents.length > 0 && (
          <div>
            <h3 className="text-[11px] tracking-[0.2em] font-bold text-gold mb-5">
              UPCOMING EVENTS
            </h3>
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
                        className={`w-full aspect-[16/9] object-cover transition-transform duration-500 group-hover:scale-105`}
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

        {committee.length === 0 && publishedEvents.length === 0 && confirmedDonations.length === 0 && (
          <div className="text-center text-cream/30 py-12">
            The Old Boys&apos; Association section is being updated. Check back soon.
          </div>
        )}
      </div>
    </section>
  );
}
