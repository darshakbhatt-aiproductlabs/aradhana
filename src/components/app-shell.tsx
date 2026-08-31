import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, CircleDot, Flame, Flower2, House } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", hint: "मंदिर", icon: House },
  { to: "/japa", label: "Japa", hint: "जप", icon: CircleDot },
  { to: "/path", label: "Path", hint: "पाठ", icon: BookOpen },
  { to: "/puja", label: "Puja", hint: "पूजा", icon: Flame },
  { to: "/murti", label: "Murti", hint: "मूर्ति", icon: Flower2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-night text-cream">
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      <nav
        aria-label="Practices"
        className="relative z-20 grid grid-cols-5 border-t border-border bg-night-elevated/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md"
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
                active ? "text-cream" : "text-cream-subtle hover:text-cream-muted",
              )}
            >
              <Icon
                className="size-5"
                strokeWidth={active ? 2.2 : 1.75}
                aria-hidden="true"
              />
              <span className="font-sans text-[10px] font-semibold tracking-wide">
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
