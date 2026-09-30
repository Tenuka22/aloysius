import {
  CmsButton,
  Field,
  FieldGrid,
  Notice,
  Panel,
  PanelHead,
} from "@aloysius/ui/components/cms/cms-primitives";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ClubPage, FieldStack } from "@/components/club/page-parts";
import { PendingList } from "@/components/club/pending-list";
import { orpc } from "@/utils/orpc";

/**
 * A notice from the club.
 *
 * Rendered on the site's notice strip alongside school-wide announcements, and
 * tagged as club-scoped so a visitor can tell whose words they are reading.
 * That distinction is the reason a club announcement is its own row rather than
 * an edit of the global one: the club chooses its own wording, and the school
 * keeps its own.
 */

const MAX_TITLE = 160;
const MAX_BODY = 5000;

const AnnouncementsPage = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const problems: string[] = [];
  if (title.trim().length === 0) {
    problems.push("Give the notice a title.");
  } else if (title.length > MAX_TITLE) {
    problems.push(`The title is longer than ${MAX_TITLE} characters.`);
  }
  if (body.trim().length === 0) {
    problems.push("Write the notice itself — the title alone is not enough.");
  } else if (body.length > MAX_BODY) {
    problems.push(`The notice is longer than ${MAX_BODY} characters.`);
  }

  const create = useMutation(
    orpc.clubs.submitClubAnnouncement.mutationOptions({
      onSuccess: async () => {
        setTitle("");
        setBody("");
        await queryClient.invalidateQueries({
          queryKey: orpc.clubs.listMySubmissions.key(),
        });
      },
    })
  );

  return (
    <ClubPage
      eyebrow="Club / Announcements"
      note="Put a notice on the site's notice strip. A CMS editor reviews it before it appears, and visitors will see it is from your club rather than from the school."
      title="Announcements"
    >
      <Panel accent>
        <PanelHead
          note="Your club's own wording. The school's notices are written by CMS editors and are not editable from here."
          title="Write a notice"
        />

        {create.isSuccess ? (
          <Notice tone="success">
            Sent for review. It will appear on the notice strip once a CMS
            editor approves it.
          </Notice>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            create.reset();
            create.mutate({
              payload: {
                body: body.trim(),
                id: crypto.randomUUID(),
                title: title.trim(),
              },
            });
          }}
        >
          <FieldGrid>
            <Field
              hint={`${title.length} of ${MAX_TITLE} characters.`}
              label="Title"
              onChange={setTitle}
              value={title}
              wide
            />
            <Field
              hint="The notice itself."
              kind="textarea"
              label="Notice"
              onChange={setBody}
              value={body}
              wide
            />
          </FieldGrid>

          {problems.length > 0 ? (
            <Notice tone="warning">
              <ul>
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </Notice>
          ) : null}

          {create.error ? (
            <Notice tone="danger">
              {create.error instanceof Error
                ? create.error.message
                : "The notice could not be submitted."}
            </Notice>
          ) : null}

          <FieldStack>
            <CmsButton
              disabled={problems.length > 0 || create.isPending}
              tone="primary"
              type="submit"
            >
              {create.isPending ? "Sending…" : "Submit notice"}
            </CmsButton>
          </FieldStack>
        </form>
      </Panel>

      <Panel>
        <PanelHead
          eyebrow="Queue"
          note="Notices you have sent that have not been approved or rejected yet."
          title="Awaiting review"
        />
        <PendingList target="clubAnnouncement" />
      </Panel>
    </ClubPage>
  );
};

export const Route = createFileRoute("/club-admin/photography/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — Club portal — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AnnouncementsPage,
});
