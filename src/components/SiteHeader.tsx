import { Link } from "@tanstack/react-router";
import { Shield, Zap } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-[oklch(0.55_0.22_270)] shadow-[var(--glow-neon)]">
            <Zap className="h-5 w-5 text-background" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-bold tracking-tight">TELCOHAUZ</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Digital Hub</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a href="#services" className="text-muted-foreground transition hover:text-foreground">Services</a>
          <a href="#stats" className="text-muted-foreground transition hover:text-foreground">Stats</a>
          <a href="#why" className="text-muted-foreground transition hover:text-foreground">Why Us</a>
          <a href="#faq" className="text-muted-foreground transition hover:text-foreground">FAQ</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            search={{ redirect: "/admin" }}
            className="hidden items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-primary transition hover:bg-primary/20 hover:shadow-[var(--glow-soft)] sm:inline-flex"
            title="Admin login"
          >
            <Shield className="h-3.5 w-3.5" /> Admin
          </Link>
          <Link to="/login" className="hidden rounded-lg px-4 py-2 text-sm font-medium text-foreground/80 transition hover:text-foreground sm:inline-block">
            Sign in
          </Link>
          <Link
            to="/dashboard"
            className="rounded-lg bg-gradient-to-r from-primary to-[oklch(0.55_0.22_270)] px-4 py-2 text-sm font-semibold text-background shadow-[var(--glow-soft)] transition hover:shadow-[var(--glow-neon)]"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
