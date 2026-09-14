import { Navbar } from "@aloysius/ui/components/navbar";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Navbar,
});
