import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, XCircle, ExternalLink, Users, Megaphone, BarChart3, Ban, RotateCcw, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchPendingOffers, fetchOffers } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { listUsers, setUserSuspended, sendBroadcast, platformStats } from "@/lib/phase5";

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
          <TabsTrigger value="queue">Queue ({pendingQuery.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="published">Live ({publishedQuery.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-1 h-3 w-3" />Users</TabsTrigger>
          <TabsTrigger value="broadcast"><Megaphone className="mr-1 h-3 w-3" />Broadcast</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="mr-1 h-3 w-3" />Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-6">
          {pendingQuery.isLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (pendingQuery.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
              All clear — nothing to moderate.
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
                  <Button size="sm" variant="outline" onClick={() => decide(o.id, "rejected", "Removed by admin")}>Archive</Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UsersPanel />
        </TabsContent>

        <TabsContent value="broadcast" className="mt-6">
          <BroadcastPanel />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsPanel />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function UsersPanel() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const usersQ = useQuery({ queryKey: ["admin-users", q], queryFn: () => listUsers(q) });

  const toggle = async (id: string, suspended: boolean) => {
    await setUserSuspended(id, suspended, suspended ? "Suspended by admin" : undefined);
    toast.success(suspended ? "User suspended" : "User reinstated");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <div className="space-y-4">
      <Input placeholder="Search by email…" value={q} onChange={(e) => setQ(e.target.value)} />
      {usersQ.isLoading ? <Skeleton className="h-40 rounded-xl" /> : (
        <ul className="space-y-2">
          {(usersQ.data ?? []).map((u: any) => (
            <li key={u.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <div>
                <p className="text-sm font-medium">{u.first_name} {u.last_name} {u.suspended && <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">SUSPENDED</span>}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <Button size="sm" variant={u.suspended ? "default" : "outline"} onClick={() => toggle(u.id, !u.suspended)}>
                {u.suspended ? <><RotateCcw className="mr-1 h-3 w-3" />Reinstate</> : <><Ban className="mr-1 h-3 w-3" />Suspend</>}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BroadcastPanel() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!title || !body) return;
    setLoading(true);
    try {
      const count = await sendBroadcast(title, body, audience);
      toast.success(`Broadcast sent to ${count} ${audience === "all" ? "users" : audience + "s"}`);
      setTitle(""); setBody("");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-lg font-semibold">Send a broadcast notification</h2>
      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Audience</label>
        <Select value={audience} onValueChange={setAudience}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            <SelectItem value="employee">Employees</SelectItem>
            <SelectItem value="employer">Employers</SelectItem>
            <SelectItem value="provider">Providers</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="Message body…" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
      <Button onClick={send} disabled={loading || !title || !body}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Megaphone className="mr-2 h-4 w-4" />}
        Send broadcast
      </Button>
    </div>
  );
}

function AnalyticsPanel() {
  const { formatPrice } = useI18n();
  const q = useQuery({ queryKey: ["platform-stats"], queryFn: platformStats });
  if (q.isLoading) return <Skeleton className="h-40 rounded-2xl" />;
  const s = q.data!;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total users" value={s.users.toLocaleString()} />
      <StatCard label="Providers" value={s.providers.toLocaleString()} />
      <StatCard label="Live offers" value={s.offers.toLocaleString()} />
      <StatCard label="Simulated GMV" value={formatPrice(s.gmv)} />
      <StatCard label="Transactions" value={s.transactions.toLocaleString()} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}
