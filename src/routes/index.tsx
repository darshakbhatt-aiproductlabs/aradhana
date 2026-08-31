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
    blurb: "A soft mala. Tap a bead. Keep the Name, together.",
  },
  {
    to: "/path",
    no: "02",
    hi: "वाणी",
    en: "Vāṇī",
    title: "Divine screen",
    blurb: "Hymns on a sacred stage — word by word, as if the deity is singing to you.",
  },
  {
    to: "/murti",
    no: "03",
    hi: "मूर्ति",
    en: "Murti",
    title: "Living puja",
    blurb: "Choose a form, hear their mantra, offer jal to aarti — a puja of the mind.",
  },
] as const;

function Home() {
  return (
    <div className="relative h-full overflow-y-auto pastel-wash">
      <div className="relative mx-auto flex min-h-full max-w-lg flex-col px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="mb-8 flex flex-col items-center text-center">
          <OmMark className="mb-3 size-14 text-coral" />
          <p className="font-dev text-sm font-bold tracking-[0.28em] text-mist">
            आराधना
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-coral-deep text-balance">
            Aradhana
          </h1>
          <p className="mt-2 max-w-xs font-sans text-sm leading-relaxed text-mist text-pretty">
            A pastel inner temple — for little hands and grown hearts. Japa, Vāṇī, and a living murti.
          </p>
        </header>

        <ul className="flex flex-col gap-3">
          {PRACTICES.map((p) => (
            <li key={p.to}>
              <Link
                to={p.to}
                className="group block rounded-xl bg-paper/85 p-4 shadow-panel transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-sans text-[11px] font-bold tracking-[0.18em] text-mist">
                    {p.no}
                  </span>
                  <span className="font-dev text-lg font-extrabold text-coral-deep">
                    {p.hi}
                  </span>
                </div>
                <p className="mt-2 font-display text-xl font-bold tracking-tight text-ink">
                  {p.en}
                </p>
                <p className="mt-0.5 font-sans text-xs font-bold uppercase tracking-[0.12em] text-coral">
                  {p.title}
                </p>
                <p className="mt-2 font-sans text-sm leading-relaxed text-mist text-pretty">
                  {p.blurb}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center font-display text-sm text-mist">
          Sit. Breathe. Begin.
        </p>
      </div>
    </div>
  );
}
