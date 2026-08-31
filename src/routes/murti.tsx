import { createFileRoute } from "@tanstack/react-router";
import { PracticeFrame } from "@/components/practice-frame";

export const Route = createFileRoute("/murti")({ component: MurtiPage });

function MurtiPage() {
  return <PracticeFrame src="/practices/murti.html" title="Living Murti" />;
}
