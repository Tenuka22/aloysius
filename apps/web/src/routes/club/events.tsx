import {
  CmsButton,
  Field,
  FieldGrid,
  Notice,
  Panel,
  PanelHead,
} from "@aloysius/ui/components/cms/cms-primitives";
import {
  searchToPagination,
  searchToSorting,
} from "@aloysius/ui/components/data-table/list-search";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { SLUG_PATTERN, slugify } from "@/components/club/format";
import { ClubPage, FieldStack } from "@/components/club/page-parts";
import { submissionSearch } from "@/components/tables/queue-search";
import { SubmissionsTable } from "@/components/tables/submissions-table";
import { useTableCallbacks } from "@/components/tables/use-list-state";
import { orpc } from "@/utils/orpc";

/**
 * A club event.
 *
 * `startsAt` is a real datetime, not free text, because the public events strip
 * sorts by it and filters out anything in the past — a club event that cannot be
 * compared against a clock will silently never appear. The server rejects a
 * missing or unparseable one.
 */

const MAX_TITLE = 160;
const MAX_DESCRIPTION = 2000;

/** The submission-queue target this screen's rows are filtered to. */
const EVENT_TARGET = "clubEvent";

/** `datetime-local` gives `YYYY-MM-DDTHH:mm`; `new Date` needs it parseable. */
const parseLocal = (value: string) => {
  if (value.trim() === "") {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const EventsPage = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const submissions = submissionSearch.parse(Route.useSearch());
  const writeSubmissions = submissionSearch.write();
  const submissionsCallbacks = useTableCallbacks({
    search: submissions,
    writeSearch: writeSubmissions,
  });
  const submissionsQuery = useQuery(
    orpc.clubs.listMySubmissions.queryOptions({
      input: {
        ...submissionSearch.toListInput(submissions),
        target: EVENT_TARGET,
      },
      placeholderData: keepPreviousData,
    })
  );

  const parsedStart = parseLocal(startsAt);
  const parsedEnd = parseLocal(endsAt);
  const slug = slugify(title);

  const problems: string[] = [];
  if (title.trim().length === 0) {
    problems.push("Give the event a title.");
  } else if (title.length > MAX_TITLE) {
    problems.push(`The title is longer than ${MAX_TITLE} characters.`);
  } else if (!SLUG_PATTERN.test(slug)) {
    problems.push("That title has no letters or numbers in it.");
  }
  if (startsAt.trim() !== "" && !parsedStart) {
    problems.push("The start time could not be read.");
  }
  if (endsAt.trim() !== "" && !parsedEnd) {
    problems.push("The end time could not be read.");
  }
  if (parsedStart && parsedEnd && parsedEnd < parsedStart) {
    problems.push("The event ends before it starts.");
  }
  if (description.length > MAX_DESCRIPTION) {
    problems.push(
      `The description is longer than ${MAX_DESCRIPTION} characters.`
    );
  }

  const create = useMutation(
    orpc.clubs.submitClubEvent.mutationOptions({
      onSuccess: async () => {
        setTitle("");
        setDescription("");
        setLocation("");
        setStartsAt("");
        setEndsAt("");
        await queryClient.invalidateQueries({
          queryKey: orpc.clubs.listMySubmissions.key(),
        });
      },
    })
  );

  return (
    <ClubPage
      eyebrow="Club / Events"
      note="Tell the school about something your club is running or has run. A CMS editor reviews it before it appears in the events strip."
      title="Events"
    >
      <Panel accent>
        <PanelHead
          note="Past events drop off the website by themselves, so there is nothing to take down afterwards."
          title="Propose an event"
        />

        {create.isSuccess ? (
          <Notice tone="success">
            Sent for review. It will appear in the events strip once a CMS
            editor approves it.
          </Notice>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (problems.length > 0 || !parsedStart) {
              return;
            }
            create.reset();
            create.mutate({
              payload: {
                description: description.trim() || null,
                endsAt: parsedEnd ?? parsedStart,
                id: crypto.randomUUID(),
                location: location.trim() || null,
                slug,
                startsAt: parsedStart,
                title: title.trim(),
              },
            });
          }}
        >
          <FieldGrid>
            <Field
              hint={`What it is. ${title.length} of ${MAX_TITLE} characters.`}
              label="Title"
              onChange={setTitle}
              value={title}
              wide
            />
            <Field
              hint="Optional. Where it happens."
              label="Location"
              onChange={setLocation}
              value={location}
            />
            <Field
              hint="Required. The website compares this against the clock."
              kind="datetime"
              label="Starts"
              onChange={setStartsAt}
              value={startsAt}
            />
            <Field
              hint="Optional. Leave blank if you do not know yet."
              kind="datetime"
              label="Ends"
              onChange={setEndsAt}
              value={endsAt}
            />
            <Field
              hint="Optional. What happens, who to come, anything to bring."
              kind="textarea"
              label="Description"
              onChange={setDescription}
              value={description}
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
                : "The event could not be submitted."}
            </Notice>
          ) : null}

          <FieldStack>
            <CmsButton
              disabled={problems.length > 0 || create.isPending}
              tone="primary"
              type="submit"
            >
              {create.isPending ? "Sending…" : "Submit event"}
            </CmsButton>
          </FieldStack>
        </form>
      </Panel>

      <SubmissionsTable
        emptyNote="Anything you submit will appear here until a CMS editor has looked at it."
        emptyTitle="Nothing waiting for review."
        isError={submissionsQuery.isError}
        isFetching={submissionsQuery.isFetching}
        isLoading={submissionsQuery.isPending}
        onPaginationChange={submissionsCallbacks.onPaginationChange}
        onSearchChange={submissionsCallbacks.onSearchChange}
        onSortingChange={submissionsCallbacks.onSortingChange}
        pagination={searchToPagination(submissions)}
        rows={submissionsQuery.data?.rows ?? []}
        search={submissions.q}
        sorting={searchToSorting(submissions)}
        total={submissionsQuery.data?.total ?? 0}
      />
    </ClubPage>
  );
};

export const Route = createFileRoute("/club/events")({
  validateSearch: (search: Record<string, unknown>) =>
    submissionSearch.routeSearch(search),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      orpc.clubs.listMySubmissions.queryOptions({
        input: {
          ...submissionSearch.toListInput(submissionSearch.parse(deps)),
          target: EVENT_TARGET,
        },
      })
    ),
  head: () => ({
    meta: [
      { title: "Events — Club portal — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EventsPage,
});
