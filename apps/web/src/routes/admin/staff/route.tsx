"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
import { Input } from "@aloysius-web/ui/components/input";
import { Card } from "@aloysius-web/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@aloysius-web/ui/components/dialog";
import { IconPlus, IconUsers, IconCrown } from "@tabler/icons-react";
import { orpc } from "@/utils/orpc";
import { useState } from "react";

export const Route = createFileRoute("/admin/staff")({
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(orpc.staff.list.queryOptions({ input: {} }));
  },
  component: AdminStaff,
});

function AdminStaff() {
  const navigate = useNavigate();
  const [newYearOpen, setNewYearOpen] = useState(false);
  const [newYear, setNewYear] = useState("");

  const { data: staff } = useSuspenseQuery(orpc.staff.list.queryOptions({ input: {} }));

  const { data: principals } = useQuery(
    orpc.principals.list.queryOptions({
      input: {
        page: 1,
        pageSize: 100,
        status: "published",
        sort: "sortOrder",
        sortDir: "asc",
      },
    }),
  );

  const principalRows = principals?.rows ?? [];
  const principalByYear = new Map<string, (typeof principalRows)[number]>();
  for (const p of principalRows) {
    if (p.year && !principalByYear.has(p.year)) principalByYear.set(p.year, p);
  }

  const staffYears = new Set(staff.map((m: any) => m.year).filter(Boolean) as string[]);
  const principalYears = new Set(principalByYear.keys());
  const years = Array.from(new Set([...staffYears, ...principalYears]))
    .sort()
    .reverse();

  const createYear = () => {
    const value = newYear.trim();
    if (!value) return;
    setNewYearOpen(false);
    setNewYear("");
    navigate({ to: "/admin/staff/$year", params: { year: value } });
  };

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Staff</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" render={<Link to="/admin/principals" />}>
            <IconCrown className="mr-1 size-4" />
            Principal Profiles
          </Button>
          <Button size="sm" onClick={() => setNewYearOpen(true)}>
            <IconPlus className="mr-1 size-4" />
            Create New Year
          </Button>
        </div>
      </header>
      <div className="flex-1 p-6">
        <div className="mb-6 rounded-lg border border-secondary/20 bg-secondary/10 p-4">
          <p className="text-sm text-secondary-foreground">
            Manage the school staff year by year. The principal is stored separately and is pinned
            to each year&apos;s page; every other staff member (vice principals, heads, teachers,
            admin staff) lives in the year&apos;s roster. Principal profiles are managed on the
            Principal profiles page.
          </p>
        </div>
        {years.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No staff years yet. Create a new year to start building the staff roster.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {years.map((year) => {
              const yearStaff = staff.filter((m: any) => m.year === year);
              const principal = principalByYear.get(year);
              return (
                <Card
                  key={year}
                  className="flex flex-col overflow-hidden hover:shadow-md transition-shadow py-0"
                >
                  <div className="p-5 border-b">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xl font-bold text-foreground">{year} Staff</h3>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {yearStaff.length} members
                      </span>
                    </div>
                    {principal && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 overflow-hidden">
                          {principal.portrait ? (
                            <img
                              src={principal.portrait}
                              alt={principal.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            principal.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-primary flex items-center gap-1">
                            <IconCrown className="size-3.5 shrink-0" />
                            <span className="truncate">{principal.name}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {principal.title}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-5 space-y-3">
                    {yearStaff.length > 0 ? (
                      <div className="space-y-2">
                        {yearStaff.slice(0, 4).map((m: any) => (
                          <div key={m.id} className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 overflow-hidden">
                              {m.photo ? (
                                <img
                                  src={m.photo}
                                  alt={m.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                m.name.charAt(0)
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm text-foreground truncate">{m.name}</div>
                              <div className="text-[11px] text-muted-foreground truncate">
                                {m.role}
                              </div>
                            </div>
                          </div>
                        ))}
                        {yearStaff.length > 4 && (
                          <div className="text-xs text-muted-foreground pl-9">
                            +{yearStaff.length - 4} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        No staff assigned yet. Open this year to build the roster.
                      </div>
                    )}
                  </div>
                  <div className="px-5 py-3 border-t bg-secondary/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-center"
                      render={<Link to="/admin/staff/$year" params={{ year }} />}
                    >
                      <IconUsers className="mr-1.5 size-4" />
                      Manage {year} Staff
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Dialog open={newYearOpen} onOpenChange={setNewYearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Staff Year</DialogTitle>
            <DialogDescription>
              Enter the school year (e.g. 2026 or 2026/2027), then add the principal and staff
              roster for that year.
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
