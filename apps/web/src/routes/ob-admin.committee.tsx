"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { Input } from "@aloysius-web/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@aloysius-web/ui/components/select";
import { IconPlus } from "@tabler/icons-react";
import { client } from "@/utils/orpc";
import { useState } from "react";
import { OBCommitteeEditor, type OBMember } from "@/components-client/ob-committee-editor";

export const Route = createFileRoute("/ob-admin/committee")({
  component: OBAdminCommittee,
});

function OBAdminCommittee() {
  const currentYear = String(new Date().getFullYear());
  const [year, setYear] = useState(currentYear);
  const [customYear, setCustomYear] = useState("");

  const { data: allMembers = [], isLoading } = useQuery({
    queryKey: ["ob-members", "admin"],
    queryFn: () => client.ob.obMembers.list({}),
  });

  const visibleMembers = allMembers.filter((m: any) => m.role !== "ADMINISTRATOR");
  const approved = visibleMembers.filter((m: any) => m.status === "approved");
  const years = Array.from(new Set(approved.map((m: any) => m.year).filter(Boolean)))
    .sort()
    .reverse();
  const yearOptions = years.includes(currentYear) ? years : [currentYear, ...years];
  const selectedYear = customYear.trim() || year;

  const yearMembers = approved.filter((m: any) => m.year === selectedYear);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-green-dark">Committee Members</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Assign every role of the committee for a year. Pick an existing member or type a new name
          — the whole committee saves at once.
        </p>
      </div>

      {/* Year picker */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px]">
          <label className="text-xs text-muted-foreground block mb-1">Committee Year</label>
          <Select
            value={customYear.trim() ? undefined : year}
            onValueChange={(v) => {
              setYear(v ?? currentYear);
              setCustomYear("");
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[220px]">
          <label className="text-xs text-muted-foreground block mb-1">Or enter a new year</label>
          <div className="flex gap-2">
            <Input
              value={customYear}
              onChange={(e) => setCustomYear(e.target.value)}
              placeholder="e.g. 2027/2028"
              className="h-9"
            />
            {customYear.trim() && (
              <Button variant="outline" size="sm" className="h-9" onClick={() => setCustomYear("")}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Loading...</div>
      ) : (
        <OBCommitteeEditor
          year={selectedYear}
          members={yearMembers as OBMember[]}
          pool={approved as OBMember[]}
        />
      )}

      <p className="text-xs text-muted-foreground">
        <IconPlus className="inline size-3.5 mr-1" />
        Multi-slot roles (Assistant Secretaries, Committee Members, Advisory Board) have an “Add”
        button to grow the roster. Dropped slots are removed from the committee on save.
      </p>
    </div>
  );
}
