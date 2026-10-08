import {
  CmsButton,
  Field,
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
import { useReducer, useRef, useState } from "react";

import { uploadImageFile } from "@/components/club/upload";
import { mutationErrorText } from "@/components/mutation-error";
import { orpc } from "@/utils/orpc";

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  coverImageId: string | null;
  coverImageUrl: string | null;
}

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

interface EventFormState {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  coverImageId: string | null;
  coverImagePreviewUrl: string | null;
}

const EMPTY_FORM_STATE: EventFormState = {
  title: "",
  description: "",
  location: "",
  startsAt: "",
  endsAt: "",
  coverImageId: null,
  coverImagePreviewUrl: null,
};

/** The dialog's initial state, read once per mount - the parent remounts the
 * dialog (via `key`) every time it opens, so this never needs to react to a
 * prop change after the fact. */
const formStateFromRow = (row: EventRow | null): EventFormState =>
  row
    ? {
        title: row.title,
        description: row.description ?? "",
        location: row.location ?? "",
        startsAt: isoToLocal(row.startsAt),
        endsAt: isoToLocal(row.endsAt),
        coverImageId: row.coverImageId,
        coverImagePreviewUrl: row.coverImageUrl,
      }
    : EMPTY_FORM_STATE;

interface FormAction {
  patch: Partial<EventFormState>;
  type: "patch";
}

const formReducer = (
  state: EventFormState,
  action: FormAction
): EventFormState => ({ ...state, ...action.patch });

const EventDialog = ({
  editing,
  onClose,
  onSaved,
  open,
}: {
  open: boolean;
  editing: EventRow | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, dispatch] = useReducer(formReducer, editing, formStateFromRow);
  const patch = (next: Partial<EventFormState>) =>
    dispatch({ patch: next, type: "patch" });

  const createMutation = useMutation(
    orpc.cms.createEvent.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );
  const updateMutation = useMutation(
    orpc.cms.updateEvent.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  const busy = createMutation.isPending || updateMutation.isPending;
  const startsAtIso = toIso(form.startsAt);
  const canSubmit =
    form.title.trim().length > 0 && startsAtIso !== null && !busy;

  const handleSubmit = () => {
    if (!startsAtIso) {
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      startsAt: startsAtIso,
      endsAt: toIso(form.endsAt),
      coverImageId: form.coverImageId,
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
      description="Live on the public events page the instant it is saved — there is no review queue for CMS-direct content."
      error={mutationErrorText(
        editing ? updateMutation.error : createMutation.error,
        "The event could not be saved."
      )}
      onClose={onClose}
      onSubmit={handleSubmit}
      open={open}
      submitDisabled={!canSubmit}
      submitLabel={editing ? "Save changes" : "Publish"}
      title={editing ? "Edit event" : "New event"}
    >
      <Field
        kind="text"
        label="Title"
        onChange={(next) => patch({ title: next })}
        value={form.title}
      />
      <Field
        kind="datetime"
        label="Starts at"
        onChange={(next) => patch({ startsAt: next })}
        value={form.startsAt}
      />
      <Field
        kind="datetime"
        label="Ends at (optional)"
        onChange={(next) => patch({ endsAt: next })}
        value={form.endsAt}
      />
      <Field
        kind="text"
        label="Location (optional)"
        onChange={(next) => patch({ location: next })}
        value={form.location}
      />
      <Field
        kind="textarea"
        label="Description (optional)"
        onChange={(next) => patch({ description: next })}
        value={form.description}
      />
      <FileUploader
        clearable
        label="Cover image (optional)"
        onChange={(next) => {
          patch({ coverImageId: next, coverImagePreviewUrl: null });
        }}
        onUpload={uploadImageFile}
        previewUrl={form.coverImagePreviewUrl}
        ratioKey="newsCard"
        value={form.coverImageId}
      />
    </FormDialog>
  );
};

const EventsContent = () => {
  const queryClient = useQueryClient();
  const listQuery = orpc.cms.listEvents.queryOptions();
  const { data: events } = useSuspenseQuery(listQuery);
  const [dialog, setDialog] = useState<{
    open: boolean;
    editing: EventRow | null;
    token: number;
  }>({ editing: null, open: false, token: 0 });
  const openToken = useRef(0);

  const deleteMutation = useMutation(
    orpc.cms.deleteEvent.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(listQuery),
    })
  );

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Content"
        heading="Events"
        note="Published directly here — there is no review queue for this content type. Past events stay listed so they can still be edited or removed."
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
              Add event
            </CmsButton>
          }
          title="Events"
        />
        {events.length === 0 ? (
          <p>No events yet.</p>
        ) : (
          <RecordList label="Events">
            {events.map((item) => (
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
                  new Date(item.startsAt).toLocaleString(),
                  item.location,
                  item.description,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                name={item.title}
              />
            ))}
          </RecordList>
        )}
      </Panel>
      <EventDialog
        editing={dialog.editing}
        key={dialog.token}
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
        onSaved={() => queryClient.invalidateQueries(listQuery)}
        open={dialog.open}
      />
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/cms/events")({
  head: () => ({
    meta: [
      { title: "Events — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EventsContent,
});
