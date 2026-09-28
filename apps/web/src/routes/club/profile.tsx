import {
  CmsButton,
  Field,
  Notice,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { CoverImagePicker } from "@/components/club/cover-image-picker";
import type { CoverImageSelection } from "@/components/club/cover-image-picker";
import {
  ClubPage,
  ClubPageLoading,
  FieldStack,
} from "@/components/club/page-parts";
import { orpc } from "@/utils/orpc";

/**
 * The club's own front page: its description and its cover banner.
 *
 * Two images, and the difference between them is worth being precise about. The
 * **cover** is the wide banner shown across the top of the club's section on the
 * public site. The **background** sits behind the whole section. Both are
 * presentation only - neither is a gallery, neither appears in the gallery
 * listing, and neither is the club's photographic output. A club that has no
 * photographs at all still has a banner, because the banner is about the club
 * being recognisable, not about it having something to show.
 *
 * The club's name and web address are deliberately not editable here. The set of
 * clubs is a hardcoded registry on the server, and the slug is referenced by
 * approved content; changing either from a club portal would break links that a
 * reviewer approved. The screen says so rather than omitting the fields and
 * letting someone wonder.
 */

const MAX_DESCRIPTION = 2000;

/** What the club looks like on the site right now. */
interface ClubProfile {
  name: string;
  status: string;
  description: string | null;
  coverImageUrl: string | null;
  backgroundImageUrl: string | null;
}

/** Only the fields the club actually changed. See `clubUpdatePayloadSchema`. */
interface ProfilePayload {
  description?: string | null;
  coverImageId?: string | null;
  backgroundImageId?: string | null;
}

const LiveProfilePanel = ({ club }: { club: ClubProfile }) => (
  <Panel>
    <PanelHead
      eyebrow="Live now"
      note="What the website is currently showing for your club."
      title="Your club as visitors see it"
    />
    <RecordList label="Current club profile">
      <RecordRow
        actions={
          club.status === "active" ? (
            <Pill tone="positive">Active</Pill>
          ) : (
            <Pill tone="neutral">{club.status}</Pill>
          )
        }
        meta={
          <span>
            The name and web address are set by the school, so they are not
            editable here.
          </span>
        }
        name={club.name}
      />
      <RecordRow
        actions={
          club.coverImageUrl ? (
            <Pill tone="positive">Set</Pill>
          ) : (
            <Pill tone="warning">None</Pill>
          )
        }
        meta={
          <span>
            {club.coverImageUrl
              ? "Shown across the top of your club on the students page."
              : "Your club has no banner yet. Add one below."}
          </span>
        }
        name="Cover banner"
      />
      <RecordRow
        actions={
          club.backgroundImageUrl ? (
            <Pill tone="positive">Set</Pill>
          ) : (
            <Pill tone="neutral">None</Pill>
          )
        }
        meta={
          <span>
            {club.backgroundImageUrl
              ? "Shown behind the whole club section."
              : "Optional. Without one the section uses the plain background."}
          </span>
        }
        name="Section background"
      />
    </RecordList>
  </Panel>
);

/**
 * The edit form, as its own component.
 *
 * Split out so that every hook here is called unconditionally. Inlining it below
 * the loading and error early-returns would put `useMutation` after them, and
 * React would then run a different number of hooks on the pending render than on
 * the loaded one - which does not throw a useful error, it just corrupts the
 * hook order for the rest of the tree.
 */
const ProfileForm = ({ club }: { club: ClubProfile }) => {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState<string | null>(null);
  const [cover, setCover] = useState<CoverImageSelection | null>(null);
  const [background, setBackground] = useState<CoverImageSelection | null>(
    null
  );

  const submit = useMutation(
    orpc.clubs.submitClubProfileUpdate.mutationOptions({
      onSuccess: async () => {
        setDescription(null);
        setCover(null);
        setBackground(null);
        await queryClient.invalidateQueries({
          queryKey: orpc.clubs.myClub.key(),
        });
        await queryClient.invalidateQueries({
          queryKey: orpc.clubs.listMySubmissions.key(),
        });
      },
    })
  );

  const shownDescription = description ?? club.description ?? "";
  const descriptionTooLong = shownDescription.length > MAX_DESCRIPTION;

  /*
   * The payload distinguishes three states per field and this form has to as
   * well: absent means "don't touch it", an explicit null means "take it down",
   * and a file id means "use this instead". Sending an untouched field as null
   * would silently remove a banner the club never asked to lose - which is why
   * only fields that actually changed are included at all.
   */
  const payload: ProfilePayload = {};

  if (description !== null && shownDescription !== (club.description ?? "")) {
    payload.description = shownDescription.trim() || null;
  }
  if (cover) {
    payload.coverImageId = cover.fileId;
  }
  if (background) {
    payload.backgroundImageId = background.fileId;
  }

  const changed = Object.keys(payload).length > 0;
  const canSubmit = changed && !descriptionTooLong;

  return (
    <Panel accent>
      <PanelHead
        note="Send only what you have changed. Each change is sent to a CMS editor on its own, and only lands once it is approved."
        title="Change how your club looks"
      />

      {submit.isSuccess ? (
        <Notice tone="success">
          Sent for review. Your banner and description change once a CMS editor
          approves it.
        </Notice>
      ) : null}

      {changed ? null : (
        <Notice tone="info">
          Nothing has changed yet. Pick a new banner, remove the current one, or
          edit the description.
        </Notice>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) {
            return;
          }
          submit.reset();
          submit.mutate({ payload });
        }}
      >
        <FieldStack>
          <Field
            hint={`What your club does. ${shownDescription.length} of ${MAX_DESCRIPTION} characters.`}
            kind="textarea"
            label="Description"
            onChange={setDescription}
            value={shownDescription}
            wide
          />

          <CoverImagePicker
            currentUrl={club.coverImageUrl}
            label="Cover banner"
            onSelect={setCover}
            selected={cover}
          />

          <CoverImagePicker
            currentUrl={club.backgroundImageUrl}
            label="Section background"
            onSelect={setBackground}
            selected={background}
          />

          {descriptionTooLong ? (
            <Notice tone="warning">
              That description is longer than {MAX_DESCRIPTION} characters.
            </Notice>
          ) : null}

          {submit.error ? (
            <Notice tone="danger">
              {submit.error instanceof Error
                ? submit.error.message
                : "The change could not be submitted."}
            </Notice>
          ) : null}

          <div>
            <CmsButton
              disabled={!canSubmit || submit.isPending}
              tone="primary"
              type="submit"
            >
              {submit.isPending ? "Sending…" : "Send for review"}
            </CmsButton>
          </div>
        </FieldStack>
      </form>
    </Panel>
  );
};

const ClubProfilePage = () => {
  const clubQuery = useQuery(orpc.clubs.myClub.queryOptions());
  const club = clubQuery.data;

  if (clubQuery.isPending) {
    return (
      <ClubPage
        eyebrow="Club / Profile"
        note="Loading your club…"
        title="Club profile"
      >
        <ClubPageLoading what="your club" />
      </ClubPage>
    );
  }

  if (clubQuery.error || !club) {
    return (
      <ClubPage
        eyebrow="Club / Profile"
        note="Your club could not be loaded."
        title="Club profile"
      >
        <Panel>
          <Notice tone="danger">
            Your club could not be loaded. Reload the page to try again.
          </Notice>
        </Panel>
      </ClubPage>
    );
  }

  return (
    <ClubPage
      eyebrow="Club / Profile"
      note="How your club introduces itself on the website, and the banner visitors see first. A CMS editor reviews changes before they go live."
      title="Club profile"
    >
      <LiveProfilePanel club={club} />
      <ProfileForm club={club} />
    </ClubPage>
  );
};

export const Route = createFileRoute("/club/profile")({
  head: () => ({
    meta: [
      { title: "Club profile — Club portal — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ClubProfilePage,
});
