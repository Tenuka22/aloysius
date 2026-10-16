import type { HistoryResponse } from "@aloysius/ui/components/cms/history-popover";
import {
  HomepageEditor,
  HomepageEditorActions,
  SectionsDropdown,
} from "@aloysius/ui/components/cms/homepage-editor";
import type { HomepageEditorHandle } from "@aloysius/ui/components/cms/homepage-editor";
import {
  ScreenHead,
  ScreenWrap,
} from "@aloysius/ui/components/cms/screen-head";
import { GALLERIES_BLOCKS } from "@aloysius/ui/content/cms";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useCallback, useRef, useState } from "react";

import { uploadImage } from "@/components/club/upload";
import { client, orpc } from "@/utils/orpc";

/**
 * `/cms/galleries-page` - the masthead above the photograph grid.
 *
 * Deliberately a separate screen from `/cms/galleries`, which edits the
 * gallery *records*. An editor opening "Galleries" from the nav wants to add a
 * gallery; an editor opening this one wants to change what the index page says
 * above the galleries. One screen cannot be both without burying the
 * photographs under a form.
 */

const GalleriesPageContent = () => {
  const queryClient = useQueryClient();
  const pageQuery = orpc.cms.getGalleriesPage.queryOptions();
  const { data: page } = useSuspenseQuery(pageQuery);
  const editorRef = useRef<HomepageEditorHandle>(null);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const updateMutation = useMutation(
    orpc.cms.updateGalleriesPage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(pageQuery);
      },
    })
  );

  const publishMutation = useMutation(
    orpc.cms.publishGalleriesPage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(pageQuery);
      },
    })
  );

  const handleUpload = uploadImage;

  const handleSaveDraft = useCallback(async () => {
    const blocks = editorRef.current?.getBlocks();
    if (blocks) {
      await updateMutation.mutateAsync({ blocks });
      editorRef.current?.commitBlocks(blocks);
    }
  }, [updateMutation]);

  const handlePublish = useCallback(async () => {
    const blocks = editorRef.current?.getBlocks();
    if (!blocks) {
      return;
    }
    await updateMutation.mutateAsync({ blocks });
    await publishMutation.mutateAsync();
    editorRef.current?.commitBlocks(blocks);
  }, [updateMutation, publishMutation]);

  const handleDirtyChange = useCallback(
    (nextDirty: Record<string, boolean>) => setDirty(nextDirty),
    []
  );

  const handleToggleHidden = useCallback((blockId: string) => {
    editorRef.current?.toggleHidden(blockId);
    setHidden((prev) => ({ ...prev, [blockId]: !prev[blockId] }));
  }, []);

  const handleSelectBlock = useCallback((blockId: string) => {
    editorRef.current?.selectBlock(blockId);
  }, []);

  const handlePreview = useCallback(() => {
    const blocks = editorRef.current?.getBlocks();
    if (!blocks) {
      return;
    }
    updateMutation.mutate(
      { blocks },
      {
        onSuccess: (data) => {
          if (data?.draftIds?.[0]) {
            window.open(`/preview/${data.draftIds[0]}`, "_blank");
          }
        },
      }
    );
  }, [updateMutation]);

  const handleFetchHistory = useCallback(
    async (cursor: number): Promise<HistoryResponse> => {
      const result = await client.cms.getGalleriesPageHistory({ cursor });
      return result as HistoryResponse;
    },
    []
  );

  const sectionsSlot = (
    <SectionsDropdown
      blocks={GALLERIES_BLOCKS}
      dirty={dirty}
      hidden={hidden}
      onToggle={handleToggleHidden}
      onSelect={handleSelectBlock}
    />
  );

  return (
    <>
      <ScreenHead
        actions={
          <HomepageEditorActions
            fetchHistory={handleFetchHistory}
            onPreview={handlePreview}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
            sectionsSlot={sectionsSlot}
          />
        }
        eyebrow="Pages / Galleries"
        heading="Galleries Page Editor"
        note="The masthead above the photograph grid. The galleries themselves are managed under Galleries."
      />
      <HomepageEditor
        blocks={GALLERIES_BLOCKS}
        initialBlocks={page?.blocks ?? undefined}
        onDirtyChange={handleDirtyChange}
        onUpload={handleUpload}
        ref={editorRef}
      />
    </>
  );
};

export const Route = createFileRoute("/cms/galleries-page")({
  head: () => ({
    meta: [
      { title: "Galleries Page Editor — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <ScreenWrap>
      <Suspense fallback={<div>Loading…</div>}>
        <GalleriesPageContent />
      </Suspense>
    </ScreenWrap>
  ),
});
