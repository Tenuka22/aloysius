"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
import { Input } from "@aloysius-web/ui/components/input";
import { Card, CardContent } from "@aloysius-web/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { IconPlus, IconUsers, IconRefresh, IconShieldCheck } from "@tabler/icons-react";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import { useState } from "react";

const HEAD_ROLES = [
  "PRESIDENT",
  "VICE PRESIDENT",
  "SECRETARY",
  "ASSISTANT SECRETARY",
  "TREASURER",
  "ASSISTANT TREASURER",
  "PATRON",
  "JESUIT REPRESENTATIVE",
  "PARISH PRIEST",
];

function isHeadRole(role: string): boolean {
  const upper = role.toUpperCase();
  return HEAD_ROLES.some((r) => upper.includes(r));
}

export const Route = createFileRoute("/admin/ob/members")({
  component: AdminOBMembers,
});

function AdminOBMembers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newYearOpen, setNewYearOpen] = useState(false);
  const [newYear, setNewYear] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["ob-members"],
    queryFn: () => client.ob.obMembers.list({}),
  });

  const syncAdminEmails = useMutation({
    mutationFn: () => client.ob.obMembers.syncOBAdminEmails(),
    onSuccess: (res) => {
      if (res.errors > 0) {
        toast.error(`Synced ${res.synced}, ${res.errors} error(s): ${res.errorsList.join("; ")}`);
      } else {
        toast.success(`Admin emails synced (${res.synced} updated)`);
      }
      queryClient.invalidateQueries({ queryKey: ["ob-members"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const visibleMembers = members.filter((m: any) => m.role !== "ADMINISTRATOR");
  const approvedMembers = visibleMembers.filter((m: any) => m.status === "approved");

  const years = Array.from(new Set(approvedMembers.map((m: any) => m.year).filter(Boolean))).sort().reverse();

  const getYearData = (year: string) => {
    const yearMembers = visibleMembers.filter((m: any) => m.year === year);
    const headCommittee = yearMembers.filter((m: any) => isHeadRole(m.role));
    const regularMembers = yearMembers.filter((m: any) => !isHeadRole(m.role));
    const admin = yearMembers.find((m: any) => m.adminEmail);
    return {
      total: yearMembers.length,
      headCommittee,
      regularMembers,
      adminEmail: admin?.adminEmail ?? null,
      hasData: yearMembers.length > 0,
    };
  };

  const createYear = () => {
    const value = newYear.trim();
    if (!value) return;
    setNewYearOpen(false);
    setNewYear("");
    navigate({ to: "/admin/ob/members/$year", params: { year: value } });
  };

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">OB Committee</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => syncAdminEmails.mutate()} disabled={syncAdminEmails.isPending}>
            <IconRefresh className={`size-4 mr-1 ${syncAdminEmails.isPending ? "animate-spin" : ""}`} />
            {syncAdminEmails.isPending ? "Syncing..." : "Sync Admin Emails"}
          </Button>
          <Button size="sm" onClick={() => setNewYearOpen(true)}>
            <IconPlus className="mr-1 size-4" />
            Create New Year
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        ) : years.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No committee years yet. Create a new year to start building the OB committee.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {years.map((year) => {
              const data = getYearData(year);
              return (
                <Card key={year} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-5 border-b">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xl font-bold font-heading text-green-dark">{year} Committee</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{data.total} members</span>
                      </div>
                      {data.adminEmail && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-gold">
                          <IconShieldCheck className="size-3.5 shrink-0" />
                          <span className="truncate">{data.adminEmail}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 space-y-3">
                      {data.headCommittee.length > 0 && (
                        <div>
                          <div className="text-[11px] tracking-[0.2em] font-bold text-gold mb-2">HEAD COMMITTEE</div>
                          <div className="space-y-2">
                            {data.headCommittee.slice(0, 4).map((member: any) => (
                              <div key={member.id} className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 overflow-hidden">
                                  {member.photo ? (
                                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                                  ) : (
                                    member.name.charAt(0)
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-green-dark truncate">{member.name}</div>
                                  <div className="text-[11px] text-muted-foreground truncate">{member.role}</div>
                                </div>
                                {member.adminEmail && <IconShieldCheck className="size-3.5 text-gold shrink-0" />}
                              </div>
                            ))}
                            {data.headCommittee.length > 4 && (
                              <div className="text-xs text-muted-foreground pl-10">+{data.headCommittee.length - 4} more</div>
                            )}
                          </div>
                        </div>
                      )}
                      {data.regularMembers.length > 0 && (
                        <div>
                          <div className="text-[11px] tracking-[0.2em] font-bold text-muted-foreground mb-2">MEMBERS</div>
                          <div className="space-y-2">
                            {data.regularMembers.slice(0, 3).map((member: any) => (
                              <div key={member.id} className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 overflow-hidden">
                                  {member.photo ? (
                                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                                  ) : (
                                    member.name.charAt(0)
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm text-green-dark truncate">{member.name}</div>
                                  <div className="text-[11px] text-muted-foreground truncate">{member.role}</div>
                                </div>
                              </div>
                            ))}
                            {data.regularMembers.length > 3 && (
                              <div className="text-xs text-muted-foreground pl-9">+{data.regularMembers.length - 3} more</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="px-5 py-3 border-t bg-muted/30">
                      <Button variant="ghost" size="sm" className="w-full justify-center" render={<Link to="/admin/ob/members/$year" params={{ year }} />}>
                        <IconUsers className="mr-1.5 size-4" />
                        Manage {year} Committee
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Dialog open={newYearOpen} onOpenChange={setNewYearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New OB Year</DialogTitle>
            <DialogDescription>
              Enter the committee year (e.g. 2026 or 2026/2027), then assign every role in the committee editor.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            placeholder="e.g. 2026/2027"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") createYear();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewYearOpen(false)}>Cancel</Button>
            <Button onClick={createYear} disabled={!newYear.trim()}>Create Year</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
