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

import { mutationErrorText } from "@/components/mutation-error";
import { orpc } from "@/utils/orpc";

/**
 * `/cms/media-links` - the "Magazines & Reports" and "In the Press" tabs on
 * `/media`. Replaces `MEDIA_PUBLICATIONS`/`MEDIA_PRESS`, two constants in
 * `packages/ui/src/content/media.ts` that were always `[]`: there was no
 * admin path to a row, ever.
 *
 * No file upload here: `FileUploader` (`packages/ui/src/components/cms/file-
 * uploader.tsx`) only accepts images - it feeds a crop dialog that assumes
 * every file it is handed can be cropped to a declared aspect ratio, and a
 * magazine PDF or a press article cannot be. Building PDF upload plumbing is
 * out of scope here, so `href` is a plain URL field: an uploaded PDF already
 * hosted elsewhere, or an outlet's own article link. The API's `fileId`
 * column stays reachable for a future PDF-upload path without a schema
 * change, but this screen only ever writes `href`.
 */

const KIND_OPTIONS: { label: string; value: "publication" | "press" }[] = [
  { label: "Publication", value: "publication" },
  { label: "Press", value: "press" },
];

interface MediaLinkFormState {
  kind: "publication" | "press";
  title: string;
  meta: string;
  href: string;
  sortOrder: string;
}

const EMPTY_MEDIA_LINK: MediaLinkFormState = {
  kind: "publication",
  title: "",
  meta: "",
  href: "",
  sortOrder: "0",
};

/** A row being edited, with the id the mutation needs. */
interface EditingMediaLink extends MediaLinkFormState {
  id: string;
}

interface MediaLinkDialogProps {
  editing: EditingMediaLink | null;
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
}

const MediaLinkDialog = ({
  editing,
  onClose,
  onSaved,
  open,
}: MediaLinkDialogProps) => {
  const [form, patch] = useReducer(
    (
      state: MediaLinkFormState,
      statePatch: Partial<MediaLinkFormState>
    ): MediaLinkFormState => ({
      ...state,
      ...statePatch,
    }),
    editing ?? EMPTY_MEDIA_LINK
  );

  const create = useMutation(
    orpc.cms.createMediaLink.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );
  const update = useMutation(
    orpc.cms.updateMediaLink.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  const busy = create.isPending || update.isPending;
  const canSubmit =
    form.title.trim().length > 0 && form.href.trim().length > 0 && !busy;

  const payload = {
    href: form.href.trim(),
    kind: form.kind,
    meta: form.meta.trim() || null,
    sortOrder: Math.trunc(Number(form.sortOrder)) || 0,
    title: form.title.trim(),
  };

  return (
    <FormDialog
      busy={busy}
      description="Live on /media's Publications/Press tabs the moment it is saved — these are published by the College's office, so there is no review queue."
      error={mutationErrorText(
        editing ? update.error : create.error,
        "The link could not be saved."
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
      title={editing ? "Edit link" : "Add link"}
    >
      <FieldGrid>
        <Field
          kind="select"
          label="Tab"
          onChange={(next) => patch({ kind: next as "publication" | "press" })}
          options={KIND_OPTIONS}
          value={form.kind}
        />
        <Field
          hint='e.g. "Annual magazine - 2025" or the outlet and date.'
          kind="text"
          label="Meta"
          onChange={(next) => patch({ meta: next })}
          value={form.meta}
        />
        <Field
          kind="text"
          label="Title"
          onChange={(next) => patch({ title: next })}
          value={form.title}
          wide
        />
        <Field
          hint="A PDF, a page, or an article URL."
          kind="url"
          label="Link"
          onChange={(next) => patch({ href: next })}
          value={form.href}
          wide
        />
        <Field
          kind="text"
          label="Order"
          onChange={(next) => patch({ sortOrder: next })}
          value={form.sortOrder}
        />
      </FieldGrid>
    </FormDialog>
  );
};

const MediaLinksContent = () => {
  const queryClient = useQueryClient();
  const listQuery = orpc.cms.listMediaLinks.queryOptions();
  const { data: mediaLinks } = useSuspenseQuery(listQuery);
  const [dialog, setDialog] = useState<{
    editing: EditingMediaLink | null;
    open: boolean;
    token: number;
  }>({ editing: null, open: false, token: 0 });
  const openToken = useRef(0);

  const remove = useMutation(
    orpc.cms.deleteMediaLink.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(listQuery),
    })
  );

  return (
    <>
      <ScreenHead
        eyebrow="Content"
        heading="Media Links"
        note="Magazines, reports and press coverage shown on /media's Publications and Press tabs."
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
              Add link
            </CmsButton>
          }
          title="Links"
        />
        {mediaLinks.length === 0 ? (
          <p>
            Nothing published yet. Both /media tabs show their empty state until
            the first link is added.
          </p>
        ) : (
          <RecordList label="Links">
            {mediaLinks.map((link) => (
              <RecordRow
                actions={
                  <>
                    <Pill tone="neutral">
                      {link.kind === "publication" ? "Publication" : "Press"}
                    </Pill>
                    <CmsButton
                      onClick={() =>
                        setDialog({
                          editing: {
                            href: link.href,
                            id: link.id,
                            kind: link.kind as "publication" | "press",
                            meta: link.meta ?? "",
                            sortOrder: String(link.sortOrder),
                            title: link.title,
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
                      onClick={() => remove.mutate({ id: link.id })}
                      tone="danger"
                    >
                      Remove
                    </CmsButton>
                  </>
                }
                key={link.id}
                meta={link.meta ?? link.href}
                name={link.title}
              />
            ))}
          </RecordList>
        )}
      </Panel>
      <MediaLinkDialog
        editing={dialog.editing}
        key={dialog.token}
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
        onSaved={() => queryClient.invalidateQueries(listQuery)}
        open={dialog.open}
      />
    </>
  );
};

export const Route = createFileRoute("/cms/media-links")({
  head: () => ({
    meta: [
      { title: "Media Links — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <ScreenWrap>
      <Suspense fallback={<div>Loading…</div>}>
        <MediaLinksContent />
      </Suspense>
    </ScreenWrap>
  ),
});
