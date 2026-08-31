import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CircleDot, Flower2, House, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", hint: "मंदिर", icon: House },
  { to: "/japa", label: "Japa", hint: "जप", icon: CircleDot },
  { to: "/path", label: "Vāṇī", hint: "वाणी", icon: Sparkles },
  { to: "/murti", label: "Murti", hint: "मूर्ति", icon: Flower2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-peach text-ink">
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      <nav
        aria-label="Practices"
        className="relative z-20 grid grid-cols-4 border-t border-border bg-paper/90 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md"
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
              className={cn(
                "flex min-h-11 flex-col items-center justify-center gap-0.5 px-1 text-center transition-colors duration-150",
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
