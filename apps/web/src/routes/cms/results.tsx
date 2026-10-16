import {
  CmsButton,
  Field,
  FieldGrid,
  Panel,
  PanelHead,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import { FileUploader } from "@aloysius/ui/components/cms/file-uploader";
import {
  ScreenHead,
  ScreenWrap,
} from "@aloysius/ui/components/cms/screen-head";
import { FormDialog } from "@aloysius/ui/components/dialog";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useReducer, useRef, useState } from "react";

import { uploadImageFile } from "@/components/club/upload";
import { mutationErrorText } from "@/components/mutation-error";
import { orpc } from "@/utils/orpc";

/**
 * `/cms/results` - the examination results the `/results` page reads.
 *
 * Years are the unit of entry, because that is how the College publishes: once
 * a year, as one batch of figures. A year's rankers, achievers, bands and
 * scholarship passers hang off it, and deleting the year takes them with it.
 *
 * The page masthead is not here - that is the `results-header` block at
 * `/cms/results-page`. This screen is for figures; that one is for framing.
 */

interface ResultsYearRow {
  id: string;
  year: string;
  summary: {
    alUniversityEntrants?: string;
    alThreeA?: string;
    olNineA?: string;
    scholarshipPassers?: string;
  };
  alRankers: Record<string, { id: string; name: string; result: string }[]>;
  nineA: {
    total?: string;
    students: { id: string; name: string }[];
    bands: { band: string; count: string }[];
  };
  scholarship: {
    top: { id: string; name: string; marks: string }[];
    list: { id: string; name: string; marks: string }[];
  };
}

const STREAM_OPTIONS: { label: string; value: StreamValue }[] = [
  { label: "Physical Science", value: "physical-science" },
  { label: "Biological Science", value: "biological-science" },
  { label: "Commerce", value: "commerce" },
  { label: "Arts", value: "arts" },
  { label: "Engineering Technology", value: "engineering-technology" },
  { label: "Bio-systems Technology", value: "bio-systems-technology" },
];

/**
 * The wire type for a ranker's stream, matching `RESULTS_AL_STREAMS` in the
 * schema. Written out rather than derived from `STREAM_OPTIONS` so adding a
 * label to the dropdown without adding the stream to the database is a type
 * error rather than a row nothing renders.
 */
type StreamValue =
  | "physical-science"
  | "biological-science"
  | "commerce"
  | "arts"
  | "engineering-technology"
  | "bio-systems-technology";

interface YearFormState {
  year: string;
  alUniversityEntrants: string;
  alThreeA: string;
  olNineA: string;
  scholarshipPassers: string;
  nineATotal: string;
  scholarshipCutOff: string;
  scholarshipHighest: string;
  scholarshipPdfHref: string;
}

const EMPTY_YEAR: YearFormState = {
  year: "",
  alUniversityEntrants: "",
  alThreeA: "",
  olNineA: "",
  scholarshipPassers: "",
  nineATotal: "",
  scholarshipCutOff: "",
  scholarshipHighest: "",
  scholarshipPdfHref: "",
};

interface RankerFormState {
  /** Held as text by the select; cast to `StreamValue` at the mutation boundary. */
  stream: string;
  name: string;
  result: string;
  zScore: string;
  districtRank: string;
  islandRank: string;
  imageId: string | null;
  imagePreviewUrl: string | null;
}

const EMPTY_RANKER: RankerFormState = {
  stream: STREAM_OPTIONS[0]?.value ?? "physical-science",
  name: "",
  result: "",
  zScore: "",
  districtRank: "",
  islandRank: "",
  imageId: null,
  imagePreviewUrl: null,
};

interface NameOnlyFormState {
  name: string;
  marks: string;
  imageId: string | null;
  imagePreviewUrl: string | null;
}

const EMPTY_NAME_ONLY: NameOnlyFormState = {
  name: "",
  marks: "",
  imageId: null,
  imagePreviewUrl: null,
};

/**
 * One reducer per form, merging a partial patch into the whole state.
 *
 * `useReducer` rather than a `useState` setter per field: these dialogs have
 * nine and six fields respectively, and a setter each is nine names to keep in
 * step with the state interface.
 */
const patchReducer =
  <T,>() =>
  (state: T, patch: Partial<T>): T => ({ ...state, ...patch });

const blankOrNull = (value: string) => value.trim() || null;

const ResultsContent = () => {
  const queryClient = useQueryClient();
  const listQuery = orpc.cms.listResults.queryOptions();
  const { data: years } = useSuspenseQuery(listQuery);
  const [dialog, setDialog] = useState<{
    kind: DialogKind;
    open: boolean;
    yearId: string | null;
    token: number;
  }>({ kind: "year", open: false, token: 0, yearId: null });
  const openToken = useRef(0);

  const invalidate = () => queryClient.invalidateQueries(listQuery);

  const deleteYear = useMutation(
    orpc.cms.deleteResultsYear.mutationOptions({ onSuccess: invalidate })
  );
  const deleteRanker = useMutation(
    orpc.cms.deleteAlRanker.mutationOptions({ onSuccess: invalidate })
  );
  const deleteNineA = useMutation(
    orpc.cms.deleteNineA.mutationOptions({ onSuccess: invalidate })
  );
  const deleteScholarship = useMutation(
    orpc.cms.deleteScholarship.mutationOptions({ onSuccess: invalidate })
  );

  const open = (kind: DialogKind, yearId: string | null = null) =>
    setDialog({
      kind,
      open: true,
      token: (openToken.current += 1),
      yearId,
    });

  const close = () => setDialog((current) => ({ ...current, open: false }));

  return (
    <>
      <ScreenHead
        eyebrow="Content"
        heading="Examination Results"
        note="Published straight to the /results page — there is no review queue for results. A year only appears on the page once it exists here."
      />
      <Panel>
        <PanelHead
          action={
            <CmsButton onClick={() => open("year")} tone="primary">
              Add year
            </CmsButton>
          }
          title="Years"
        />
        {years.length === 0 ? (
          <p>
            No examination years yet. The results page shows an empty state
            until a year is added.
          </p>
        ) : (
          <RecordList label="Examination years">
            {years.map((row: ResultsYearRow) => (
              <li key={row.id}>
                <Panel>
                  <PanelHead
                    action={
                      <CmsButton
                        disabled={deleteYear.isPending}
                        onClick={() => deleteYear.mutate({ id: row.id })}
                        tone="danger"
                      >
                        Delete year
                      </CmsButton>
                    }
                    title={row.year}
                  />
                  <p>
                    {row.summary.alUniversityEntrants
                      ? `${row.summary.alUniversityEntrants} A/L university entrants`
                      : "No A/L figures"}{" "}
                    · {Object.values(row.alRankers).flat().length} rankers ·{" "}
                    {row.nineA.students.length} 9A achievers ·{" "}
                    {row.scholarship.top.length + row.scholarship.list.length}{" "}
                    scholarship passers
                  </p>

                  <RecordList label={`A/L rankers for ${row.year}`}>
                    {Object.entries(row.alRankers).flatMap(
                      ([stream, entries]) =>
                        entries.map((entry) => (
                          <RecordRow
                            actions={
                              <CmsButton
                                disabled={deleteRanker.isPending}
                                onClick={() =>
                                  deleteRanker.mutate({ id: entry.id })
                                }
                                tone="danger"
                              >
                                Remove
                              </CmsButton>
                            }
                            key={entry.id}
                            meta={stream}
                            name={`${entry.name} — ${entry.result}`}
                          />
                        ))
                    )}
                  </RecordList>
                  <CmsButton
                    onClick={() => open("ranker", row.id)}
                    tone="quiet"
                  >
                    Add A/L ranker
                  </CmsButton>

                  <RecordList label={`9A achievers for ${row.year}`}>
                    {row.nineA.students.map((student) => (
                      <RecordRow
                        actions={
                          <CmsButton
                            disabled={deleteNineA.isPending}
                            onClick={() =>
                              deleteNineA.mutate({ id: student.id })
                            }
                            tone="danger"
                          >
                            Remove
                          </CmsButton>
                        }
                        key={student.id}
                        name={student.name}
                      />
                    ))}
                  </RecordList>
                  <CmsButton
                    onClick={() => open("nine-a", row.id)}
                    tone="quiet"
                  >
                    Add 9A achiever
                  </CmsButton>

                  <RecordList label={`Scholarship passers for ${row.year}`}>
                    {[...row.scholarship.top, ...row.scholarship.list].map(
                      (entry) => (
                        <RecordRow
                          actions={
                            <CmsButton
                              disabled={deleteScholarship.isPending}
                              onClick={() =>
                                deleteScholarship.mutate({ id: entry.id })
                              }
                              tone="danger"
                            >
                              Remove
                            </CmsButton>
                          }
                          key={entry.id}
                          meta={entry.marks}
                          name={entry.name}
                        />
                      )
                    )}
                  </RecordList>
                  <CmsButton
                    onClick={() => open("scholarship", row.id)}
                    tone="quiet"
                  >
                    Add scholarship passer
                  </CmsButton>
                </Panel>
              </li>
            ))}
          </RecordList>
        )}
      </Panel>
      <ResultsDialog
        key={dialog.token}
        kind={dialog.kind}
        onClose={close}
        onSaved={invalidate}
        open={dialog.open}
        yearId={dialog.yearId}
      />
    </>
  );
};

/** Which of the four add-forms is showing. */
type DialogKind = "year" | "ranker" | "nine-a" | "scholarship";

interface ChildDialogProps {
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
  /** The year a ranker, achiever or passer belongs to. Null for the year form. */
  yearId: string | null;
}

const YearDialog = ({
  onClose,
  onSaved,
  open,
}: {
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
}) => {
  const [year, patch] = useReducer(patchReducer<YearFormState>(), EMPTY_YEAR);
  const create = useMutation(
    orpc.cms.createResultsYear.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  return (
    <FormDialog
      busy={create.isPending}
      error={mutationErrorText(create.error, "The year could not be saved.")}
      onClose={onClose}
      onSubmit={() =>
        create.mutate({
          year: year.year.trim(),
          alUniversityEntrants: blankOrNull(year.alUniversityEntrants),
          alThreeA: blankOrNull(year.alThreeA),
          olNineA: blankOrNull(year.olNineA),
          scholarshipPassers: blankOrNull(year.scholarshipPassers),
          nineATotal: blankOrNull(year.nineATotal),
          scholarshipCutOff: blankOrNull(year.scholarshipCutOff),
          scholarshipHighest: blankOrNull(year.scholarshipHighest),
          scholarshipPdfHref: blankOrNull(year.scholarshipPdfHref),
        })
      }
      open={open}
      submitDisabled={year.year.trim().length !== 4 || create.isPending}
      submitLabel="Save"
      title="Add examination year"
    >
      <FieldGrid>
        <Field
          hint="Four digits, e.g. 2025. One row per year, ever."
          kind="text"
          label="Year"
          onChange={(next) => patch({ year: next })}
          value={year.year}
        />
        <Field
          kind="text"
          label="A/L university entrants"
          onChange={(next) => patch({ alUniversityEntrants: next })}
          value={year.alUniversityEntrants}
        />
        <Field
          kind="text"
          label="A/L students with three A's"
          onChange={(next) => patch({ alThreeA: next })}
          value={year.alThreeA}
        />
        <Field
          kind="text"
          label="O/L 9A achievers"
          onChange={(next) => patch({ olNineA: next })}
          value={year.olNineA}
        />
        <Field
          hint="The total shown beside the big 9A, which is not the number of names in the grid."
          kind="text"
          label="9A total"
          onChange={(next) => patch({ nineATotal: next })}
          value={year.nineATotal}
        />
        <Field
          kind="text"
          label="Scholarship passers"
          onChange={(next) => patch({ scholarshipPassers: next })}
          value={year.scholarshipPassers}
        />
        <Field
          kind="text"
          label="Scholarship cut-off"
          onChange={(next) => patch({ scholarshipCutOff: next })}
          value={year.scholarshipCutOff}
        />
        <Field
          kind="text"
          label="Highest marks"
          onChange={(next) => patch({ scholarshipHighest: next })}
          value={year.scholarshipHighest}
        />
        <Field
          kind="url"
          label="Results PDF link"
          onChange={(next) => patch({ scholarshipPdfHref: next })}
          value={year.scholarshipPdfHref}
          wide
        />
      </FieldGrid>
    </FormDialog>
  );
};

const RankerDialog = ({ onClose, onSaved, open, yearId }: ChildDialogProps) => {
  const [ranker, patch] = useReducer(
    patchReducer<RankerFormState>(),
    EMPTY_RANKER
  );
  const create = useMutation(
    orpc.cms.createAlRanker.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  return (
    <FormDialog
      busy={create.isPending}
      error={mutationErrorText(create.error, "The ranker could not be saved.")}
      onClose={onClose}
      onSubmit={() =>
        create.mutate({
          yearId: yearId ?? "",
          stream: ranker.stream as StreamValue,
          name: ranker.name.trim(),
          result: ranker.result.trim(),
          zScore: blankOrNull(ranker.zScore),
          districtRank: blankOrNull(ranker.districtRank),
          islandRank: blankOrNull(ranker.islandRank),
          imageId: ranker.imageId,
        })
      }
      open={open}
      submitDisabled={
        !ranker.name.trim() || !ranker.result.trim() || create.isPending
      }
      submitLabel="Save"
      title="Add A/L ranker"
    >
      <FieldGrid>
        <Field
          kind="select"
          label="Stream"
          onChange={(next) => patch({ stream: next })}
          options={STREAM_OPTIONS}
          value={ranker.stream}
        />
        <Field
          kind="text"
          label="Name"
          onChange={(next) => patch({ name: next })}
          value={ranker.name}
        />
        <Field
          hint='As published, e.g. "3A" or "2A B".'
          kind="text"
          label="Result"
          onChange={(next) => patch({ result: next })}
          value={ranker.result}
        />
        <Field
          kind="text"
          label="Z-score"
          onChange={(next) => patch({ zScore: next })}
          value={ranker.zScore}
        />
        <Field
          kind="text"
          label="District rank"
          onChange={(next) => patch({ districtRank: next })}
          value={ranker.districtRank}
        />
        <Field
          kind="text"
          label="Island rank"
          onChange={(next) => patch({ islandRank: next })}
          value={ranker.islandRank}
        />
        <FileUploader
          clearable
          label="Photograph (optional)"
          onChange={(next) => patch({ imageId: next, imagePreviewUrl: null })}
          onUpload={uploadImageFile}
          previewUrl={ranker.imagePreviewUrl}
          ratioKey="principalPortrait"
          value={ranker.imageId}
          wide
        />
      </FieldGrid>
    </FormDialog>
  );
};

/**
 * The 9A achiever and scholarship passer dialogs.
 *
 * Separate components rather than one with a `withMarks` flag: each owns its
 * own mutation and its own error text, and folding them together meant one of
 * the two had to render an error belonging to the other.
 */
const NineADialog = ({ onClose, onSaved, open, yearId }: ChildDialogProps) => {
  const [person, patch] = useReducer(
    patchReducer<NameOnlyFormState>(),
    EMPTY_NAME_ONLY
  );
  const create = useMutation(
    orpc.cms.createNineA.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  return (
    <FormDialog
      busy={create.isPending}
      error={mutationErrorText(
        create.error,
        "The achiever could not be saved."
      )}
      onClose={onClose}
      onSubmit={() =>
        create.mutate({
          yearId: yearId ?? "",
          name: person.name.trim(),
          imageId: person.imageId,
        })
      }
      open={open}
      submitDisabled={!person.name.trim() || create.isPending}
      submitLabel="Save"
      title="Add 9A achiever"
    >
      <FieldGrid>
        <Field
          kind="text"
          label="Name"
          onChange={(next) => patch({ name: next })}
          value={person.name}
        />
        <FileUploader
          clearable
          label="Photograph (optional)"
          onChange={(next) => patch({ imageId: next, imagePreviewUrl: null })}
          onUpload={uploadImageFile}
          previewUrl={person.imagePreviewUrl}
          ratioKey="principalPortrait"
          value={person.imageId}
          wide
        />
      </FieldGrid>
    </FormDialog>
  );
};

const ScholarshipDialog = ({
  onClose,
  onSaved,
  open,
  yearId,
}: ChildDialogProps) => {
  const [person, patch] = useReducer(
    patchReducer<NameOnlyFormState>(),
    EMPTY_NAME_ONLY
  );
  const create = useMutation(
    orpc.cms.createScholarship.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  return (
    <FormDialog
      busy={create.isPending}
      error={mutationErrorText(
        create.error,
        "The scholarship passer could not be saved."
      )}
      onClose={onClose}
      onSubmit={() =>
        create.mutate({
          yearId: yearId ?? "",
          name: person.name.trim(),
          marks: person.marks.trim(),
          imageId: person.imageId,
        })
      }
      open={open}
      submitDisabled={
        !person.name.trim() || !person.marks.trim() || create.isPending
      }
      submitLabel="Save"
      title="Add scholarship passer"
    >
      <FieldGrid>
        <Field
          kind="text"
          label="Name"
          onChange={(next) => patch({ name: next })}
          value={person.name}
        />
        <Field
          hint="As published, e.g. 498."
          kind="text"
          label="Marks"
          onChange={(next) => patch({ marks: next })}
          value={person.marks}
        />
        <FileUploader
          clearable
          label="Photograph (optional)"
          onChange={(next) => patch({ imageId: next, imagePreviewUrl: null })}
          onUpload={uploadImageFile}
          previewUrl={person.imagePreviewUrl}
          ratioKey="principalPortrait"
          value={person.imageId}
          wide
        />
      </FieldGrid>
    </FormDialog>
  );
};

/**
 * Shows exactly one of the four dialogs.
 *
 * Only mounted for the dialog that is open, so each one's form state starts
 * empty every time rather than carrying the last entry's values into the next.
 */
const ResultsDialog = ({
  kind,
  onClose,
  onSaved,
  open,
  yearId,
}: ChildDialogProps & { kind: DialogKind }) => {
  const shared = { onClose, onSaved, open, yearId };

  if (kind === "year") {
    return <YearDialog {...shared} />;
  }
  if (kind === "ranker") {
    return <RankerDialog {...shared} />;
  }
  if (kind === "nine-a") {
    return <NineADialog {...shared} />;
  }
  return <ScholarshipDialog {...shared} />;
};

export const Route = createFileRoute("/cms/results")({
  head: () => ({
    meta: [
      { title: "Examination Results — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <ScreenWrap>
      <Suspense fallback={<div>Loading…</div>}>
        <ResultsContent />
      </Suspense>
    </ScreenWrap>
  ),
});
