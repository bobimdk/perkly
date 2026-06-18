import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Loader2, BrainCircuit, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateEmployerInsights } from "@/lib/ai-insights.functions";
import { useI18n } from "@/lib/i18n";

export function EmployerAIInsights({ companyId }: { companyId: string }) {
  const fn = useServerFn(generateEmployerInsights);
  const { formatPrice } = useI18n();
  const [hasRun, setHasRun] = useState(false);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { companyId } }),
    onSuccess: () => setHasRun(true),
  });

  const stats = mutation.data?.stats;

  return (
    <section className="rounded-3xl border border-border bg-gradient-to-br from-amber-50 via-card to-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <BrainCircuit className="h-4 w-4" />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">AI Insights</p>
            <h3 className="font-display text-lg font-bold">What's happening at your company</h3>
          </div>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} variant={hasRun ? "outline" : "default"}>
          {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
          {hasRun ? "Refresh insights" : "Generate insights"}
        </Button>
      </div>

      {mutation.isError && (
        <p className="mt-4 text-sm text-destructive">Couldn't generate insights right now. Try again in a moment.</p>
      )}

      {stats && (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <StatTile label="Employees" value={`${stats.employees.active}/${stats.employees.total}`} />
          <StatTile label="Pending requests" value={String(stats.requests.pending)} />
          <StatTile label="Budget used" value={`${stats.budgetUtilization.pct}%`} />
          <StatTile label="Total spend" value={formatPrice(stats.spend.totalAll)} />
        </div>
      )}

      {mutation.data && (
        <div className="prose prose-sm dark:prose-invert mt-5 max-w-none rounded-2xl bg-card/60 p-4">
          <ReactMarkdown>{mutation.data.insights}</ReactMarkdown>
        </div>
      )}

      {!mutation.data && !mutation.isPending && (
        <p className="mt-4 text-sm text-muted-foreground">
          Click "Generate insights" to let Perkly AI analyse your team's benefits activity.
        </p>
      )}
    </section>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
    </div>
  );
}
