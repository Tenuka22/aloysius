import { Card } from "@astryxdesign/core/Card";
import { Grid, GridSpan } from "@astryxdesign/core/Grid";
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  VStack,
} from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/")({
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(orpc.staff.listStaff.queryOptions());
  },
  component: () => (
    <Layout
      content={
        <LayoutContent padding={6}>
          <Suspense fallback="Loading dashboard…">
            <DashboardPage />
          </Suspense>
        </LayoutContent>
      }
      header={
        <LayoutHeader>
          <Heading level={1}>Dashboard</Heading>
        </LayoutHeader>
      }
      height="fill"
      padding={0}
    />
  ),
});

const DashboardPage = () => {
  const { data: staff } = useSuspenseQuery(orpc.staff.listStaff.queryOptions());

  const withEmail = staff.filter((row) => row.email).length;
  const withPortrait = staff.filter((row) => row.portraitFileId).length;

  return (
    <Grid columns={4} gap={4}>
      <GridSpan columns={1}>
        <StatCard label="Total staff" value={staff.length} />
      </GridSpan>
      <GridSpan columns={1}>
        <StatCard label="With email on file" value={withEmail} />
      </GridSpan>
      <GridSpan columns={2}>
        <StatCard label="With a portrait" value={withPortrait} />
      </GridSpan>
    </Grid>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <Card padding={5}>
    <VStack gap={1}>
      <Text color="secondary" type="supporting">
        {label}
      </Text>
      <Text size="3xl" weight="semibold">
        {value}
      </Text>
    </VStack>
  </Card>
);
