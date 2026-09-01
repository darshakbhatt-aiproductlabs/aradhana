import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, CircleDot, Flower2, House, Music2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHITTA_CHANNEL,
  CHITTA_TRACKS,
  parseYoutubeId,
  trackTitle,
  youtubeEmbedSrc,
} from "@/lib/chitta-dhyana";

const NAV = [
  { to: "/", label: "Home", hint: "मंदिर", icon: House },
  { to: "/japa", label: "Japa", hint: "जप", icon: CircleDot },
  { to: "/path", label: "Vāṇī", hint: "वाणी", icon: Sparkles },
  { to: "/murti", label: "Murti", hint: "मूर्ति", icon: Flower2 },
] as const;

const TITLES: Record<string, string> = {
  "/japa": "Japa",
  "/path": "Vāṇī",
  "/murti": "Murti",
};

const YT_KEY = "aradhana-yt";

type Playing = { id: string; title: string };

function pingIframeRoot() {
  const frame = document.querySelector<HTMLIFrameElement>("main iframe");
  frame?.contentWindow?.postMessage({ type: "aradhana-root" }, "*");
}

function readPlaying(): Playing | null {
  try {
    const raw = localStorage.getItem(YT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Playing;
    if (parsed && typeof parsed.id === "string" && parsed.id.length === 11) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = TITLES[pathname];
  const [cinema, setCinema] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [playing, setPlaying] = useState<Playing | null>(null);
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState("");

  useEffect(() => {
    setPlaying(readPlaying());
  }, []);

  useEffect(() => {
    setCinema(false);
    document.documentElement.classList.remove("cinema");
    setMusicOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const data = e.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "aradhana-cinematic") {
        const on = !!data.on;
        setCinema(on);
        document.documentElement.classList.toggle("cinema", on);
        if (on) setMusicOpen(false);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const embed = useMemo(() => (playing ? youtubeEmbedSrc(playing.id) : ""), [playing]);

  function persist(next: Playing | null) {
    setPlaying(next);
    try {
      if (next) localStorage.setItem(YT_KEY, JSON.stringify(next));
      else localStorage.removeItem(YT_KEY);
    } catch {
      /* ignore */
    }
  }

  function playTrack(id: string, titleName?: string) {
    persist({ id, title: titleName || trackTitle(id) });
    setPasteError("");
    setMusicOpen(false);
  }

  function onPaste(e: FormEvent) {
    e.preventDefault();
    const id = parseYoutubeId(paste);
    if (!id) {
      setPasteError("Paste a YouTube link from Chitta Dhyana.");
      return;
    }
    playTrack(id, "Chitta Dhyana");
    setPaste("");
  }

  return (
    <div className="relative flex h-dvh min-h-0 flex-col bg-peach text-ink">
      {title && !cinema ? (
        <header className="app-back relative z-30 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-paper/95 px-2 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur-md">
          <Link
            to="/"
            aria-label="Back"
            className="relative z-10 flex size-10 items-center justify-center rounded-full bg-paper text-coral-deep shadow-panel"
          >
            <ChevronLeft className="size-6" strokeWidth={2.4} aria-hidden="true" />
          </Link>
          <button
            type="button"
            aria-label="Background music"
            aria-expanded={musicOpen}
            onClick={() => setMusicOpen((v) => !v)}
            className={cn(
              "relative z-10 flex size-10 items-center justify-center rounded-full bg-paper text-coral-deep shadow-panel",
              playing && "ring-2 ring-coral/50",
            )}
          >
            <Music2 className="size-5" strokeWidth={2.2} aria-hidden="true" />
          </button>
        </header>
      ) : null}

      <main className="relative min-h-0 flex-1 overflow-hidden">{children}</main>

      {!title && !cinema ? (
        <button
          type="button"
          aria-label="Background music"
          onClick={() => setMusicOpen((v) => !v)}
          className={cn(
            "absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-40 flex size-10 items-center justify-center rounded-full bg-paper text-coral-deep shadow-panel",
            playing && "ring-2 ring-coral/50",
          )}
        >
          <Music2 className="size-5" strokeWidth={2.2} aria-hidden="true" />
        </button>
      ) : null}

      {playing ? (
        <div
          className={cn(
            "pointer-events-auto absolute z-40 overflow-hidden rounded-md border border-border bg-paper shadow-panel",
            cinema ? "bottom-3 right-3" : "bottom-[5.5rem] right-3",
          )}
        >
          <iframe
            key={playing.id}
            title={playing.title}
            src={embed}
            width={160}
            height={90}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            className="block"
          />
        </div>
      ) : null}

      {musicOpen && !cinema ? (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-ink/25 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center">
          <div
            role="dialog"
            aria-labelledby="music-title"
            className="max-h-[min(32rem,80dvh)] w-full max-w-md overflow-hidden rounded-xl bg-paper shadow-panel"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p id="music-title" className="font-display text-lg font-bold text-coral-deep">
                  Chitta Dhyana
                </p>
                <a
                  href={CHITTA_CHANNEL.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-sans text-xs font-bold text-mist underline-offset-2 hover:underline"
                >
                  {CHITTA_CHANNEL.handle}
                </a>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setMusicOpen(false)}
                className="flex size-9 items-center justify-center rounded-full text-ink"
              >
                <X className="size-5" strokeWidth={2.2} />
              </button>
            </div>
            <div className="max-h-[min(20rem,50dvh)] overflow-y-auto px-2 py-2">
              {CHITTA_TRACKS.map((t) => {
                const on = playing?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => playTrack(t.id, t.title)}
                    className={cn(
                      "flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-colors",
                      on ? "bg-coral/15 text-coral-deep" : "text-ink hover:bg-peach",
                    )}
                  >
                    <span className="font-dev text-sm font-extrabold">{t.hi}</span>
                    <span className="font-sans text-xs font-semibold text-mist">{t.title}</span>
                  </button>
                );
              })}
            </div>
            <form onSubmit={onPaste} className="border-t border-border px-4 py-3">
              <label htmlFor="yt-paste" className="font-sans text-[11px] font-bold uppercase tracking-wider text-mist">
                Any song from the channel
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="yt-paste"
                  value={paste}
                  onChange={(e) => {
                    setPaste(e.target.value);
                    setPasteError("");
                  }}
                  placeholder="Paste a YouTube link"
                  className="min-h-10 flex-1 rounded-md border border-border bg-peach px-3 font-sans text-sm text-ink outline-none focus:border-coral"
                />
                <button
                  type="submit"
                  className="rounded-md bg-coral px-3 font-sans text-sm font-bold text-paper"
                >
                  Play
                </button>
              </div>
              {pasteError ? (
                <p className="mt-1.5 font-sans text-xs font-semibold text-coral-deep">{pasteError}</p>
              ) : null}
              {playing ? (
                <button
                  type="button"
                  onClick={() => persist(null)}
                  className="mt-2 font-sans text-xs font-bold text-mist underline-offset-2 hover:underline"
                >
                  Stop music
                </button>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}

      {!cinema ? (
        <nav
          aria-label="Practices"
          className="app-tabs relative z-30 grid grid-cols-4 border-t border-border bg-paper/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md"
        >
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  if (active && item.to !== "/") {
                    e.preventDefault();
                    pingIframeRoot();
                  }
                }}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 px-1 text-center transition-colors duration-150",
                  active ? "text-coral-deep" : "text-mist hover:text-ink",
                )}
              >
                <Icon
                  className="size-5"
                  strokeWidth={active ? 2.2 : 1.75}
                  aria-hidden="true"
                />
                <span className="font-sans text-[10px] font-bold tracking-wide">
                  {item.label}
                </span>
                <span className="sr-only">{item.hint}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
