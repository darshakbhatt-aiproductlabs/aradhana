import { createFileRoute } from "@tanstack/react-router";
import { PracticeFrame } from "@/components/practice-frame";

export const Route = createFileRoute("/path")({ component: PathPage });

function PathPage() {
  return <PracticeFrame src="/practices/path.html" title="Lyric Path" />;
}
