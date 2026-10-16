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
 * `/cms/sport-tiles` - the "On the Field" sports mosaic on `/students`.
 *
 * Replaces `SPORT_TILES`, a fixed three-row array (Cricket, Rugby,
 * Athletics) that could hold exactly those three sports, each with its photo
 * pinned to its own `students-sports-*` block field. This is a roster
 * instead: any number of sports, each with its own photo and `sortOrder`.
 *
 * No `span` control here: the mosaic's hero tile is always whichever
 * published row sorts first, and the public page derives that tile's larger
 * footprint from its position rather than from a per-row choice - see
 * `apps/web/src/routes/students.tsx`. Offering "feature vs half vs third"
 * here would expose that layout detail to an editor who should only ever
 * need to say what order the sports come in.
 */

interface TileFormState {
  name: string;
  sortOrder: string;
  imageId: string | null;
  imagePreviewUrl: string | null;
}

const EMPTY_TILE: TileFormState = {
  name: "",
  sortOrder: "0",
  imageId: null,
  imagePreviewUrl: null,
};

/** A row being edited, with the id the mutation needs. */
interface EditingTile extends TileFormState {
  id: string;
}

interface TileDialogProps {
  editing: EditingTile | null;
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
}

const TileDialog = ({ editing, onClose, onSaved, open }: TileDialogProps) => {
  const [form, patch] = useReducer(
    (state: TileFormState, statePatch: Partial<TileFormState>) => ({
      ...state,
      ...statePatch,
    }),
    editing ?? EMPTY_TILE
  );

  const create = useMutation(
    orpc.cms.createSportTile.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );
  const update = useMutation(
    orpc.cms.updateSportTile.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  const busy = create.isPending || update.isPending;
  const canSubmit = form.name.trim().length > 0 && !busy;

  const payload = {
    name: form.name.trim(),
    sortOrder: Math.trunc(Number(form.sortOrder)) || 0,
    imageId: form.imageId,
  };

  return (
    <FormDialog
      busy={busy}
      description="Live on the Student Life page the moment it is saved — published by the College's own office, so there is no review queue."
      error={mutationErrorText(
        editing ? update.error : create.error,
        "The sport could not be saved."
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
      title={editing ? "Edit sport" : "Add sport"}
    >
      <FieldGrid>
        <Field
          kind="text"
          label="Name"
          onChange={(next) => patch({ name: next })}
          value={form.name}
        />
        <Field
          hint="Lower numbers come first; the first published sport becomes the mosaic's hero tile."
          kind="text"
          label="Order"
          onChange={(next) => patch({ sortOrder: next })}
          value={form.sortOrder}
        />
        <FileUploader
          clearable
          label="Photo"
          onChange={(next) => patch({ imageId: next, imagePreviewUrl: null })}
          onUpload={uploadImageFile}
          previewUrl={form.imagePreviewUrl}
          ratioKey="mosaicTile"
          value={form.imageId}
          wide
        />
      </FieldGrid>
    </FormDialog>
  );
};

const SportTilesContent = () => {
  const queryClient = useQueryClient();
  const listQuery = orpc.cms.listSportTiles.queryOptions();
  const { data: tiles } = useSuspenseQuery(listQuery);
  const [dialog, setDialog] = useState<{
    editing: EditingTile | null;
    open: boolean;
    token: number;
  }>({ editing: null, open: false, token: 0 });
  const openToken = useRef(0);

  const remove = useMutation(
    orpc.cms.deleteSportTile.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(listQuery),
    })
  );

  return (
    <>
      <ScreenHead
        eyebrow="Content"
        heading="Sport Tiles"
        note="The sports shown in the 'On the Field' mosaic on the Student Life page, in display order."
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
              Add sport
            </CmsButton>
          }
          title="Sports"
        />
        {tiles.length === 0 ? (
          <p>
            Nothing published yet. The Student Life page shows no sports mosaic
            until the first sport is added.
          </p>
        ) : (
          <RecordList label="Sport tiles">
            {tiles.map((tile) => (
              <RecordRow
                actions={
                  <>
                    <CmsButton
                      onClick={() =>
                        setDialog({
                          editing: {
                            id: tile.id,
                            imageId: null,
                            imagePreviewUrl: tile.imageUrl,
                            name: tile.name,
                            sortOrder: String(tile.sortOrder),
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
                      onClick={() => remove.mutate({ id: tile.id })}
                      tone="danger"
                    >
                      Remove
                    </CmsButton>
                  </>
                }
                key={tile.id}
                meta={`Order ${tile.sortOrder}`}
                name={tile.name}
              />
            ))}
          </RecordList>
        )}
      </Panel>
      <TileDialog
        editing={dialog.editing}
        key={dialog.token}
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
        onSaved={() => queryClient.invalidateQueries(listQuery)}
        open={dialog.open}
      />
    </>
  );
};

export const Route = createFileRoute("/cms/sport-tiles")({
  head: () => ({
    meta: [
      { title: "Sport Tiles — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <ScreenWrap>
      <Suspense fallback={<div>Loading…</div>}>
        <SportTilesContent />
      </Suspense>
    </ScreenWrap>
  ),
});
