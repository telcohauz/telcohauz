import { AppShell } from "./AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function PlaceholderModule({ title, description, points }: { title: string; description: string; points: string[] }) {
  return (
    <AppShell title={title}>
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Coming soon in this workspace</div>
            <ul className="space-y-2 text-sm">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-2">
              <Link to="/ai-advisor"><Button variant="outline" size="sm" className="gap-2"><Sparkles className="h-3.5 w-3.5" /> Ask AI to help plan this</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
