"use client";

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
import { Card, CardContent } from "@aloysius-web/ui/components/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@aloysius-web/ui/components/combobox";
import { InputGroupAddon } from "@aloysius-web/ui/components/input-group";
import { IconArrowLeft, IconCrown, IconPencil } from "@tabler/icons-react";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import { StaffEditor, type StaffMember } from "@/components-client/staff-editor";

export const Route = createFileRoute("/admin/staff_/$year")({
  component: AdminStaffYear,
});

function AdminStaffYear() {
  const { year } = Route.useParams();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [principalInput, setPrincipalInput] = useState("");

  const { data: yearMembers = [], isLoading } = useQuery({
    queryKey: ["staff", "year", year],
    queryFn: () => client.staff.list({ year }),
  });

  const { data: allStaff = [] } = useQuery({
    queryKey: ["staff", "all"],
    queryFn: () => client.staff.list({}),
  });

  const { data: principals } = useQuery({
    queryKey: ["principals", "all"],
    queryFn: () => client.principals.list({ page: 1, pageSize: 100 }),
  });

  const { data: currentPrincipal } = useQuery({
    queryKey: ["principals", "current"],
    queryFn: () => client.principals.getCurrent(),
  });

  const principalRows = principals?.rows ?? [];
  const assigned = principalRows.find((p: any) => p.year === year) ?? null;
  const fallback =
    (currentPrincipal && principalRows.some((p: any) => p.id === currentPrincipal.id)
      ? currentPrincipal
      : principalRows[0]) ?? null;
  const principal = principalRows.find((p: any) => p.id === selectedId) ?? assigned ?? fallback;

  const filteredPrincipals = useMemo(() => {
    const q = principalInput.trim().toLowerCase();
    const pool = principalRows.slice(0, 25);
    return q ? pool.filter((p) => p.name.toLowerCase().includes(q)) : pool;
  }, [principalInput, principalRows]);

  const assignMutation = useMutation({
    mutationFn: async (id: string) => {
      const ops: Promise<unknown>[] = [];
      if (assigned && assigned.id !== id && assigned.year === year) {
        ops.push(client.principals.update({ id: assigned.id, year: "" }));
      }
      ops.push(client.principals.update({ id, year }));
      await Promise.all(ops);
    },
    onSuccess: () => {
      toast.success(`Principal set for ${year}`);
      queryClient.invalidateQueries({ queryKey: ["principals"] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const handlePrincipalChange = (name: string) => {
    const p = principalRows.find((x) => x.name === name);
    if (!p || p.id === principal?.id) return;
    setSelectedId(p.id);
    assignMutation.mutate(p.id);
  };

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Button variant="ghost" size="sm" className="-ml-2" render={<Link to="/admin/staff" />}>
          <IconArrowLeft className="mr-1.5 size-4" />
          Staff
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">{year} Staff</h1>
      </header>
      <div className="flex-1 p-6 space-y-6">
        {/* Principal — chosen per year from the principals table, never part of the roster */}
        <section>
          <h2 className="text-sm font-bold tracking-[0.2em] text-foreground mb-3">PRINCIPAL</h2>
          <Card className="border-secondary/20">
            <CardContent className="p-4 space-y-4">
              {principal ? (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground shrink-0 overflow-hidden">
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
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <IconCrown className="size-4 text-primary shrink-0" />
                      <span className="truncate">{principal.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {principal.title}
                      {principal.tenure && ` • ${principal.tenure}`}
                    </div>
                    {principal.bio && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {principal.bio}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    render={<Link to="/admin/principals" />}
                  >
                    <IconPencil className="size-3.5 mr-1" /> Edit Principal
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No principal profile yet. Create one on the{" "}
                  <Link to="/admin/principals" className="underline text-primary">
                    Principal profiles
                  </Link>{" "}
                  page.
                </div>
              )}
              <div className="border-t pt-4 space-y-2">
                <div className="min-w-[260px]">
                  <label className="text-xs text-muted-foreground block mb-1">
                    Year Principal — auto-selected to the current principal
                  </label>
                  <Combobox
                    value={principal?.name ?? ""}
                    onValueChange={(val) => handlePrincipalChange(val ?? "")}
                    onInputValueChange={(text) => setPrincipalInput(text)}
                    filter={null}
                  >
                    <ComboboxInput placeholder="Select principal..." showClear className="w-full">
                      {principal?.portrait && (
                        <InputGroupAddon align="inline-start">
                          <img
                            src={principal.portrait}
                            alt=""
                            className="size-5 rounded-full object-cover"
                          />
                        </InputGroupAddon>
                      )}
                    </ComboboxInput>
                    <ComboboxContent>
                      <ComboboxList>
                        {filteredPrincipals.map((p: any) => (
                          <ComboboxItem key={p.id} value={p.name}>
                            {p.portrait ? (
                              <img
                                src={p.portrait}
                                alt=""
                                className="size-5 rounded-full object-cover"
                              />
                            ) : (
                              <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                                {p.name.charAt(0)}
                              </span>
                            )}
                            <span className="truncate">{p.name}</span>
                            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                              {p.title || "—"}
                            </span>
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                      <ComboboxEmpty>
                        {principalInput.trim()
                          ? `No principal matching "${principalInput.trim()}"`
                          : "Type to search principals"}
                      </ComboboxEmpty>
                    </ComboboxContent>
                  </Combobox>
                </div>
                <p className="text-xs text-muted-foreground">
                  {assignMutation.isPending
                    ? "Saving…"
                    : "Changing the principal updates this year instantly."}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Staff roster */}
        <section>
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : (
            <StaffEditor
              year={year}
              members={yearMembers as StaffMember[]}
              pool={allStaff as StaffMember[]}
            />
          )}
        </section>
      </div>
    </div>
  );
}
