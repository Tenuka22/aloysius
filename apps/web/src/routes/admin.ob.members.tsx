"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
import { Card, CardContent } from "@aloysius-web/ui/components/card";
import {
  IconPlus,
  IconUsers,
  IconShieldCheck,
} from "@tabler/icons-react";
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
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["ob-members"],
    queryFn: () => client.ob.obMembers.list({}),
  });

  const approvedMembers = members.filter((m: any) => m.status === "approved");

  const years = Array.from(new Set(approvedMembers.map((m: any) => m.year).filter(Boolean))).sort().reverse();

  const getYearData = (year: string) => {
    const yearMembers = approvedMembers.filter((m: any) => m.year === year);
    const headCommittee = yearMembers.filter((m: any) => isHeadRole(m.role));
    const regularMembers = yearMembers.filter((m: any) => !isHeadRole(m.role));
    const admins = yearMembers.filter((m: any) => m.adminEmail);
    return { total: yearMembers.length, headCommittee, regularMembers, admins, hasData: yearMembers.length > 0 };
  };

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">OB Committee</h1>
        <div className="ml-auto">
          <Button size="sm" render={<Link to="/admin/ob/members/new" />} nativeButton={false}>
            <IconPlus className="mr-1 size-4" />
            New Member
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        ) : years.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No committee members yet. Create the first member to get started.</div>
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
                      {data.admins.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gold mt-1">
                          <IconShieldCheck className="size-3" />
                          <span>{data.admins.length} admin{data.admins.length !== 1 ? "s" : ""}</span>
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
                      <Button variant="ghost" size="sm" className="w-full justify-center" render={<Link to={`/admin/ob/members/${year}`} />}>
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
    </div>
  );
}
