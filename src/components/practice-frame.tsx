export function PracticeFrame({ src, title }: { src: string; title: string }) {
  return (
    <iframe
      src={src}
      title={title}
      className="h-full w-full border-0 bg-night"
      allow="autoplay; fullscreen; microphone; camera; clipboard-read; clipboard-write"
    />
  );
}
