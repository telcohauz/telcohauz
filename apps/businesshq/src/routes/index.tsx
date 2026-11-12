import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Sparkles, Wallet, Users, FolderLock, BadgeCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BusinessHQ Malaysia — AI operating system for SMEs" },
      { name: "description", content: "Compliance, payroll, documents, finance, projects and grants — one workspace, powered by AI." },
      { property: "og:title", content: "BusinessHQ Malaysia" },
      { property: "og:description", content: "AI-powered operating system for SMEs." },
    ],
  }),
  component: Index,
});

function Index() {
  const features = [
    { icon: ShieldCheck, title: "Compliance autopilot", desc: "SSM, LHDN, EPF, SOCSO, EIS deadlines tracked automatically." },
    { icon: Wallet, title: "Multi-country payroll", desc: "MY, SG, UK and US rules built in. Calculate in seconds." },
    { icon: FolderLock, title: "Document vault", desc: "OCR search, AI auto-tagging, version history." },
    { icon: BadgeCheck, title: "License tracker", desc: "Renewal reminders before anything expires." },
    { icon: Users, title: "Staff & HR", desc: "Profiles, leave, attendance and performance notes." },
    { icon: Sparkles, title: "AI Advisor", desc: "Context-aware answers on tax, grants and compliance." },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold" style={{ background: "var(--gradient-primary)" }}>B</div>
          <span className="font-semibold">BusinessHQ <span className="text-muted-foreground font-normal">Malaysia</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/auth"><Button>Get started</Button></Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-full px-3 py-1 mb-6">
          <Sparkles className="h-3 w-3" /> AI-powered for Malaysian SMEs
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
          Run your entire business <br />
          from <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>one workspace</span>.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Compliance, payroll, documents, finance, projects, assets and government grants — wired together and supercharged with an AI advisor that actually knows your business.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="gap-2">Start free <ArrowRight className="h-4 w-4" /></Button>
          </Link>
          <Link to="/auth"><Button size="lg" variant="outline">View demo</Button></Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3 bg-primary/10 text-primary">
              <f.icon className="h-4 w-4" />
            </div>
            <div className="font-semibold">{f.title}</div>
            <div className="text-sm text-muted-foreground mt-1">{f.desc}</div>
          </div>
        ))}
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BusinessHQ Malaysia. Built for SMEs.
      </footer>
    </div>
  );
}
