import { createFileRoute } from "@tanstack/react-router";
import { PracticeFrame } from "@/components/practice-frame";

export const Route = createFileRoute("/japa")({ component: JapaPage });

function JapaPage() {
  return <PracticeFrame src="/practices/japa.html" title="Japa Mala" />;
}
