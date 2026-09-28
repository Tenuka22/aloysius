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
import { NEWS_BLOCKS } from "@aloysius/ui/content/cms";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useCallback, useRef, useState } from "react";

import { client, orpc } from "@/utils/orpc";

const NewsContent = () => {
  const queryClient = useQueryClient();
  const newsQuery = orpc.cms.getNews.queryOptions();
  const { data: news } = useSuspenseQuery(newsQuery);
  const editorRef = useRef<HomepageEditorHandle>(null);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const updateMutation = useMutation(
    orpc.cms.updateNews.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(newsQuery);
      },
    })
  );

  const publishMutation = useMutation(
    orpc.cms.publishNews.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(newsQuery);
      },
    })
  );

  const handleUpload = useCallback(async (file: File) => {
    const upload = await client.files.getUploadUrl({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    const response = await fetch(upload.uploadUrl, {
      body: file,
      headers: { "Content-Type": file.type },
      method: "PUT",
    });
    if (!response.ok) {
      throw new Error("The media upload failed.");
    }
    const record = await client.files.completeUpload({
      key: upload.key,
      name: file.name,
      size: file.size,
      type: file.type,
    });
    return record.url;
  }, []);

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
      const result = await client.cms.getNewsHistory({ cursor });
      return result as HistoryResponse;
    },
    []
  );

  const sectionsSlot = (
    <SectionsDropdown
      blocks={NEWS_BLOCKS}
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
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            onPreview={handlePreview}
            sectionsSlot={sectionsSlot}
            fetchHistory={handleFetchHistory}
          />
        }
        eyebrow="Pages / News"
        heading="News Editor"
        note="Edit the page header and feed settings for the News section."
      />
      <HomepageEditor
        blocks={NEWS_BLOCKS}
        ref={editorRef}
        initialBlocks={news?.blocks ?? undefined}
        onDirtyChange={handleDirtyChange}
        onUpload={handleUpload}
      />
    </>
  );
};

export const Route = createFileRoute("/cms/news")({
  head: () => ({
    meta: [
      { title: "News Editor — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <ScreenWrap>
      <Suspense fallback={<div>Loading…</div>}>
        <NewsContent />
      </Suspense>
    </ScreenWrap>
  ),
});
