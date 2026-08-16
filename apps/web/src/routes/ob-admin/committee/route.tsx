"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { SidebarTrigger } from "@aloysius-web/ui/components/sidebar";
import { Separator } from "@aloysius-web/ui/components/separator";
import { Button } from "@aloysius-web/ui/components/button";
import { Input } from "@aloysius-web/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aloysius-web/ui/components/select";
import { client, orpc } from "@/utils/orpc";
import type { OBMember } from "@/lib/api-types";
import { IconPlus } from "@tabler/icons-react";
import { OBCommitteeEditor } from "@/components-client/ob-committee-editor";

/** "2026" -> single year; "2026-2028" -> a multi-year term. */
function parseTerm(term: string): { start: string; end: string } {
  const match = term.match(/^(\d{4})(?:[/-](\d{4}))?$/);
  if (!match) return { start: term, end: term };
  return { start: match[1]!, end: match[2] ?? match[1]! };
}

function formatTerm(start: string, end: string): string {
  const s = start.trim();
  const e = end.trim();
  if (!s) return "";
  if (!e || e === s) return s;
  return `${s}-${e}`;
}

const committeeSearchSchema = z.object({
  year: z.string().optional(),
});

export const Route = createFileRoute("/ob-admin/committee")({
  validateSearch: (search) => committeeSearchSchema.parse(search),
  loaderDeps: ({ search: { year } }) => ({ year }),
  loader: async ({ context, deps }) => {
    const term = deps.year || String(new Date().getFullYear());
    // Default the President slot to the current principal before the members
    // list loads, so a freshly-created term isn't missing its head of committee.
    await client.ob.obMembers.ensurePresidentForYear({ year: term });
    await context.queryClient.prefetchQuery(orpc.ob.obMembers.list.queryOptions({ input: {} }));
  },
  component: OBAdminCommittee,
});

function OBAdminCommittee() {
  const currentYear = String(new Date().getFullYear());
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const selectedTerm = search.year || currentYear;
  const { start: termStart, end: termEnd } = parseTerm(selectedTerm);
  const [startInput, setStartInput] = useState(termStart);
  const [endInput, setEndInput] = useState(termEnd);

  // Keep the Start/End inputs in sync when the term changes from elsewhere
  // (the quick-jump select, or the URL directly).
  useEffect(() => {
    setStartInput(termStart);
    setEndInput(termEnd);
  }, [termStart, termEnd]);

  const { data: allMembers } = useSuspenseQuery(
    orpc.ob.obMembers.list.queryOptions({ input: {} }),
  );

  const visibleMembers = allMembers.filter((m: OBMember) => m.role !== "ADMINISTRATOR");
  const approved = visibleMembers.filter((m: OBMember) => m.status === "approved");
  const terms = Array.from(new Set(approved.map((m: OBMember) => m.year).filter(Boolean)))
    .sort()
    .reverse();
  const termOptions = terms.includes(currentYear) ? terms : [currentYear, ...terms];

  const yearMembers = approved.filter((m: OBMember) => m.year === selectedTerm);

  const applyTerm = () => {
    const term = formatTerm(startInput, endInput);
    if (term && term !== selectedTerm) {
      navigate({ search: (prev) => ({ ...prev, year: term }) });
    }
  };

  return (
    <div className="flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Committee</h1>
      </header>
      <div className="flex-1 space-y-6 p-6">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Assign every role for a committee term. Boards typically serve two to three years, so a
          term can be a single year (2026) or a range (2026-2028). Pick an existing member or type
          a new name — the whole committee saves at once.
        </p>

        {/* Term picker */}
        <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
          <div className="min-w-[180px]">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Jump to existing term
            </label>
            <Select
              value={termOptions.includes(selectedTerm) ? selectedTerm : undefined}
              onValueChange={(v) =>
                navigate({ search: (prev) => ({ ...prev, year: v ?? currentYear }) })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Other term" />
              </SelectTrigger>
              <SelectContent>
                {termOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="hidden h-14 sm:block" />

          <div className="flex items-end gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Start year
              </label>
              <Input
                type="number"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                onBlur={applyTerm}
                onKeyDown={(e) => e.key === "Enter" && applyTerm()}
                className="h-9 w-24"
              />
            </div>
            <span className="pb-2.5 text-muted-foreground">–</span>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                End year <span className="text-muted-foreground/70">(optional)</span>
              </label>
              <Input
                type="number"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                onBlur={applyTerm}
                onKeyDown={(e) => e.key === "Enter" && applyTerm()}
                placeholder={startInput}
                className="h-9 w-24"
              />
            </div>
            <Button size="sm" className="h-9" onClick={applyTerm}>
              Go
            </Button>
          </div>

          <div className="ml-auto text-sm font-medium text-foreground">
            Editing: <span className="text-primary">{selectedTerm}</span>
          </div>
        </div>

        <OBCommitteeEditor
          key={selectedTerm}
          year={selectedTerm}
          members={yearMembers}
          pool={approved}
        />

        <p className="text-xs text-muted-foreground">
          <IconPlus className="inline size-3.5 mr-1" />
          Multi-slot roles (Assistant Secretaries, Committee Members, Advisory Board) have an
          &ldquo;Add&rdquo; button to grow the roster. Dropped slots are removed from the
          committee on save.
        </p>
      </div>
    </div>
  );
}
