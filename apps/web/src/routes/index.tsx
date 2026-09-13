import { AdminExampleCard } from "@aloysius/ui/components/admin/example-card";
import { HelloWorld } from "@aloysius/ui/components/hello-world";
import { createFileRoute } from "@tanstack/react-router";

const Home = () => (
  <>
    <HelloWorld />
    <AdminExampleCard />
  </>
);

export const Route = createFileRoute("/")({
  component: Home,
});
