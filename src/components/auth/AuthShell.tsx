import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute left-1/2 top-1/4 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-primary/30 blur-[120px]" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-10">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.55_0.22_270)] shadow-[var(--glow-neon)]">
            <Zap className="h-5 w-5 text-background" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-bold">TELCOHAUZ</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Digital Hub</div>
          </div>
        </Link>

        <div className="w-full rounded-3xl glass-strong p-6 sm:p-8 shadow-[var(--shadow-card)]">
          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{children}</label>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-border bg-input/40 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition ${props.className ?? ""}`}
    />
  );
}

export function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.55_0.22_270)] px-5 py-2.5 text-sm font-semibold text-background shadow-[var(--glow-soft)] transition hover:shadow-[var(--glow-neon)] disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
