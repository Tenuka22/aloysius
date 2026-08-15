"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { IconPlus, IconTrash, IconUpload, IconX } from "@tabler/icons-react";
import { InputGroupAddon } from "@aloysius-web/ui/components/input-group";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import { uploadImageWithRatio } from "@/lib/upload-image";

export type OBMember = {
  id: string;
  userId: string | null;
  name: string;
  role: string;
  email: string | null;
  adminEmail: string | null;
  photo: string | null;
  bio: string | null;
  year: string;
  sortOrder: number;
  status: string;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const COMMITTEE_STRUCTURE = [
  {
    section: "Patron & Clergy",
    roles: [
      { role: "PATRON", label: "Patron", count: 1 },
      { role: "JESUIT REPRESENTATIVE", label: "Jesuit Representative", count: 1 },
      { role: "PARISH PRIEST", label: "Parish Priest", count: 1 },
    ],
  },
  {
    section: "Executive Committee",
    roles: [
      { role: "PRESIDENT", label: "President", count: 1 },
      { role: "SECRETARY", label: "Secretary", count: 1 },
      { role: "TREASURER", label: "Treasurer", count: 1 },
    ],
  },
  {
    section: "Vice Presidents",
    roles: [
      { role: "VICE PRESIDENT - ADMINISTRATION", label: "Administration", count: 1 },
      { role: "VICE PRESIDENT - ACADEMICS", label: "Academics", count: 1 },
      {
        role: "VICE PRESIDENT - SOCIAL & CURRICULAR EVENTS",
        label: "Social & Curricular Events",
        count: 1,
      },
      { role: "VICE PRESIDENT - FUNDRAISING", label: "Fundraising", count: 1 },
      { role: "VICE PRESIDENT - MEMBERSHIP", label: "Membership", count: 1 },
      { role: "VICE PRESIDENT - PLAYGROUND & SPORTS", label: "Playground & Sports", count: 1 },
    ],
  },
  {
    section: "Assistant Officers",
    roles: [
      { role: "ASSISTANT SECRETARY", label: "Assistant Secretary", count: 2 },
      { role: "ASSISTANT TREASURER", label: "Assistant Treasurer", count: 2 },
    ],
  },
  {
    section: "Committee Members",
    roles: [{ role: "COMMITTEE MEMBER", label: "Committee Member", count: 6 }],
  },
  {
    section: "Advisory Board",
    roles: [{ role: "ADVISORY BOARD", label: "Advisory Board", count: 10 }],
  },
];

type Slot = {
  key: string;
  id?: string;
  role: string;
  name: string;
  email: string;
  photo: string;
  bio: string;
};

function buildSlots(members: OBMember[]): Slot[] {
  const slots: Slot[] = [];
  const byRole = new Map<string, OBMember[]>();
  for (const m of members) {
    const role = m.role.toUpperCase();
    const arr = byRole.get(role) ?? [];
    arr.push(m);
    byRole.set(role, arr);
  }
  for (const section of COMMITTEE_STRUCTURE) {
    for (const r of section.roles) {
      const existing = (byRole.get(r.role) ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
      const count = Math.max(r.count, existing.length);
      for (let i = 0; i < count; i++) {
        const m = existing[i];
        slots.push({
          key: `${r.role}#${i}`,
          id: m?.id,
          role: r.role,
          name: m?.name ?? "",
          email: m?.email ?? "",
          photo: m?.photo ?? "",
          bio: m?.bio ?? "",
        });
      }
    }
  }
  return slots;
}

function MemberPickField({
  name,
  photo,
  pool,
  onNameChange,
  onPick,
}: {
  name: string;
  photo: string;
  pool: OBMember[];
  onNameChange: (name: string) => void;
  onPick: (member: OBMember) => void;
}) {
  const [input, setInput] = useState(name);
  useEffect(() => setInput(name), [name]);

  const filtered = useMemo(() => {
    const q = input.trim().toLowerCase();
    return q
      ? pool.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 25)
      : pool.slice(0, 25);
  }, [input, pool]);

  const applyMember = (m: OBMember) => {
    setInput(m.name);
    onPick(m);
  };

  return (
    <Combobox
      value={input}
      onValueChange={(val) => {
        const m = pool.find((x) => x.name === val);
        if (m) applyMember(m);
      }}
      onInputValueChange={(text) => {
        setInput(text);
        onNameChange(text);
      }}
      filter={null}
    >
      <ComboboxInput placeholder="Search member or type a new name..." showClear className="w-full">
        {photo && (
          <InputGroupAddon align="inline-start">
            <img src={photo} alt="" className="size-5 rounded-full object-cover" />
          </InputGroupAddon>
        )}
      </ComboboxInput>
      <ComboboxContent>
        <ComboboxList>
          {filtered.map((m) => (
            <ComboboxItem key={m.id} value={m.name}>
              {m.photo ? (
                <img src={m.photo} alt="" className="size-5 rounded-full object-cover" />
              ) : (
                <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                  {m.name.charAt(0)}
                </span>
              )}
              <span className="truncate">{m.name}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {m.year || "—"}
              </span>
            </ComboboxItem>
          ))}
        </ComboboxList>
        <ComboboxEmpty>
          {input.trim() ? `Create new member: "${input.trim()}"` : "Type a name to search members"}
        </ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  );
}

function SlotPhoto({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImageWithRatio(file, 4 / 3));
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
        {value ? (
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
            —
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Upload photo"
      >
        {uploading ? (
          <span className="size-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        ) : (
          <IconUpload className="size-3.5" />
        )}
      </Button>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange("")}
          title="Remove photo"
        >
          <IconX className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

export function OBCommitteeEditor({
  year,
  members,
  pool,
  readOnly = false,
}: {
  year: string;
  members: OBMember[];
  pool: OBMember[];
  readOnly?: boolean;
}) {
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<Slot[]>(() => buildSlots(members));

  const updateSlot = (key: string, patch: Partial<Slot>) => {
    setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const addSlot = (role: string) => {
    setSlots((prev) => {
      const sameRole = prev.filter((s) => s.role === role);
      const nextIndex = sameRole.length;
      return [
        ...prev,
        { key: `${role}#${nextIndex}`, role, name: "", email: "", photo: "", bio: "" },
      ];
    });
  };

  const removeSlot = (key: string) => {
    setSlots((prev) => prev.filter((s) => s.key !== key));
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      client.ob.obMembers.saveCommittee({
        year,
        entries: slots
          .filter((s) => s.name.trim())
          .map((s, i) => ({
            id: s.id || undefined,
            role: s.role,
            name: s.name.trim(),
            email: s.email.trim() || null,
            photo: s.photo || null,
            bio: s.bio.trim() || null,
            sortOrder: i,
          })),
      }),
    onSuccess: (res) => {
      toast.success(
        `Committee saved (${res.saved} members${res.removed ? `, ${res.removed} removed` : ""})`,
      );
      queryClient.invalidateQueries({ queryKey: ["ob-members"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-[0.2em] text-gold">
            {readOnly ? "COMMITTEE" : "COMMITTEE EDITOR"}
          </h2>
          {readOnly ? (
            <p className="text-xs text-muted-foreground mt-1">
              Read-only view of the {year} committee. The OB admin edits this in their own panel.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Assign a person to every role for {year}. Pick an existing OB member or type a new
              name — the whole committee saves at once.
            </p>
          )}
        </div>
        {!readOnly && (
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-green-dark text-cream hover:bg-green-darker"
          >
            {saveMutation.isPending ? "Saving..." : "Save Committee"}
          </Button>
        )}
      </div>

      {COMMITTEE_STRUCTURE.map((section) => (
        <Card key={section.section} className="overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3">
            <h3 className="text-xs font-bold tracking-[0.2em] text-green-dark">
              {section.section.toUpperCase()}
            </h3>
          </div>
          <CardContent className="p-5 space-y-3">
            {section.roles.map((r) => {
              const roleSlots = slots.filter((s) => s.role === r.role);
              return (
                <div key={r.role} className="space-y-2">
                  {roleSlots.map((slot, i) =>
                    readOnly ? (
                      <div key={slot.key} className="flex items-center gap-3">
                        <div className="w-44 shrink-0">
                          <div className="text-sm font-medium text-foreground">{r.label}</div>
                          {r.count > 1 && (
                            <div className="text-[11px] text-muted-foreground">#{i + 1}</div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-muted">
                            {slot.photo ? (
                              <img src={slot.photo} alt="" className="size-full object-cover" />
                            ) : (
                              <span className="flex size-full items-center justify-center text-xs font-bold text-muted-foreground">
                                {slot.name.charAt(0) || "—"}
                              </span>
                            )}
                          </div>
                          <span className="truncate text-sm text-green-dark">
                            {slot.name || "—"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div key={slot.key} className="flex items-center gap-3">
                        <div className="w-44 shrink-0">
                          <div className="text-sm font-medium text-foreground">{r.label}</div>
                          {r.count > 1 && (
                            <div className="text-[11px] text-muted-foreground">#{i + 1}</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <MemberPickField
                            name={slot.name}
                            photo={slot.photo}
                            pool={pool}
                            onNameChange={(name) => {
                              // If the typed name no longer matches the picked member, drop the
                              // id so it is treated as a brand-new member on save instead of
                              // silently renaming the old row.
                              const picked = slot.id
                                ? pool.find((m) => m.id === slot.id)
                                : undefined;
                              if (picked && picked.name !== name) {
                                updateSlot(slot.key, { name, id: undefined });
                              } else {
                                updateSlot(slot.key, { name });
                              }
                            }}
                            onPick={(m) =>
                              updateSlot(slot.key, {
                                id: m.id,
                                name: m.name,
                                email: m.email ?? "",
                                photo: m.photo ?? "",
                                bio: m.bio ?? "",
                              })
                            }
                          />
                          {slot.name.trim() && (
                            <input
                              type="email"
                              value={slot.email}
                              onChange={(e) => updateSlot(slot.key, { email: e.target.value })}
                              placeholder="Email (optional)"
                              className="mt-1.5 h-7 w-full max-w-[240px] rounded-md border border-input bg-transparent px-2 text-xs outline-none focus:border-ring"
                            />
                          )}
                        </div>
                        <SlotPhoto
                          value={slot.photo}
                          onChange={(v) => updateSlot(slot.key, { photo: v })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeSlot(slot.key)}
                          disabled={roleSlots.length <= 1}
                          title="Remove slot"
                        >
                          <IconTrash className="size-3.5" />
                        </Button>
                      </div>
                    ),
                  )}
                  {!readOnly && r.count > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-47 text-xs text-muted-foreground"
                      onClick={() => addSlot(r.role)}
                    >
                      <IconPlus className="size-3.5 mr-1" /> Add {r.label}
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
