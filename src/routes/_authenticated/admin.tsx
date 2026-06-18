import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fetchPendingOffers, fetchOffers } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin · Perkly" }] }),
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const { formatPrice } = useI18n();
  const pendingQuery = useQuery({ queryKey: ["pending-offers"], queryFn: fetchPendingOffers });
  const publishedQuery = useQuery({ queryKey: ["all-published-offers"], queryFn: () => fetchOffers({}) });

  const decide = async (id: string, status: "published" | "rejected", reason?: string) => {
    const update = {
      status,
      ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
      ...(status === "rejected" ? { rejected_reason: reason ?? "Does not meet our quality guidelines." } : {}),
    };
    const { error } = await supabase.from("offers").update(update).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(status === "published" ? "Approved & published" : "Rejected");
    qc.invalidateQueries({ queryKey: ["pending-offers"] });
    qc.invalidateQueries({ queryKey: ["all-published-offers"] });
  };

  return (
    <DashboardShell title="Platform admin">
      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Moderation queue ({pendingQuery.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="published">Live offers ({publishedQuery.data?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-6">
          {pendingQuery.isLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (pendingQuery.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
              All clear — nothing to moderate right now.
            </div>
          ) : (
            <ul className="space-y-3">
              {pendingQuery.data!.map((o) => (
                <li key={o.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                  <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {o.cover_url ? <img src={o.cover_url} className="h-full w-full object-cover" alt="" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-semibold">{o.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{o.providers?.name} · {o.city} · {formatPrice(o.price_all)}</p>
                    {o.subtitle ? <p className="mt-1 text-xs text-muted-foreground">{o.subtitle}</p> : null}
                  </div>
                  <a href={`/marketplace/${o.slug}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /></a>
                  <Button size="sm" variant="outline" onClick={() => decide(o.id, "rejected", prompt("Reason?") || undefined)}>
                    <XCircle className="mr-1 h-4 w-4" /> Reject
                  </Button>
                  <Button size="sm" onClick={() => decide(o.id, "published")}>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="published" className="mt-6">
          {publishedQuery.isLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            <ul className="space-y-2">
              {publishedQuery.data!.map((o) => (
                <li key={o.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-3">
                  <div className="h-12 w-16 overflow-hidden rounded bg-muted">
                    {o.cover_url ? <img src={o.cover_url} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{o.title}</p>
                    <p className="text-xs text-muted-foreground">{o.providers?.name} · {formatPrice(o.price_all)}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => decide(o.id, "rejected", "Removed by admin")}>
                    Archive
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
