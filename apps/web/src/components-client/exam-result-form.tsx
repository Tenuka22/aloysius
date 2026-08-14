"use client";

import { useCallback, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@aloysius-web/ui/components/button";
import { FormBuilder, useBuildForm } from "@aloysius-web/ui/lib/form-builder";
import { Dropzone } from "@/components/file-upload";
import { uploadImageWithRatio } from "@/lib/upload-image";
import { IconX, IconPlus, IconGripVertical } from "@tabler/icons-react";
import { cn } from "@aloysius-web/ui/lib/utils";
import { client } from "@/utils/orpc";
import { toast } from "sonner";
import * as v from "valibot";
import type { FormConfig, FieldEntry } from "@aloysius-web/ui/lib/form-builder";

const EXAM_TYPES = [
  { value: "scholarship", label: "G5 Scholarship" },
  { value: "ol", label: "GCE O/L" },
  { value: "al", label: "GCE A/L" },
] as const;

const GRADES = ["A", "B", "C", "D", "S", "F"] as const;

const STREAMS = [
  { value: "art", label: "ART" },
  { value: "commerce", label: "COMMERCE" },
  { value: "bio", label: "BIO" },
  { value: "maths", label: "MATHS" },
] as const;

/** Default subject rows per exam type (editable). */
function defaultSubjects(examType: string): { subject: string; grade: string }[] {
  if (examType === "ol") {
    return [
      "Sinhala",
      "English",
      "Mathematics",
      "Science",
      "History",
      "Religion",
      "Commerce",
      "ICT",
      "Art",
    ].map((subject) => ({ subject, grade: "" }));
  }
  if (examType === "al") {
    return [
      { subject: "Biology", grade: "" },
      { subject: "Chemistry", grade: "" },
      { subject: "Physics", grade: "" },
    ];
  }
  return [];
}

function blankStudent(examType: string, index: number) {
  return {
    id: `new-${Date.now()}-${index}`,
    name: "",
    photo: "",
    quote: "",
    marks: examType === "scholarship" ? 0 : undefined,
    stream: examType === "al" ? "bio" : undefined,
    subjects: defaultSubjects(examType),
    sortOrder: index,
  };
}

const subjectRowSchema = v.object({
  subject: v.string(),
  grade: v.string(),
});

const studentSchema = v.object({
  id: v.optional(v.string()),
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  photo: v.optional(v.string()),
  quote: v.optional(v.string()),
  marks: v.optional(v.union([v.number(), v.string()])),
  stream: v.optional(v.string()),
  subjects: v.array(subjectRowSchema),
  sortOrder: v.optional(v.union([v.number(), v.string()])),
});

const createExamResultSchema = v.object({
  examType: v.pipe(v.string(), v.minLength(1, "Exam type is required")),
  examYear: v.pipe(v.string(), v.minLength(1, "Exam year is required")),
  resultsYear: v.pipe(v.string(), v.minLength(1, "Results year is required")),
  publishNow: v.boolean(),
  students: v.array(studentSchema),
});

type CreateExamResultValues = v.InferOutput<typeof createExamResultSchema>;

const updateExamResultSchema = v.object({
  examType: v.pipe(v.string(), v.minLength(1, "Exam type is required")),
  examYear: v.pipe(v.string(), v.minLength(1, "Exam year is required")),
  resultsYear: v.pipe(v.string(), v.minLength(1, "Results year is required")),
  publishNow: v.boolean(),
  students: v.array(studentSchema),
});

type UpdateExamResultValues = v.InferOutput<typeof updateExamResultSchema>;

const fields: FieldEntry<CreateExamResultValues | UpdateExamResultValues>[] = [
  { name: "examType", kind: "text", label: "Exam Type", hidden: true, required: true },
  { name: "examYear", kind: "text", label: "Exam Year", hidden: true, required: true },
  { name: "resultsYear", kind: "text", label: "Results Year", hidden: true, required: true },
  { name: "publishNow", kind: "checkbox", label: "Publish immediately", required: false },
  { name: "students", kind: "text", label: "Students", hidden: true, required: false },
];

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const textareaClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function ExamTypeField() {
  const form = useBuildForm();
  const examType = useStore(form.store, (state: any) => state.values.examType) as string;
  const students = (useStore(form.store, (state: any) => state.values.students) as any[]) ?? [];

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">
        Exam <span className="text-destructive">*</span>
      </label>
      <select
        value={examType}
        onChange={(e) => {
          const next = e.target.value;
          form.setFieldValue("examType", next);
          // Re-seed subject rows whenever the exam type changes.
          form.setFieldValue(
            "students",
            students.map((s) => ({
              ...s,
              marks: next === "scholarship" ? (s.marks ?? 0) : undefined,
              stream: next === "al" ? (s.stream ?? "bio") : undefined,
              subjects: next === "ol" || next === "al" ? defaultSubjects(next) : [],
            })),
          );
        }}
        className={inputClass}
      >
        {EXAM_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        G5 Scholarship uses marks /200. O/L uses 9 subjects. A/L uses 3 subjects across a stream.
      </p>
    </div>
  );
}

function YearFields() {
  const form = useBuildForm();
  const examYear = useStore(form.store, (state: any) => state.values.examYear) as string;
  const resultsYear = useStore(form.store, (state: any) => state.values.resultsYear) as string;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium leading-none">
          Exam Year <span className="text-destructive">*</span>
        </label>
        <input
          type="number"
          value={examYear}
          onChange={(e) => form.setFieldValue("examYear", e.target.value)}
          placeholder="e.g. 2026"
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground">The year the exam was held</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium leading-none">
          Results Year <span className="text-destructive">*</span>
        </label>
        <input
          type="number"
          value={resultsYear}
          onChange={(e) => form.setFieldValue("resultsYear", e.target.value)}
          placeholder="e.g. 2026"
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground">The year results were released (shown in brackets)</p>
      </div>
    </div>
  );
}

/** Grade select A B C D S F */
function GradeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputClass, "h-8 w-[72px] px-1.5 text-center font-semibold")}
    >
      <option value="">-</option>
      {GRADES.map((g) => (
        <option key={g} value={g}>
          {g}
        </option>
      ))}
    </select>
  );
}

function StudentCard({
  student,
  index,
  examType,
  onChange,
  onRemove,
}: {
  student: any;
  index: number;
  examType: string;
  onChange: (updated: any) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handlePhoto = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setUploading(true);
      try {
        onChange({ ...student, photo: await uploadImageWithRatio(file, 1) });
      } catch {
        toast.error("Failed to upload photo");
      } finally {
        setUploading(false);
      }
    },
    [student, onChange],
  );

  const setSubject = (i: number, patch: Partial<{ subject: string; grade: string }>) => {
    const subjects = (student.subjects ?? []).map((s: any, si: number) =>
      si === i ? { ...s, ...patch } : s,
    );
    onChange({ ...student, subjects });
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <IconGripVertical className="size-4 shrink-0" />
          Top Performer #{index + 1}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground">Rank</label>
            <input
              type="number"
              value={student.sortOrder ?? index}
              onChange={(e) => onChange({ ...student, sortOrder: Number(e.target.value) })}
              className={cn(inputClass, "h-8 w-[70px]")}
            />
          </div>
          <Button variant="ghost" size="icon-sm" type="button" onClick={onRemove}>
            <IconX className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-[72px] shrink-0">
          {student.photo ? (
            <div className="relative overflow-hidden rounded-lg border">
              <img src={student.photo} alt="" className="aspect-square w-full object-cover" />
              <Button
                variant="destructive"
                size="sm"
                type="button"
                className="absolute top-1 right-1 size-6 p-0"
                onClick={() => onChange({ ...student, photo: "" })}
              >
                <IconX className="size-3" />
              </Button>
            </div>
          ) : (
            <Dropzone
              onFilesSelected={handlePhoto}
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
              disabled={uploading}
              crop
              aspect={1}
              cropTitle="Crop Student Photo"
              className={cn(
                "aspect-square justify-center p-2",
                uploading && "opacity-50 pointer-events-none",
              )}
            />
          )}
        </div>

        <div className="flex-1 space-y-3">
          <input
            type="text"
            value={student.name}
            onChange={(e) => onChange({ ...student, name: e.target.value })}
            placeholder="Student name"
            className={inputClass}
          />

          {examType === "scholarship" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none">Marks (out of 200)</label>
              <input
                type="number"
                min={0}
                max={200}
                value={student.marks ?? ""}
                onChange={(e) => onChange({ ...student, marks: Number(e.target.value) })}
                placeholder="e.g. 195"
                className={inputClass}
              />
            </div>
          )}

          {examType === "al" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none">Stream</label>
              <select
                value={student.stream ?? "bio"}
                onChange={(e) => onChange({ ...student, stream: e.target.value })}
                className={inputClass}
              >
                {STREAMS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">
              Subjects &amp; Grades
              {examType === "ol" && <span className="text-muted-foreground font-normal"> (9 subjects)</span>}
              {examType === "al" && <span className="text-muted-foreground font-normal"> (3 subjects)</span>}
            </label>
            {(student.subjects ?? []).length > 0 ? (
              <div className="space-y-1.5">
                {(student.subjects ?? []).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={s.subject}
                      onChange={(e) => setSubject(i, { subject: e.target.value })}
                      placeholder={`Subject ${i + 1}`}
                      className={inputClass}
                    />
                    <GradeSelect value={s.grade} onChange={(g) => setSubject(i, { grade: g })} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No subjects for this exam type.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">Quote (optional)</label>
            <textarea
              value={student.quote ?? ""}
              onChange={(e) => onChange({ ...student, quote: e.target.value })}
              placeholder="A small quote from the student..."
              rows={2}
              className={textareaClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentsEditor() {
  const form = useBuildForm();
  const examType = useStore(form.store, (state: any) => state.values.examType) as string;
  const students = (useStore(form.store, (state: any) => state.values.students) as any[]) ?? [];

  const updateStudent = (index: number, updated: any) => {
    form.setFieldValue(
      "students",
      students.map((s, i) => (i === index ? updated : s)),
    );
  };

  const removeStudent = (index: number) => {
    form.setFieldValue(
      "students",
      students.filter((_, i) => i !== index).map((s, i) => ({ ...s, sortOrder: i })),
    );
  };

  const addStudent = () => {
    const next = blankStudent(examType, students.length);
    form.setFieldValue("students", [...students, next]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Top Performers</h3>
          <p className="text-xs text-muted-foreground">
            Add the top-scoring students with their photos and results.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addStudent}>
          <IconPlus className="mr-1 size-4" />
          Add Student
        </Button>
      </div>

      {students.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          No students added yet.
        </p>
      ) : (
        <div className="space-y-3">
          {students.map((student, index) => (
            <StudentCard
              key={student.id ?? index}
              student={student}
              index={index}
              examType={examType}
              onChange={(updated) => updateStudent(index, updated)}
              onRemove={() => removeStudent(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ExamResultForm({
  mode,
  id,
  onSuccess,
}: {
  mode: "create" | "edit";
  id?: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  const existing = useQuery({
    queryKey: ["examResults", id],
    queryFn: () => client.examResults.get({ id: id! }),
    enabled: mode === "edit" && !!id,
  });

  const config: FormConfig<CreateExamResultValues | UpdateExamResultValues> = {
    fields,
    layout: [
      { columns: [{ fields: ["publishNow"] }] },
    ],
    submitLabel: mode === "create" ? "Create Exam Result" : "Save Changes",
    onCancel: () => onSuccess?.(),
    renderAboveFields: () => (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ExamTypeField />
          <YearFields />
        </div>
      </div>
    ),
    renderBelowFields: () => <StudentsEditor />,
  };

  const onSave = async (values: CreateExamResultValues | UpdateExamResultValues) => {
    const payload = {
      examType: values.examType,
      examYear: Number(values.examYear),
      resultsYear: Number(values.resultsYear),
      publishNow: values.publishNow,
      students: (values.students ?? []).map((s) => ({
        name: s.name,
        photo: s.photo || undefined,
        quote: s.quote || undefined,
        marks: typeof s.marks === "number" ? s.marks : s.marks ? Number(s.marks) : undefined,
        stream: (s.stream as any) || undefined,
        subjects: (s.subjects ?? []).filter((x: any) => x.subject.trim()),
        sortOrder: s.sortOrder == null || s.sortOrder === "" ? undefined : Number(s.sortOrder),
      })),
    };
    if (mode === "create") {
      return client.examResults.create(payload as any);
    }
    return client.examResults.update({ id: id!, ...payload } as any);
  };

  if (mode === "edit" && existing.isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="h-10 rounded bg-muted animate-pulse" />
        <div className="h-20 rounded bg-muted animate-pulse" />
        <div className="h-[300px] rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (mode === "edit" && !existing.data) {
    return <div className="p-4 text-center text-muted-foreground">Exam result not found.</div>;
  }

  const result = existing.data as any;

  return (
    <FormBuilder
      config={config}
      valibotSchema={mode === "create" ? createExamResultSchema : updateExamResultSchema}
      defaultValues={
        result
          ? {
              examType: result.examType,
              examYear: String(result.examYear),
              resultsYear: String(result.resultsYear),
              publishNow: result.status === "published",
              students: (result.students ?? []).map((s: any, i: number) => ({
                id: s.id ?? i,
                name: s.name,
                photo: s.photo ?? "",
                quote: s.quote ?? "",
                marks: s.marks ?? (result.examType === "scholarship" ? 0 : undefined),
                stream: s.stream ?? (result.examType === "al" ? "bio" : undefined),
                subjects:
                  s.subjects && s.subjects.length > 0
                    ? s.subjects
                    : defaultSubjects(result.examType),
                sortOrder: s.sortOrder ?? i,
              })),
            }
          : {
              examType: "scholarship",
              examYear: "",
              resultsYear: "",
              publishNow: false,
              students: [],
            }
      }
      onSubmit={async (values) => {
        try {
          await onSave(values);
          toast.success(mode === "create" ? "Exam result created" : "Exam result updated");
          queryClient.invalidateQueries({ queryKey: ["examResults"] });
          onSuccess?.();
        } catch (err: any) {
          toast.error(err.message);
        }
      }}
    />
  );
}
