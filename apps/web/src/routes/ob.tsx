import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/utils/orpc";
import { useAuth } from "@clerk/tanstack-react-start";
import { Card, CardContent } from "@aloysius-web/ui/components/card";
import { Button } from "@aloysius-web/ui/components/button";
import { Input } from "@aloysius-web/ui/components/input";
import { getAspectRatio, aspectRatioClass } from "@/lib/image-ratio";
import { IconCalendarEvent, IconHeart, IconUserPlus, IconCheck, IconX, IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/ob")({
  component: OBPage,
});

export function OBPage({ settings }: { settings?: Record<string, string> } = {}) {
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

  const isOBAdmin = (myMembership?.status === "approved") || members.some((m: any) => m.userId === myMembership?.userId && m.status === "approved");

  const [eventForm, setEventForm] = useState({ title: "", description: "", location: "", eventDate: "" });
  const [donationForm, setDonationForm] = useState({ donorName: "", amount: "", purpose: "", message: "" });

  const eventMutation = useMutation({
    mutationFn: () => client.ob.obEvents.create({ ...eventForm, eventDate: eventForm.eventDate || undefined }),
    onSuccess: () => {
      toast.success("Event submitted for approval");
      setEventForm({ title: "", description: "", location: "", eventDate: "" });
      queryClient.invalidateQueries({ queryKey: ["ob-events"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const donationMutation = useMutation({
    mutationFn: () => client.ob.obDonations.create({ ...donationForm, amount: donationForm.amount ? Number(donationForm.amount) : undefined }),
    onSuccess: () => {
      toast.success("Donation submitted for approval");
      setDonationForm({ donorName: "", amount: "", purpose: "", message: "" });
      queryClient.invalidateQueries({ queryKey: ["ob-donations"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const publishEventMutation = useMutation({
    mutationFn: (id: string) => client.ob.obEvents.update({ id, status: "published", publishNow: true }),
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
    mutationFn: (id: string) => client.ob.obDonations.update({ id, status: "confirmed" }),
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

  const activeMembers = members.filter((m: any) => m.status === "approved");
  const grouped = activeMembers.reduce((acc: Record<string, any[]>, m: any) => {
    const role = m.role || "COMMITTEE MEMBER";
    if (!acc[role]) acc[role] = [];
    acc[role].push(m);
    return acc;
  }, {} as Record<string, any[]>);

  const publishedEvents = events.filter((e: any) => e.status === "published");
  const pendingEvents = events.filter((e: any) => e.status === "draft");
  const confirmedDonations = donations.filter((d: any) => d.status === "confirmed");
  const pendingDonations = donations.filter((d: any) => d.status === "pending");
  const totalConfirmed = confirmedDonations.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-green-dark text-cream py-16 px-4 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[1180px] grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="text-[11px] tracking-[0.4em] font-bold text-gold mb-4">ST. ALOYSIUS&rsquo; COLLEGE</div>
            <h1 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-[54px] leading-[1.05]">
              OLD BOYS&rsquo; ASSOCIATION <span className="text-gold">—</span> <span className="text-cream/80 text-2xl sm:text-3xl lg:text-4xl font-normal">The Aloysian Legacy Continues.</span>
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
            {[settings?.ob_archival_image_1, settings?.ob_archival_image_2].filter(Boolean).map((src, i) => (
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

        {/* Committee Section - clubs.tsx style */}
        <section>
          <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-green-dark mb-8">Our Committee</h2>
          {membersLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : activeMembers.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Committee members will be listed here.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeMembers.map((member: any) => (
                <Card key={member.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex gap-4 p-4">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0">
                          {member.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-green-dark">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.role}</div>
                        {member.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{member.bio}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Membership Request Section */}
        <section>
          <Card className="bg-green-dark text-cream">
            <CardContent className="p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-4">
                <IconUserPlus className="size-6 text-gold" />
                <h2 className="font-heading font-semibold text-2xl sm:text-3xl">Join the Old Boys&apos; Association</h2>
              </div>
              <p className="text-cream/80 mb-6 max-w-2xl">
                Are you an alumnus of St. Aloysius&apos; College? Request membership to stay connected with the OB community.
              </p>
              {myMembership?.status === "approved" ? (
                <div className="bg-green-dark/50 border border-gold/30 rounded-lg p-4 text-center">
                  <p className="text-gold font-semibold">You are an approved OB member.</p>
                </div>
              ) : myMembership?.status === "pending" ? (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                  <p className="text-yellow-300 font-semibold">Your membership request is pending approval.</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    render={<a href="/OB%20Membership%20Application.pdf" target="_blank" rel="noopener noreferrer" />}
                    nativeButton={false}
                    className="bg-gold text-green-dark hover:bg-gold-light font-bold"
                  >
                    Download Application Form
                  </Button>
                  <p className="text-cream/60 text-sm self-center">Fill out the form and submit it to the OB office.</p>
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
              <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-green-dark">OB Events</h2>
            </div>
            {isOBAdmin && (
              <form onSubmit={(e) => { e.preventDefault(); eventMutation.mutate(); }} className="flex gap-2">
                <Input value={eventForm.title} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} placeholder="New event title" required className="h-9 w-[200px]" />
                <Button size="sm" type="submit" disabled={eventMutation.isPending} className="bg-gold text-green-dark hover:bg-gold-light font-bold">
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
                        <h3 className="font-heading font-semibold text-xl text-green-dark mb-1">{event.title}</h3>
                        {event.location && <p className="text-sm text-muted-foreground">{event.location}</p>}
                        {event.eventDate && (
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.eventDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                          </p>
                        )}
                        {event.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{event.description}</p>}
                      </div>
                      {isOBAdmin && (
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="outline" onClick={() => archiveEventMutation.mutate(event.id)}>Archive</Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pendingEvents.length > 0 && isOBAdmin && (
                <div className="mt-8">
                  <h3 className="text-sm font-bold tracking-[0.2em] text-yellow-600 mb-4">Pending Approval ({pendingEvents.length})</h3>
                  <div className="space-y-4">
                    {pendingEvents.map((event: any) => (
                      <Card key={event.id} className="border-yellow-500/30">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-heading font-semibold text-xl text-green-dark mb-1">{event.title}</h3>
                              {event.location && <p className="text-sm text-muted-foreground">{event.location}</p>}
                              {event.eventDate && (
                                <p className="text-sm text-muted-foreground">
                                  {new Date(event.eventDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button size="sm" onClick={() => publishEventMutation.mutate(event.id)} className="bg-green-dark text-cream hover:bg-green-darker">
                                <IconCheck className="size-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => archiveEventMutation.mutate(event.id)}>
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
              <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-green-dark">Support Our Cause</h2>
            </div>
            {isOBAdmin && (
              <form onSubmit={(e) => { e.preventDefault(); donationMutation.mutate(); }} className="flex gap-2">
                <Input value={donationForm.donorName} onChange={(e) => setDonationForm((f) => ({ ...f, donorName: e.target.value }))} placeholder="Donor name" required className="h-9 w-[180px]" />
                <Input type="number" value={donationForm.amount} onChange={(e) => setDonationForm((f) => ({ ...f, amount: e.target.value }))} placeholder="Amount" className="h-9 w-[120px]" />
                <Button size="sm" type="submit" disabled={donationMutation.isPending} className="bg-gold text-green-dark hover:bg-gold-light font-bold">
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
                  <div className="text-5xl font-bold font-heading mb-2">LKR {totalConfirmed.toLocaleString()}</div>
                  <div className="text-cream/70">Total Confirmed Donations</div>
                  <div className="mt-4 text-sm text-cream/50">{confirmedDonations.length} donation{confirmedDonations.length !== 1 ? "s" : ""} received</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-8">
                  <h3 className="font-heading font-semibold text-xl text-green-dark mb-4">Make a Donation</h3>
                  <p className="text-sm text-muted-foreground mb-4">Support the Old Boys&apos; Association initiatives.</p>
                  <Button className="w-full bg-gold text-green-dark hover:bg-gold-light font-bold">Contact Treasurer to Donate</Button>
                </CardContent>
              </Card>
            </div>
          )}
          {confirmedDonations.length > 0 && (
            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-bold tracking-[0.2em] text-red-brand">Recent Supporters</h3>
              {confirmedDonations.slice(0, 10).map((d: any) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-green-dark/10">
                  <div>
                    <span className="font-medium text-sm text-green-dark">{d.isAnonymous ? "Anonymous" : d.donorName}</span>
                    {d.purpose && <span className="text-xs text-muted-foreground ml-2">— {d.purpose}</span>}
                  </div>
                  <span className="font-semibold text-sm text-green-dark">LKR {(d.amount || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          {pendingDonations.length > 0 && isOBAdmin && (
            <div className="mt-8">
              <h3 className="text-sm font-bold tracking-[0.2em] text-yellow-600 mb-4">Pending Donations ({pendingDonations.length})</h3>
              <div className="space-y-3">
                {pendingDonations.map((d: any) => (
                  <Card key={d.id} className="border-yellow-500/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{d.isAnonymous ? "Anonymous" : d.donorName}</div>
                        <div className="text-xs text-muted-foreground">
                          {d.amount ? `${d.currency} ${d.amount.toLocaleString()}` : "No amount"} • {d.purpose || "General"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => confirmDonationMutation.mutate(d.id)} className="bg-green-dark text-cream hover:bg-green-darker">
                          <IconCheck className="size-4 mr-1" /> Confirm
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => cancelDonationMutation.mutate(d.id)}>
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
