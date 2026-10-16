import { ALUMNI_NOTABLE_CATEGORIES } from "@aloysius/db/schema/alumni-notables";
import type { AlumniNotableCategory } from "@aloysius/db/schema/alumni-notables";
import {
  CmsButton,
  Field,
  FieldGrid,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import { FileUploader } from "@aloysius/ui/components/cms/file-uploader";
import {
  ScreenHead,
  ScreenWrap,
} from "@aloysius/ui/components/cms/screen-head";
import { FormDialog } from "@aloysius/ui/components/dialog";
import { ALUMNI_NOTABLE_CATEGORY_LABELS } from "@aloysius/ui/content/alumni";
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
 * `/cms/alumni-notables` - the Hall of Fame on `/alumni`.
 *
 * Any number of rows per category - unlike the old `ALUMNI_NOTABLES` array,
 * which held exactly one name per category with no role. The category
 * options mirror `ALUMNI_NOTABLE_CATEGORY_LABELS` from
 * `@aloysius/ui/content/alumni`, the same labels the public page shows.
 */

const CATEGORY_OPTIONS = ALUMNI_NOTABLE_CATEGORIES.map((category) => ({
  label: ALUMNI_NOTABLE_CATEGORY_LABELS[category] ?? category,
  value: category,
}));

const isAlumniNotableCategory = (
  value: string
): value is AlumniNotableCategory =>
  (ALUMNI_NOTABLE_CATEGORIES as readonly string[]).includes(value);

const DEFAULT_CATEGORY: AlumniNotableCategory = ALUMNI_NOTABLE_CATEGORIES[0];

interface NotableFormState {
  name: string;
  category: AlumniNotableCategory;
  role: string;
  imageId: string | null;
  imagePreviewUrl: string | null;
}

const EMPTY_NOTABLE: NotableFormState = {
  name: "",
  category: DEFAULT_CATEGORY,
  role: "",
  imageId: null,
  imagePreviewUrl: null,
};

const blankOrNull = (value: string) => value.trim() || null;

/** A row being edited, with the id the mutation needs. */
interface EditingNotable extends NotableFormState {
  id: string;
}

interface NotableDialogProps {
  editing: EditingNotable | null;
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
}

const NotableDialog = ({
  editing,
  onClose,
  onSaved,
  open,
}: NotableDialogProps) => {
  const [form, patch] = useReducer(
    (
      state: NotableFormState,
      statePatch: Partial<NotableFormState>
    ): NotableFormState => ({
      ...state,
      ...statePatch,
    }),
    editing ?? EMPTY_NOTABLE
  );

  const create = useMutation(
    orpc.cms.createAlumniNotable.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );
  const update = useMutation(
    orpc.cms.updateAlumniNotable.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  const busy = create.isPending || update.isPending;
  const canSubmit =
    form.name.trim().length > 0 && form.category.trim().length > 0 && !busy;

  const payload = {
    category: form.category,
    imageId: form.imageId,
    name: form.name.trim(),
    role: blankOrNull(form.role),
  };

  return (
    <FormDialog
      busy={busy}
      description="Live on the Alumni page the moment it is saved — these are published by the College's office, so there is no review queue."
      error={mutationErrorText(
        editing ? update.error : create.error,
        "The distinguished alumnus could not be saved."
      )}
      onClose={onClose}
      onSubmit={() => {
        if (editing) {
          update.mutate({ id: editing.id, ...payload });
        } else {
          create.mutate(payload);
        }
      }}
      open={open}
      submitDisabled={!canSubmit}
      submitLabel={editing ? "Save changes" : "Publish"}
      title={
        editing ? "Edit distinguished alumnus" : "Add distinguished alumnus"
      }
    >
      <FieldGrid>
        <Field
          kind="text"
          label="Name"
          onChange={(next) => patch({ name: next })}
          value={form.name}
        />
        <Field
          kind="select"
          label="Category"
          onChange={(next) => {
            if (isAlumniNotableCategory(next)) {
              patch({ category: next });
            }
          }}
          options={CATEGORY_OPTIONS}
          value={form.category}
        />
        <Field
          hint='Shown above the name, e.g. "Alumni President".'
          kind="text"
          label="Role"
          onChange={(next) => patch({ role: next })}
          value={form.role}
        />
        <FileUploader
          clearable
          label="Photo"
          onChange={(next) => patch({ imageId: next, imagePreviewUrl: null })}
          onUpload={uploadImageFile}
          previewUrl={form.imagePreviewUrl}
          ratioKey="principalPortrait"
          value={form.imageId}
          wide
        />
      </FieldGrid>
    </FormDialog>
  );
};

const AlumniNotablesContent = () => {
  const queryClient = useQueryClient();
  const listQuery = orpc.cms.listAlumniNotables.queryOptions();
  const { data: notables } = useSuspenseQuery(listQuery);
  const [dialog, setDialog] = useState<{
    editing: EditingNotable | null;
    open: boolean;
    token: number;
  }>({ editing: null, open: false, token: 0 });
  const openToken = useRef(0);

  const remove = useMutation(
    orpc.cms.deleteAlumniNotable.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(listQuery),
    })
  );

  return (
    <>
      <ScreenHead
        eyebrow="Content"
        heading="Distinguished Alumni"
        note="The Hall of Fame on the Alumni page — any number of names per category, each with an optional role and photo."
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
              Add distinguished alumnus
            </CmsButton>
          }
          title="Distinguished Alumni"
        />
        {notables.length === 0 ? (
          <p>
            Nothing published yet. The Alumni page hides the Hall of Fame
            section until the first entry is added.
          </p>
        ) : (
          <RecordList label="Distinguished Alumni">
            {notables.map((notable) => (
              <RecordRow
                actions={
                  <>
                    <Pill tone="neutral">
                      {ALUMNI_NOTABLE_CATEGORY_LABELS[notable.category] ??
                        notable.category}
                    </Pill>
                    <CmsButton
                      onClick={() =>
                        setDialog({
                          editing: {
                            category: notable.category,
                            id: notable.id,
                            imageId: notable.imageId,
                            imagePreviewUrl: notable.imageUrl,
                            name: notable.name,
                            role: notable.role ?? "",
                          },
                          open: true,
                          token: (openToken.current += 1),
                        })
                      }
                      tone="quiet"
                    >
                      Edit
                    </CmsButton>
                    <CmsButton
                      disabled={remove.isPending}
                      onClick={() => remove.mutate({ id: notable.id })}
                      tone="danger"
                    >
                      Remove
                    </CmsButton>
                  </>
                }
                key={notable.id}
                meta={notable.role ?? undefined}
                name={notable.name}
              />
            ))}
          </RecordList>
        )}
      </Panel>
      <NotableDialog
        editing={dialog.editing}
        key={dialog.token}
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
        onSaved={() => queryClient.invalidateQueries(listQuery)}
        open={dialog.open}
      />
    </>
  );
};

export const Route = createFileRoute("/cms/alumni-notables")({
  head: () => ({
    meta: [
      { title: "Distinguished Alumni — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <ScreenWrap>
      <Suspense fallback={<div>Loading…</div>}>
        <AlumniNotablesContent />
      </Suspense>
    </ScreenWrap>
  ),
});
