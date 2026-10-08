import {
  CmsButton,
  Field,
  Panel,
  PanelHead,
  RecordList,
  RecordRow,
  SwitchRow,
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
import { useReducer, useRef, useState } from "react";

import { uploadImageFile } from "@/components/club/upload";
import { mutationErrorText } from "@/components/mutation-error";
import { orpc } from "@/utils/orpc";

type Audience = "all" | "students" | "staff" | "parents" | "alumni";
type Severity = "info" | "important" | "urgent";

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  severity: Severity;
  isPinned: boolean;
  imageId: string | null;
  imageUrl: string | null;
  effectiveFrom: string | null;
  expiresAt: string | null;
  publishedAt: string | null;
}

const AUDIENCE_OPTIONS = [
  { label: "Everyone", value: "all" },
  { label: "Students", value: "students" },
  { label: "Staff", value: "staff" },
  { label: "Parents", value: "parents" },
  { label: "Alumni", value: "alumni" },
];

const SEVERITY_OPTIONS = [
  { label: "Info", value: "info" },
  { label: "Important", value: "important" },
  { label: "Urgent", value: "urgent" },
];

const PAD = (value: number) => String(value).padStart(2, "0");

/** `<input type="datetime-local">` has no timezone of its own — the browser
 * reports it in local time with no offset, so this reads it as local and
 * lets `Date` attach the zone. */
const toIso = (localValue: string): string | null => {
  if (!localValue) {
    return null;
  }
  const date = new Date(localValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/** Inverse of `toIso`, for pre-filling a `datetime-local` input from a stored
 * ISO timestamp — formatted in local time, with no timezone suffix. */
const isoToLocal = (iso: string | null): string => {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getFullYear()}-${PAD(date.getMonth() + 1)}-${PAD(date.getDate())}T${PAD(date.getHours())}:${PAD(date.getMinutes())}`;
};

interface AnnouncementFormState {
  title: string;
  body: string;
  audience: string;
  severity: string;
  isPinned: boolean;
  imageId: string | null;
  imagePreviewUrl: string | null;
  effectiveFrom: string;
  expiresAt: string;
}

const EMPTY_FORM_STATE: AnnouncementFormState = {
  title: "",
  body: "",
  audience: "all",
  severity: "info",
  isPinned: false,
  imageId: null,
  imagePreviewUrl: null,
  effectiveFrom: "",
  expiresAt: "",
};

/** The dialog's initial state, read once per mount - the parent remounts the
 * dialog (via `key`) every time it opens, so this never needs to react to a
 * prop change after the fact. */
const formStateFromRow = (
  row: AnnouncementRow | null
): AnnouncementFormState =>
  row
    ? {
        title: row.title,
        body: row.body,
        audience: row.audience,
        severity: row.severity,
        isPinned: row.isPinned,
        imageId: row.imageId,
        imagePreviewUrl: row.imageUrl,
        effectiveFrom: isoToLocal(row.effectiveFrom),
        expiresAt: isoToLocal(row.expiresAt),
      }
    : EMPTY_FORM_STATE;

interface FormAction {
  patch: Partial<AnnouncementFormState>;
  type: "patch";
}

const formReducer = (
  state: AnnouncementFormState,
  action: FormAction
): AnnouncementFormState => ({ ...state, ...action.patch });

const AnnouncementDialog = ({
  editing,
  onClose,
  onSaved,
  open,
}: {
  open: boolean;
  editing: AnnouncementRow | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, dispatch] = useReducer(formReducer, editing, formStateFromRow);
  const patch = (next: Partial<AnnouncementFormState>) =>
    dispatch({ patch: next, type: "patch" });

  const createMutation = useMutation(
    orpc.cms.createAnnouncement.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );
  const updateMutation = useMutation(
    orpc.cms.updateAnnouncement.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  const busy = createMutation.isPending || updateMutation.isPending;
  const canSubmit =
    form.title.trim().length > 0 && form.body.trim().length > 0 && !busy;

  const handleSubmit = () => {
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      audience: form.audience as Audience,
      severity: form.severity as Severity,
      isPinned: form.isPinned,
      imageId: form.imageId,
      effectiveFrom: toIso(form.effectiveFrom),
      expiresAt: toIso(form.expiresAt),
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <FormDialog
      busy={busy}
      description="Live on the public notices page the instant it is saved — there is no review queue for CMS-direct content."
      error={mutationErrorText(
        editing ? updateMutation.error : createMutation.error,
        "The announcement could not be saved."
      )}
      onClose={onClose}
      onSubmit={handleSubmit}
      open={open}
      submitDisabled={!canSubmit}
      submitLabel={editing ? "Save changes" : "Publish"}
      title={editing ? "Edit announcement" : "New announcement"}
    >
      <Field
        kind="text"
        label="Title"
        onChange={(next) => patch({ title: next })}
        value={form.title}
      />
      <Field
        kind="textarea"
        label="Body"
        onChange={(next) => patch({ body: next })}
        value={form.body}
      />
      <Field
        kind="select"
        label="Audience"
        onChange={(next) => patch({ audience: next })}
        options={AUDIENCE_OPTIONS}
        value={form.audience}
      />
      <Field
        kind="select"
        label="Severity"
        onChange={(next) => patch({ severity: next })}
        options={SEVERITY_OPTIONS}
        value={form.severity}
      />
      <SwitchRow
        checked={form.isPinned}
        label="Pinned"
        onToggle={() => patch({ isPinned: !form.isPinned })}
      />
      <FileUploader
        clearable
        label="Image (optional)"
        onChange={(next) => {
          patch({ imageId: next, imagePreviewUrl: null });
        }}
        onUpload={uploadImageFile}
        previewUrl={form.imagePreviewUrl}
        ratioKey="newsCard"
        value={form.imageId}
      />
      <Field
        hint="Optional — hides the announcement from the public page before this time."
        kind="datetime"
        label="Effective from (optional)"
        onChange={(next) => patch({ effectiveFrom: next })}
        value={form.effectiveFrom}
      />
      <Field
        hint="Optional — hides the announcement from the public page after this time."
        kind="datetime"
        label="Expires at (optional)"
        onChange={(next) => patch({ expiresAt: next })}
        value={form.expiresAt}
      />
    </FormDialog>
  );
};

const AnnouncementsContent = () => {
  const queryClient = useQueryClient();
  const listQuery = orpc.cms.listAnnouncements.queryOptions();
  const { data: announcements } = useSuspenseQuery(listQuery);
  const [dialog, setDialog] = useState<{
    open: boolean;
    editing: AnnouncementRow | null;
    token: number;
  }>({ editing: null, open: false, token: 0 });
  const openToken = useRef(0);

  const deleteMutation = useMutation(
    orpc.cms.deleteAnnouncement.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(listQuery),
    })
  );

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Content"
        heading="Announcements"
        note="Published directly here — there is no review queue for this content type."
      />
      <Panel>
        <PanelHead
          action={
            <CmsButton
              onClick={() =>
                setDialog({
                  editing: null,
                  open: true,
                  token: (openToken.current += 1),
                })
              }
              tone="primary"
            >
              Add announcement
            </CmsButton>
          }
          title="Announcements"
        />
        {announcements.length === 0 ? (
          <p>No announcements yet.</p>
        ) : (
          <RecordList label="Announcements">
            {announcements.map((item) => (
              <RecordRow
                actions={
                  <>
                    <CmsButton
                      onClick={() =>
                        setDialog({
                          editing: item,
                          open: true,
                          token: (openToken.current += 1),
                        })
                      }
                      tone="quiet"
                    >
                      Edit
                    </CmsButton>
                    <CmsButton
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate({ id: item.id })}
                      tone="danger"
                    >
                      Delete
                    </CmsButton>
                  </>
                }
                key={item.id}
                meta={[
                  item.isPinned && "Pinned",
                  item.audience,
                  item.severity,
                  item.body,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                name={item.title}
              />
            ))}
          </RecordList>
        )}
      </Panel>
      <AnnouncementDialog
        editing={dialog.editing}
        key={dialog.token}
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
        onSaved={() => queryClient.invalidateQueries(listQuery)}
        open={dialog.open}
      />
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/cms/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AnnouncementsContent,
});
