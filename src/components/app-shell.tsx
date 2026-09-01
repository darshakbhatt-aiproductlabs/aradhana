import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, CircleDot, Flower2, House, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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

function pingIframeRoot() {
  const frame = document.querySelector<HTMLIFrameElement>("main iframe");
  frame?.contentWindow?.postMessage({ type: "aradhana-root" }, "*");
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = TITLES[pathname];

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-peach text-ink">
      {title ? (
        <header className="relative z-30 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-paper/95 px-2 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur-md">
          <Link
            to="/"
            className="relative z-10 flex min-h-10 items-center gap-0.5 rounded-full bg-paper px-3 font-sans text-sm font-bold text-coral-deep shadow-panel"
          >
            <ChevronLeft className="size-5" strokeWidth={2.4} aria-hidden="true" />
            Home
          </Link>
          <p className="pointer-events-none absolute inset-x-0 text-center font-display text-base font-bold text-ink">
            {title}
          </p>
        </header>
      ) : null}
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      <nav
        aria-label="Practices"
        className="relative z-30 grid grid-cols-4 border-t border-border bg-paper/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md"
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
    </div>
  );
}
