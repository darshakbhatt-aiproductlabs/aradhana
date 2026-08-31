import { createFileRoute, Link } from "@tanstack/react-router";
import { OmMark } from "@/components/om-mark";

export const Route = createFileRoute("/")({ component: Home });

const PRACTICES = [
  {
    to: "/japa",
    no: "01",
    hi: "जप",
    en: "Japa",
    title: "Mala recitation",
    blurb: "A child’s mala. Tap a bead. Keep the name.",
  },
  {
    to: "/path",
    no: "02",
    hi: "पाठ",
    en: "Path",
    title: "Follow the verse",
    blurb: "Walk a hymn word by word, like a finger on the page.",
  },
  {
    to: "/puja",
    no: "03",
    hi: "पूजा",
    en: "Puja",
    title: "Manas puja",
    blurb: "Offer water, flowers, lamp — in the mind, to Shiva.",
  },
  {
    to: "/murti",
    no: "04",
    hi: "मूर्ति",
    en: "Murti",
    title: "Living deity",
    blurb: "Place a murti. Touch it. Let it wake.",
  },
] as const;

function Home() {
  return (
    <div className="relative h-full overflow-y-auto">
      <div
        className="pointer-events-none absolute inset-0 sanctum-wash bg-cover bg-center opacity-40"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night/70 via-night/80 to-night"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-full max-w-lg flex-col px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="mb-8 flex flex-col items-center text-center">
          <OmMark className="mb-4 size-14 text-sacred" />
          <p className="font-dev text-sm font-semibold tracking-[0.28em] text-cream-muted">
            आराधना
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-cream text-balance">
            Aradhana
          </h1>
          <p className="mt-2 max-w-xs font-sans text-sm leading-relaxed text-cream-muted text-pretty">
            The inner temple. Four doors into bhakti — japa, path, puja, and a murti that lives when you touch it.
          </p>
        </header>

        <ul className="flex flex-col gap-3">
          {PRACTICES.map((p) => (
            <li key={p.to}>
              <Link
                to={p.to}
                className="group block rounded-xl bg-night-elevated p-4 shadow-panel transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-[11px] tracking-[0.18em] text-cream-subtle">
                    {p.no}
                  </span>
                  <span className="font-dev text-lg font-bold text-vermillion">
                    {p.hi}
                  </span>
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-semibold tracking-tight text-cream">
                      {p.en}
                    </p>
                    <p className="mt-0.5 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-sacred">
                      {p.title}
                    </p>
                  </div>
                </div>
                <p className="mt-2 font-sans text-sm leading-relaxed text-cream-muted text-pretty">
                  {p.blurb}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center font-display text-xs tracking-[0.14em] text-cream-subtle">
          Sit. Breathe. Begin.
        </p>
      </div>
    </div>
  );
}
