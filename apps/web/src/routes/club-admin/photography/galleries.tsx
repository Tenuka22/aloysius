import {
  CmsButton,
  Field,
  Notice,
  Panel,
  PanelHead,
} from "@aloysius/ui/components/cms/cms-primitives";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, Outlet, useMatch } from "@tanstack/react-router";
import { useState } from "react";

import { SLUG_PATTERN, slugify } from "@/components/club/format";
import { GalleriesTable } from "@/components/club/galleries-table";
import { ClubPage, FieldStack } from "@/components/club/page-parts";
import { gallerySearch } from "@/components/tables/queue-search";
import { useTableCallbacks } from "@/components/tables/use-list-state";
import { orpc } from "@/utils/orpc";

/**
 * The club's galleries, and the form that starts a new one.
 *
 * Creating a gallery is a two-field form rather than a wizard, because the only
 * thing the server needs to accept one is a slug and a title - images arrive
 * afterwards on the gallery's own screen, where they can be captioned, given a
 * role, and given a cover. A wizard would ask for images before the thing they
 * belong to exists, and every abandoned step would leave an orphaned upload
 * behind.
 *
 * The list is a table whose search, order and page are the URL and whose page
 * the loader fetched, so a refresh, a shared link and the Back button all arrive
 * on the same page of galleries. Two of its columns are the two things most
 * likely to be missing on a gallery that looks otherwise finished - its cover
 * and what it is about - and both are only fixable on the gallery's own screen,
 * so a "No cover" pill here is a to-do, not a description.
 *
 * Like `admin/clubs`, this route is the *parent* of `galleries.$galleryId`, so
 * it yields to `<Outlet />` whenever the child has matched: one screen in the
 * viewport, not a list painted over a gallery.
 */

const MAX_SUMMARY = 500;

const NewGalleryPanel = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");

  const slug = slugify(title);
  const slugValid = SLUG_PATTERN.test(slug);
  const summaryTooLong = summary.trim().length > MAX_SUMMARY;
  const canSubmit = title.trim().length > 0 && slugValid && !summaryTooLong;

  const create = useMutation(
    orpc.clubs.submitGalleryCreate.mutationOptions({
      onSuccess: async () => {
        setTitle("");
        setSummary("");
        await queryClient.invalidateQueries({
          queryKey: orpc.clubs.listMyGalleries.key(),
        });
      },
    })
  );

  return (
    <Panel accent>
      <PanelHead
        note="A gallery is a set of photographs. Once it is approved you can add up to five images at a time, and link an album you host elsewhere."
        title="New gallery"
      />

      {create.isSuccess ? (
        <Notice tone="success">
          Your gallery is with a CMS editor. Add its images once it has been
          approved.
        </Notice>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          create.reset();
          create.mutate({
            payload: {
              id: crypto.randomUUID(),
              kind: "photo",
              slug,
              summary: summary.trim() || null,
              // Every kind needs its detail row; a photo gallery's is all
              // optional, so an empty object is the whole thing.
              photo: {},
              title: title.trim(),
            },
          });
        }}
      >
        <FieldStack>
          <Field
            hint={
              title.trim().length === 0
                ? "Give the gallery a title to set its address."
                : `Address: /clubs/${slug}`
            }
            label="Title"
            onChange={setTitle}
            value={title}
            wide
          />
          <Field
            hint={
              summaryTooLong
                ? `That is longer than ${MAX_SUMMARY} characters.`
                : "One or two sentences. This is what a visitor reads under the title."
            }
            kind="textarea"
            label="Summary"
            onChange={setSummary}
            value={summary}
            wide
          />
          {!slugValid && title.trim().length > 0 ? (
            <Notice tone="warning">
              That title has no letters or numbers in it, so it cannot make a
              web address. Try one with a word in it.
            </Notice>
          ) : null}
          {create.error ? (
            <Notice tone="danger">
              {create.error instanceof Error
                ? create.error.message
                : "The gallery could not be submitted."}
            </Notice>
          ) : null}
          <div>
            <CmsButton
              disabled={!canSubmit || create.isPending}
              tone="primary"
              type="submit"
            >
              {create.isPending ? "Sending…" : "Submit gallery"}
            </CmsButton>
          </div>
        </FieldStack>
      </form>
    </Panel>
  );
};

const GalleriesPage = () => {
  /*
   * The list's five params are the URL, and the same parser reads them here, in
   * the route's `validateSearch` and in the loader — so a hand-typed URL and a
   * link written by this page ask the server for the same page of rows.
   */
  const search = gallerySearch.parse(Route.useSearch());
  const writeSearch = gallerySearch.write();
  const { onSearchChange, onSortingChange, onPaginationChange } =
    useTableCallbacks({ search, writeSearch });

  const query = useQuery(
    orpc.clubs.listMyGalleries.queryOptions({
      input: gallerySearch.toListInput(search),
      placeholderData: keepPreviousData,
    })
  );

  /*
   * `galleries.$galleryId` is a child of this route, so a gallery's own screen
   * draws only where the child slot is drawn. Without yielding here the table
   * would paint over it and the gallery would never be reachable from its own
   * URL — so the child owns the viewport for as long as its URL is open, and
   * this list returns untouched when the URL leaves it. Every hook above still
   * runs either way, so the order is identical whether the child is open or not.
   */
  const isGalleryDetail = Boolean(
    useMatch({
      from: "/club-admin/photography/galleries/$galleryId",
      shouldThrow: false,
    })
  );

  if (isGalleryDetail) {
    return <Outlet />;
  }

  return (
    <ClubPage
      eyebrow="Club / Galleries"
      note="Each gallery is a set of photographs with a cover and, usually, something it is about. Open one to add images, choose its cover, and link it to an event or achievement. Everything is reviewed before it appears on the website."
      title="Galleries"
    >
      <GalleriesTable
        isError={query.isError}
        isFetching={query.isFetching}
        isLoading={query.isPending}
        onPaginationChange={onPaginationChange}
        onSearchChange={onSearchChange}
        onSortingChange={onSortingChange}
        rows={query.data?.rows ?? []}
        search={search}
        total={query.data?.total ?? 0}
      />

      <NewGalleryPanel />
    </ClubPage>
  );
};

export const Route = createFileRoute("/club-admin/photography/galleries")({
  /*
   * The route's own validated type — every default omitted — re-parsed before it
   * becomes a server input. Same parser, idempotent, and the one place that
   * guarantees a bare URL and a hand-typed one cannot ask the server for two
   * different pages.
   */
  validateSearch: (search: Record<string, unknown>) =>
    gallerySearch.routeSearch(search),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      orpc.clubs.listMyGalleries.queryOptions({
        input: gallerySearch.toListInput(gallerySearch.parse(deps)),
      })
    ),
  head: () => ({
    meta: [
      { title: "Galleries — Club portal — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: GalleriesPage,
});
