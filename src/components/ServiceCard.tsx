import type { LucideIcon } from "lucide-react";
import { Clock, ArrowRight } from "lucide-react";

interface Props {
  icon: LucideIcon;
  brand: string;
  title: string;
  time: string;
  price: string;
  status?: "live" | "busy";
}

export function ServiceCard({ icon: Icon, brand, title, time, price, status = "live" }: Props) {
  return (
    <div className="group relative overflow-hidden rounded-2xl glass glow-on-hover p-5">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-100 opacity-50" />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-surface-elevated to-surface border border-border">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{brand}</div>
            <div className="text-sm font-semibold leading-tight">{title}</div>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium ${
          status === "live" ? "bg-success/15 text-[oklch(0.78_0.16_155)]" : "bg-warning/15 text-[oklch(0.85_0.16_80)]"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status === "live" ? "bg-[oklch(0.78_0.16_155)]" : "bg-[oklch(0.85_0.16_80)]"} animate-pulse`} />
          {status === "live" ? "Live" : "Busy"}
        </span>
      </div>

      <div className="relative mt-5 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {time}</span>
        <span className="text-base font-bold text-foreground">{price}</span>
      </div>

      <button className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-background hover:shadow-[var(--glow-neon)]">
        Order Now <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
