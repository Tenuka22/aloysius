import { HelloWorld } from "@aloysius/ui/components/hello-world";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HelloWorld,
});
