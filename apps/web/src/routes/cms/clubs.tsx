import { CLUB_ROLE_LABEL, CLUB_ROLES } from "@aloysius/db/schema/clubs";
import {
  CmsButton,
  Field,
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
import { useReducer, useRef, useState } from "react";

import { mutationErrorText } from "@/components/mutation-error";
import { orpc } from "@/utils/orpc";

const ROLE_OPTIONS = CLUB_ROLES.map((role) => ({
  label: CLUB_ROLE_LABEL[role],
  value: role,
}));

type ClubRole = (typeof CLUB_ROLES)[number];

interface ClubRow {
  id: string;
  slug: string;
  name: string;
  role: ClubRole;
  description: string | null;
  isPrimary: boolean;
  inUse: boolean;
  galleries: number;
  events: number;
  announcements: number;
  newsPosts: number;
}

const CONTENT_LABEL: Record<
  keyof Pick<ClubRow, "galleries" | "events" | "announcements" | "newsPosts">,
  string
> = {
  galleries: "galleries",
  events: "events",
  announcements: "announcements",
  newsPosts: "news posts",
};

const contentSummary = (club: ClubRow): string => {
  const parts = (["galleries", "events", "announcements", "newsPosts"] as const)
    .filter((key) => club[key] > 0)
    .map((key) => `${club[key]} ${CONTENT_LABEL[key]}`);

  return parts.length > 0 ? parts.join(" · ") : "No content yet";
};

/** Turn a name into a slug the same way the API would accept one. */
const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/(?<edgeDash>^-|-$)/gu, "");

interface ClubFormState {
  name: string;
  slug: string;
  role: ClubRole;
  description: string;
  /** The slug the record was loaded with, so "changed" can be judged against it. */
  originalSlug: string;
  slugLocked: boolean;
}

const EMPTY_FORM: ClubFormState = {
  name: "",
  slug: "",
  role: "society",
  description: "",
  originalSlug: "",
  slugLocked: false,
};

const formFromRow = (row: ClubRow | null): ClubFormState =>
  row
    ? {
        name: row.name,
        slug: row.slug,
        role: row.role,
        description: row.description ?? "",
        originalSlug: row.slug,
        slugLocked: row.inUse,
      }
    : EMPTY_FORM;

interface ClubFormAction {
  patch: Partial<ClubFormState>;
}

const formReducer = (
  state: ClubFormState,
  action: ClubFormAction
): ClubFormState => ({ ...state, ...action.patch });

const ClubDialog = ({
  editing,
  onClose,
  onSaved,
  open,
}: {
  open: boolean;
  editing: ClubRow | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, dispatch] = useReducer(formReducer, editing, formFromRow);
  const patch = (next: Partial<ClubFormState>) => dispatch({ patch: next });

  const createMutation = useMutation(
    orpc.cms.createClub.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );
  const updateMutation = useMutation(
    orpc.cms.updateClub.mutationOptions({
      onSuccess: () => {
        onSaved();
        onClose();
      },
    })
  );

  const mutation = editing ? updateMutation : createMutation;
  const busy = mutation.isPending;

  const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(form.slug);
  const canSubmit = form.name.trim().length > 0 && slugValid && !busy;

  // Typing a new name offers the matching slug, until the editor edits the slug
  // themselves - after that their value wins and is never overwritten again.
  const handleNameChange = (next: string) => {
    const slugWasDerived = form.slug === slugify(form.name);
    patch({
      name: next,
      ...(slugWasDerived && !form.slugLocked ? { slug: slugify(next) } : {}),
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: form.slug,
      role: form.role,
      description: form.description.trim() || null,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const SLUG_HINT_INVALID = "Lowercase words separated by single hyphens.";
  const SLUG_HINT_VALID =
    "Used as the key on galleries, events and news posts.";
  const SLUG_HINT_LOCKED =
    "Locked: this club already has content attributed to it, and changing the slug would orphan that content.";

  const getSlugHint = (locked: boolean, valid: boolean) => {
    if (locked) {
      return SLUG_HINT_LOCKED;
    }
    return valid ? SLUG_HINT_VALID : SLUG_HINT_INVALID;
  };

  const slugHint = getSlugHint(form.slugLocked, slugValid);

  return (
    <FormDialog
      busy={busy}
      description="A club can be attributed on galleries, events, announcements and news posts. Its slug is the key those records join on."
      error={mutationErrorText(mutation.error, "The club could not be saved.")}
      onClose={onClose}
      onSubmit={handleSubmit}
      open={open}
      submitDisabled={!canSubmit}
      submitLabel={editing ? "Save changes" : "Create club"}
      title={editing ? "Edit club" : "New club"}
    >
      <Field
        kind="text"
        label="Name"
        onChange={handleNameChange}
        value={form.name}
      />
      <Field
        hint={slugHint}
        kind={form.slugLocked ? "readonly" : "text"}
        label="Slug"
        onChange={(next) => patch({ slug: next })}
        value={form.slug}
      />
      <Field
        kind="select"
        label="Role"
        onChange={(next) => patch({ role: next as ClubRole })}
        options={ROLE_OPTIONS}
        value={form.role}
      />
      <Field
        hint="Optional. Shown on the club's own page once one exists."
        kind="textarea"
        label="Description (optional)"
        onChange={(next) => patch({ description: next })}
        value={form.description}
      />
    </FormDialog>
  );
};

const ClubsContent = () => {
  const queryClient = useQueryClient();
  const listQuery = orpc.cms.listClubs.queryOptions();
  const { data: clubs } = useSuspenseQuery(listQuery);
  const [dialog, setDialog] = useState<{
    open: boolean;
    editing: ClubRow | null;
    token: number;
  }>({ editing: null, open: false, token: 0 });
  const openToken = useRef(0);

  const invalidate = () => queryClient.invalidateQueries(listQuery);
  const deleteMutation = useMutation(
    orpc.cms.deleteClub.mutationOptions({ onSuccess: invalidate })
  );

  const openNew = () =>
    setDialog({
      editing: null,
      open: true,
      token: (openToken.current += 1),
    });

  return (
    <ScreenWrap>
      <ScreenHead
        eyebrow="Organisation"
        heading="Clubs"
        note="Every club and society. Adding one here makes it selectable when attributing a gallery, event, announcement or news post."
      />
      <Panel>
        <PanelHead
          action={
            <CmsButton onClick={openNew} tone="primary">
              Add club
            </CmsButton>
          }
          title="Clubs"
        />
        {clubs.length === 0 ? (
          <p>No clubs yet. Add the first one.</p>
        ) : (
          <RecordList label="Clubs">
            {clubs.map((club) => (
              <RecordRow
                actions={
                  <>
                    <Pill tone="neutral">
                      {CLUB_ROLE_LABEL[club.role as ClubRole]}
                    </Pill>
                    {club.isPrimary ? (
                      <Pill tone="warning">Submission seat</Pill>
                    ) : null}
                    <CmsButton
                      onClick={() =>
                        setDialog({
                          editing: club,
                          open: true,
                          token: (openToken.current += 1),
                        })
                      }
                      tone="quiet"
                    >
                      Edit
                    </CmsButton>
                    <CmsButton
                      disabled={
                        deleteMutation.isPending || club.isPrimary || club.inUse
                      }
                      onClick={() => deleteMutation.mutate({ id: club.id })}
                      tone="danger"
                    >
                      Delete
                    </CmsButton>
                  </>
                }
                key={club.id}
                meta={`/${club.slug} · ${contentSummary(club as ClubRow)}`}
                name={club.name}
              />
            ))}
          </RecordList>
        )}
      </Panel>

      {deleteMutation.error ? (
        <p>
          {mutationErrorText(
            deleteMutation.error,
            "The club could not be deleted."
          )}
        </p>
      ) : null}

      <ClubDialog
        editing={dialog.editing}
        key={dialog.token}
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
        onSaved={invalidate}
        open={dialog.open}
      />
    </ScreenWrap>
  );
};

export const Route = createFileRoute("/cms/clubs")({
  head: () => ({
    meta: [
      { title: "Clubs — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ClubsContent,
});

export type { PillTone } from "@aloysius/ui/components/cms/cms-primitives";
