"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { IconPlus, IconUsers, IconShieldCheck } from "@tabler/icons-react";
import { orpc } from "@/utils/orpc";
import { sortByRole } from "@/lib/ob-sort";
import type { OBMember } from "@/lib/api-types";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const OB_ADMIN_EMAIL_KEY = "ob_admin_email";

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
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(orpc.ob.obMembers.list.queryOptions({ input: {} }));
    await context.queryClient.prefetchQuery(
      orpc.settings.get.queryOptions({ input: { key: OB_ADMIN_EMAIL_KEY } }),
    );
  },
  component: AdminOBMembers,
});

function AdminOBMembers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newYearOpen, setNewYearOpen] = useState(false);
  const [newYear, setNewYear] = useState("");
  const [obAdminEmail, setObAdminEmail] = useState("");

  const { data: members = [] } = useSuspenseQuery(
    orpc.ob.obMembers.list.queryOptions({ input: {} }),
  );
  const { data: adminEmailSetting } = useSuspenseQuery(
    orpc.settings.get.queryOptions({ input: { key: OB_ADMIN_EMAIL_KEY } }),
  );

  const visibleMembers = members.filter((m: OBMember) => m.role !== "ADMINISTRATOR");
  const approvedMembers = visibleMembers.filter((m: OBMember) => m.status === "approved");

  // There is a single, site-wide OB admin email — always load the latest saved
  // value directly, with no per-member lookup.
  useEffect(() => {
    setObAdminEmail(adminEmailSetting?.value ?? "");
  }, [adminEmailSetting]);

  const saveAdminMutation = useMutation(
    orpc.admin.settings.set.mutationOptions({
      onSuccess: () => {
        toast.success("OB admin email saved");
        queryClient.invalidateQueries({ queryKey: orpc.settings.key() });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const years = Array.from(new Set(approvedMembers.map((m: OBMember) => m.year).filter(Boolean)))
    .sort()
    .reverse();

  const getYearData = (year: string) => {
    const yearMembers = visibleMembers.filter((m: OBMember) => m.year === year);
    const headCommittee = sortByRole(yearMembers.filter((m: OBMember) => isHeadRole(m.role)));
    const regularMembers = sortByRole(yearMembers.filter((m: OBMember) => !isHeadRole(m.role)));
    return {
      total: yearMembers.length,
      headCommittee,
      regularMembers,
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
          <Button size="sm" onClick={() => setNewYearOpen(true)}>
            <IconPlus className="mr-1 size-4" />
            Create New Year
          </Button>
        </div>
      </header>
      <div className="p-6 pb-0">
        <Card className="border-secondary/20">
          <CardContent className="p-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px]">
              <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                <IconShieldCheck className="size-3.5 text-primary shrink-0" />
                OB Admin Email
              </label>
              <Input
                placeholder="admin@example.com"
                value={obAdminEmail}
                onChange={(e) => setObAdminEmail(e.target.value)}
                className="h-9"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                The single OB admin manages the OB dashboard for every committee year — this
                need not be an approved member and is not necessarily the President.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                saveAdminMutation.mutate({ key: OB_ADMIN_EMAIL_KEY, value: obAdminEmail.trim() })
              }
              disabled={saveAdminMutation.isPending}
            >
              {saveAdminMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="flex-1 p-6">
        {years.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No committee years yet. Create a new year to start building the OB committee.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {years.map((year) => {
              const data = getYearData(year);
              return (
                <Card
                  key={year}
                  className="flex flex-col overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-5 border-b">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xl font-bold text-foreground">{year} Committee</h3>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {data.total} members
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 p-5 space-y-3">
                    {data.headCommittee.length > 0 && (
                      <div>
                        <div className="text-[11px] tracking-[0.2em] font-bold text-foreground mb-2">
                          HEAD COMMITTEE
                        </div>
                        <div className="space-y-2">
                          {data.headCommittee.slice(0, 4).map((member: OBMember) => (
                            <div key={member.id} className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 overflow-hidden">
                                {member.photo ? (
                                  <img
                                    src={member.photo}
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  member.name.charAt(0)
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-foreground truncate">
                                  {member.name}
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate">
                                  {member.role}
                                </div>
                              </div>
                            </div>
                          ))}
                          {data.headCommittee.length > 4 && (
                            <div className="text-xs text-muted-foreground pl-10">
                              +{data.headCommittee.length - 4} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {data.regularMembers.length > 0 && (
                      <div>
                        <div className="text-[11px] tracking-[0.2em] font-bold text-muted-foreground mb-2">
                          MEMBERS
                        </div>
                        <div className="space-y-2">
                          {data.regularMembers.slice(0, 3).map((member: OBMember) => (
                            <div key={member.id} className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 overflow-hidden">
                                {member.photo ? (
                                  <img
                                    src={member.photo}
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  member.name.charAt(0)
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm text-foreground truncate">
                                  {member.name}
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate">
                                  {member.role}
                                </div>
                              </div>
                            </div>
                          ))}
                          {data.regularMembers.length > 3 && (
                            <div className="text-xs text-muted-foreground pl-9">
                              +{data.regularMembers.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full h-12 justify-center rounded-none rounded-b-xl border-t text-sm font-semibold"
                    render={<Link to="/admin/ob/members/$year" params={{ year }} />}
                  >
                    <IconUsers className="mr-1.5 size-4" />
                    Manage {year} Committee
                  </Button>
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
              Enter the committee year (e.g. 2026 or 2026/2027), then assign every role in the
              committee editor.
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
            <Button variant="outline" onClick={() => setNewYearOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createYear} disabled={!newYear.trim()}>
              Create Year
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
