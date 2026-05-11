import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Smartphone, Apple, Network, Cpu, Wrench, Coins, Shield, Zap, Clock,
  CheckCircle2, ArrowRight, Sparkles, Globe, HeadphonesIcon, ChevronDown
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ServiceCard } from "@/components/ServiceCard";
import { Counter } from "@/components/Counter";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TELCOHAUZ Digital Service Hub — Unlock & Mobile Services" },
      { name: "description", content: "Professional unlock, FRP, iCloud bypass, flashing & telecom digital services. Fast processing, secure transactions, reseller-ready." },
      { property: "og:title", content: "TELCOHAUZ Digital Service Hub" },
      { property: "og:description", content: "All In One Digital Service Platform — premium unlock marketplace for resellers." },
    ],
  }),
  component: Landing,
});

const popularServices = [
  { icon: Smartphone, brand: "Samsung", title: "FRP Unlock — All Models", time: "5-30 min", price: "RM 25" },
  { icon: Apple, brand: "Apple", title: "iCloud Bypass — Premium", time: "1-24 hrs", price: "RM 180" },
  { icon: Network, brand: "Carrier", title: "Network Unlock — Worldwide", time: "1-3 days", price: "RM 65" },
  { icon: Cpu, brand: "Xiaomi", title: "Mi Account Remove", time: "10-60 min", price: "RM 80" },
  { icon: Wrench, brand: "Huawei", title: "Bootloader / FRP / ID", time: "1-6 hrs", price: "RM 45" },
  { icon: Smartphone, brand: "Oppo / Vivo", title: "Pattern & FRP Remove", time: "Instant", price: "RM 20", status: "busy" as const },
  { icon: Apple, brand: "Apple", title: "iPhone IMEI Check", time: "Instant", price: "RM 5" },
  { icon: Cpu, brand: "Software", title: "Firmware Flash Service", time: "30 min", price: "RM 35" },
];

const categories = [
  { icon: Smartphone, label: "Android", count: 142, color: "from-emerald-500/30 to-cyan-500/20" },
  { icon: Apple, label: "iPhone", count: 87, color: "from-blue-500/30 to-indigo-500/20" },
  { icon: Network, label: "Network", count: 56, color: "from-violet-500/30 to-fuchsia-500/20" },
  { icon: Cpu, label: "Software", count: 73, color: "from-amber-500/30 to-orange-500/20" },
  { icon: Wrench, label: "Repair", count: 38, color: "from-rose-500/30 to-pink-500/20" },
  { icon: Coins, label: "Credits", count: 12, color: "from-cyan-500/30 to-blue-500/20" },
];

const reasons = [
  { icon: Zap, title: "Fast Processing", desc: "Most services complete in minutes. Automated where possible." },
  { icon: Shield, title: "Secure & Trusted", desc: "Encrypted transactions, vetted suppliers, full refund policy." },
  { icon: Globe, title: "Worldwide Coverage", desc: "Carriers and devices across 50+ countries supported." },
  { icon: HeadphonesIcon, title: "24/7 Support", desc: "WhatsApp, ticket and Telegram support around the clock." },
];

const faqs = [
  { q: "How long do unlock services take?", a: "Most instant services complete in 5–30 minutes. Premium iCloud and IMEI services may take 1–24 hours." },
  { q: "What payment methods do you accept?", a: "FPX, DuitNow, manual bank transfer, and crypto (USDT) for international resellers." },
  { q: "Do you offer reseller pricing?", a: "Yes — register as a reseller to unlock wholesale pricing, API access, and white-label tools." },
  { q: "What if my service fails?", a: "Failed orders are automatically refunded to your wallet within minutes. No questions asked." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <Categories />
      <PopularServices />
      <Stats />
      <WhyUs />
      <FAQ />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute left-1/2 top-20 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-primary/30 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">All In One Digital Service Platform</span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            <span className="text-gradient">Professional Unlock</span>
            <br />
            <span className="neon-text">& Mobile Digital Services</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Fast processing, secure transactions, reseller-ready platform.
            Powering thousands of unlock shops across Southeast Asia.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.55_0.22_270)] px-6 py-3 text-sm font-semibold text-background shadow-[var(--glow-neon)] transition hover:scale-[1.03]"
            >
              Order Now <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl glass px-6 py-3 text-sm font-semibold text-foreground glow-on-hover"
            >
              <Coins className="h-4 w-4 text-primary" /> Buy Credits
            </Link>
            <a
              href="https://wa.me/60000000000"
              className="inline-flex items-center gap-2 rounded-xl border border-[oklch(0.72_0.18_155/0.5)] bg-[oklch(0.72_0.18_155/0.1)] px-6 py-3 text-sm font-semibold text-[oklch(0.78_0.16_155)] transition hover:bg-[oklch(0.72_0.18_155/0.2)]"
            >
              WhatsApp Support
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[oklch(0.78_0.16_155)]" /> 99.4% Success Rate</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> Instant Auto Processing</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> Auto-Refund on Failure</span>
          </div>
        </motion.div>

        {/* Floating preview card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="absolute inset-x-10 -bottom-10 h-40 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative overflow-hidden rounded-3xl glass-strong p-2 shadow-[var(--shadow-card)]">
            <div className="rounded-2xl bg-gradient-to-br from-surface-elevated to-surface p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { l: "Today's Orders", v: "1,284", s: "+12.4%" },
                  { l: "Active Services", v: "412", s: "Live" },
                  { l: "Avg. Process Time", v: "8m 42s", s: "-3.1%" },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl border border-border/50 bg-background/40 p-4">
                    <div className="text-xs text-muted-foreground">{s.l}</div>
                    <div className="mt-1 font-display text-2xl font-bold neon-text">{s.v}</div>
                    <div className="mt-1 text-[10px] text-[oklch(0.78_0.16_155)]">{s.s}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {categories.map((c, i) => (
          <motion.button
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className={`group relative overflow-hidden rounded-2xl glass p-5 text-left glow-on-hover`}
          >
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${c.color} blur-2xl opacity-60`} />
            <c.icon className="relative h-6 w-6 text-primary" />
            <div className="relative mt-3 text-sm font-semibold">{c.label}</div>
            <div className="relative text-xs text-muted-foreground">{c.count} services</div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

function PopularServices() {
  return (
    <section id="services" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary">Most Ordered</div>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Popular Services</h2>
        </div>
        <Link to="/dashboard" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-flex items-center gap-1">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {popularServices.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
          >
            <ServiceCard {...s} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section id="stats" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="rounded-3xl glass-strong p-10">
        <div className="grid gap-8 text-center sm:grid-cols-4">
          {[
            { v: 184230, s: "+", label: "Orders Processed" },
            { v: 12480, s: "+", label: "Active Resellers" },
            { v: 99, s: "%", label: "Success Rate" },
            { v: 50, s: "+", label: "Countries Served" },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-display text-4xl font-bold neon-text sm:text-5xl">
                <Counter end={s.v} suffix={s.s} />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  return (
    <section id="why" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-xs uppercase tracking-[0.2em] text-primary">Why TELCOHAUZ</div>
        <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Built for Professional Resellers</h2>
        <p className="mt-3 text-muted-foreground">Everything you need to run a serious unlock & digital service business.</p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reasons.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl glass p-6 glow-on-hover"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 border border-primary/30">
              <r.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">{r.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{r.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.2em] text-primary">FAQ</div>
        <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Common Questions</h2>
      </div>
      <div className="mt-10 space-y-3">
        {faqs.map((f, i) => (
          <button
            key={f.q}
            onClick={() => setOpen(open === i ? null : i)}
            className="block w-full rounded-2xl glass p-5 text-left transition hover:border-primary/40"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium">{f.q}</span>
              <ChevronDown className={`h-4 w-4 text-primary transition ${open === i ? "rotate-180" : ""}`} />
            </div>
            {open === i && (
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-border/40 bg-background/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-[oklch(0.55_0.22_270)]">
              <Zap className="h-5 w-5 text-background" />
            </div>
            <div className="font-display font-bold">TELCOHAUZ</div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            All In One Digital Service Platform for unlock professionals & resellers.
          </p>
        </div>
        <FooterCol title="Services" links={["Android Unlock", "iPhone Services", "Network Unlock", "Flashing"]} />
        <FooterCol title="Company" links={["About", "Resellers", "API Docs", "Contact"]} />
        <FooterCol title="Support" links={["Help Center", "Open Ticket", "WhatsApp", "Telegram"]} />
      </div>
      <div className="border-t border-border/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <div>© {new Date().getFullYear()} Telcohauz Phone Enterprise. All rights reserved.</div>
          <div>Built for professional resellers worldwide.</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="text-sm font-semibold">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => <li key={l}><a href="#" className="hover:text-foreground">{l}</a></li>)}
      </ul>
    </div>
  );
}
