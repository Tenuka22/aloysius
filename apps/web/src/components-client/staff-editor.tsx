"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@aloysius-web/ui/components/combobox";
import { IconPlus, IconTrash, IconUpload, IconX } from "@tabler/icons-react";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import { uploadImageWithRatio } from "@/lib/upload-image";

export type StaffMember = {
  id: string;
  name: string;
  role: string;
  email: string | null;
  photo: string | null;
  bio: string | null;
  year: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

const SUGGESTED_ROLES = [
  "Vice Principal",
  "Sectional Head",
  "Head of Department",
  "Teacher",
  "Bursar",
  "Registrar",
  "Academic Staff",
  "Admin Staff",
  "Games Master",
  "Librarian",
];

type Slot = {
  key: string;
  id?: string;
  name: string;
  role: string;
  email: string;
  photo: string;
  bio: string;
};

function buildSlots(members: StaffMember[]): Slot[] {
  const sorted = [...members].sort((a, b) => a.sortOrder - b.sortOrder);
  if (sorted.length === 0) {
    return [{ key: "new#0", name: "", role: "", email: "", photo: "", bio: "" }];
  }
  return sorted.map((m) => ({
    key: m.id,
    id: m.id,
    name: m.name,
    role: m.role,
    email: m.email ?? "",
    photo: m.photo ?? "",
    bio: m.bio ?? "",
  }));
}

function NamePickField({
  name,
  pool,
  onNameChange,
  onPick,
}: {
  name: string;
  pool: StaffMember[];
  onNameChange: (name: string) => void;
  onPick: (member: StaffMember) => void;
}) {
  const [input, setInput] = useState(name);
  useEffect(() => setInput(name), [name]);

  const filtered = useMemo(() => {
    const q = input.trim().toLowerCase();
    return q ? pool.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 25) : pool.slice(0, 25);
  }, [input, pool]);

  const applyMember = (m: StaffMember) => {
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
      <ComboboxInput placeholder="Search staff or type a new name..." showClear className="w-full" />
      <ComboboxContent>
        <ComboboxList>
          {filtered.map((m) => (
            <ComboboxItem key={m.id} value={m.name}>
              {m.photo ? (
                <img src={m.photo} alt="" className="size-8 rounded-full object-cover" />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {m.name.charAt(0)}
                </span>
              )}
              <span className="truncate">{m.name}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">{m.role || "—"}</span>
            </ComboboxItem>
          ))}
        </ComboboxList>
        <ComboboxEmpty>
          {input.trim() ? `Create new staff: "${input.trim()}"` : "Type a name to search staff"}
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
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {value ? (
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-xs text-muted-foreground">—</span>
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
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange("")} title="Remove photo">
          <IconX className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

export function StaffEditor({
  year,
  members,
  pool,
  readOnly = false,
}: {
  year: string;
  members: StaffMember[];
  pool: StaffMember[];
  readOnly?: boolean;
}) {
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<Slot[]>(() => buildSlots(members));

  const updateSlot = (key: string, patch: Partial<Slot>) => {
    setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const addSlot = () => {
    setSlots((prev) => [...prev, { key: `new#${prev.length}`, name: "", role: "", email: "", photo: "", bio: "" }]);
  };

  const removeSlot = (key: string) => {
    setSlots((prev) => (prev.length > 1 ? prev.filter((s) => s.key !== key) : prev));
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      client.staff.saveYear({
        year,
        entries: slots
          .filter((s) => s.name.trim())
          .map((s, i) => ({
            id: s.id || undefined,
            name: s.name.trim(),
            role: s.role.trim() || "Staff",
            email: s.email.trim() || null,
            photo: s.photo || null,
            bio: s.bio.trim() || null,
            sortOrder: i,
          })),
      }),
    onSuccess: (res) => {
      toast.success(`Staff saved (${res.saved} members${res.removed ? `, ${res.removed} removed` : ""})`);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-[0.2em] text-muted-foreground">STAFF ROSTER</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Assign the {year} staff. Pick an existing staff member or type a new name — the whole roster saves at once.
          </p>
        </div>
        {!readOnly && (
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-green-dark text-cream hover:bg-green-darker"
          >
            {saveMutation.isPending ? "Saving..." : "Save Roster"}
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-white">
        {slots.map((slot, index) => (
          <div key={slot.key} className={`p-4 ${index > 0 ? "border-t" : ""}`}>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-[220px] flex-[2]">
                    <NamePickField
                      name={slot.name}
                      pool={pool}
                      onNameChange={(name) => {
                        const picked = slot.id ? pool.find((m) => m.id === slot.id) : undefined;
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
                          role: m.role || slot.role,
                          email: m.email ?? "",
                          photo: m.photo ?? "",
                          bio: m.bio ?? "",
                        })
                      }
                    />
                  </div>
                  <div className="min-w-[160px] flex-1">
                    <input
                      type="text"
                      value={slot.role}
                      onChange={(e) => updateSlot(slot.key, { role: e.target.value })}
                      placeholder="Role (e.g. Head of Science)"
                      list="staff-role-suggestions"
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring"
                    />
                    <datalist id="staff-role-suggestions">
                      {SUGGESTED_ROLES.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeSlot(slot.key)}
                      disabled={slots.length <= 1}
                      title="Remove"
                      className="shrink-0 self-start"
                    >
                      <IconTrash className="size-3.5" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="email"
                    value={slot.email}
                    onChange={(e) => updateSlot(slot.key, { email: e.target.value })}
                    placeholder="Email (optional)"
                    className="h-8 w-full max-w-[260px] rounded-md border border-input bg-transparent px-2 text-xs outline-none focus:border-ring"
                  />
                  <SlotPhoto value={slot.photo} onChange={(v) => updateSlot(slot.key, { photo: v })} />
                </div>
                <input
                  type="text"
                  value={slot.bio}
                  onChange={(e) => updateSlot(slot.key, { bio: e.target.value })}
                  placeholder="Short bio / subject area (optional)"
                  className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs outline-none focus:border-ring"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <Button type="button" variant="ghost" size="sm" onClick={addSlot} className="text-muted-foreground">
          <IconPlus className="size-3.5 mr-1" /> Add Staff Member
        </Button>
      )}
    </div>
  );
}
