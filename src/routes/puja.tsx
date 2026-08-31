import { createFileRoute } from "@tanstack/react-router";
import { PracticeFrame } from "@/components/practice-frame";

export const Route = createFileRoute("/puja")({ component: PujaPage });

function PujaPage() {
  return <PracticeFrame src="/practices/puja.html" title="Manas Puja" />;
}
