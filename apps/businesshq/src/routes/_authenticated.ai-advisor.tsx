import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useActiveCompany } from "@/hooks/useActiveCompany";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ai-advisor")({
  head: () => ({ meta: [{ title: "AI Advisor — BusinessHQ" }] }),
  component: AIAdvisor,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What are my LHDN tax deadlines this quarter?",
  "Calculate EPF and SOCSO for a RM 5,000 salary",
  "Which government grants suit a Malaysian SaaS startup?",
  "Explain SST registration thresholds",
];

function AIAdvisor() {
  const { company } = useActiveCompany();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setLoading(true);

    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `https://kbjhyzuuxqoalntefebk.supabase.co/functions/v1/ai-advisor`,
        {
          method: "POST",
          signal: ctrl.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({
            messages: next,
            companyContext: company ? { name: company.name, country: company.country, business_type: company.business_type } : null,
          }),
        },
      );
      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Request failed");
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              assistant += delta;
              setMessages((cur) => {
                const copy = [...cur];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast.error(e.message ?? "Something went wrong");
        setMessages((cur) => cur.slice(0, -1));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="AI Advisor">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 h-[calc(100vh-9rem)]">
        <Card className="flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto pt-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--gradient-primary)" }}>
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="font-medium text-foreground">Ask BusinessHQ Advisor anything</div>
                <div className="mt-1 max-w-sm">Compliance, payroll, grants, tax — get answers tuned to your business.</div>
                <div className="mt-5 grid sm:grid-cols-2 gap-2 max-w-xl">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="text-left text-xs rounded-lg border border-border bg-card hover:border-primary/40 transition px-3 py-2">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.content || (loading && i === messages.length - 1 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
          <div className="border-t border-border p-3 flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about compliance, payroll, grants…"
              className="min-h-[44px] max-h-32 resize-none"
            />
            <Button onClick={() => send()} disabled={loading || !input.trim()} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </Card>
        <div className="space-y-4">
          <Card><CardContent className="pt-5">
            <div className="text-xs uppercase text-muted-foreground tracking-wide mb-2">Context</div>
            <div className="text-sm font-medium">{company?.name ?? "No company"}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{company?.country ?? "—"} · {company?.business_type ?? "—"}</div>
          </CardContent></Card>
          <Card><CardContent className="pt-5 text-xs text-muted-foreground">
            Advisor uses your active company's basic profile to tailor answers. Verify regulatory guidance with the relevant authority.
          </CardContent></Card>
        </div>
      </div>
    </AppShell>
  );
}
