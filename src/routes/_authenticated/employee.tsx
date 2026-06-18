import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Wallet, Bell, Send, Trash2, Loader2, Building2, ShoppingBag, Clock, CheckCircle2, XCircle, Plus, Minus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import {
  fetchCompanyForEmployee, fetchCurrentBudget, getOrCreateDraftPackage, fetchPackageItems,
  fetchMyTransactions, fetchNotifications, markNotificationRead,
  submitPackage, updateItemQuantity,
} from "@/lib/perkly";
import { toast } from "sonner";
import { ConciergeOrb } from "@/components/concierge/concierge-orb";
import { GamificationPanel } from "@/components/gamification/gamification-panel";
import { progressQuest } from "@/lib/gamification";
import { GiftDialog } from "@/components/employee/gift-dialog";
import { ActivityCard } from "@/components/employee/activity-card";

export const Route = createFileRoute("/_authenticated/employee")({
  head: () => ({ meta: [{ title: "My benefits · Perkly" }] }),
  component: EmployeePage,
});

function EmployeePage() {
  const { user, roles } = useAuth();
  const qc = useQueryClient();
  const { formatPrice } = useI18n();

  // If this account is actually a provider / employer / admin, send them to the right dashboard
  // instead of showing the "you're not linked to a company" screen.
  if (roles.includes("provider")) return <Navigate to="/provider" replace />;
  if (roles.includes("employer")) return <Navigate to="/employer" replace />;
  if (roles.includes("admin")) return <Navigate to="/admin" replace />;



  const companyQuery = useQuery({
    queryKey: ["my-employer", user?.id],
    queryFn: () => fetchCompanyForEmployee(user!.id),
    enabled: !!user,
  });

  const budgetQuery = useQuery({
    queryKey: ["my-budget", user?.id, companyQuery.data?.company.id],
    queryFn: () => fetchCurrentBudget(user!.id, companyQuery.data!.company.id),
    enabled: !!user && !!companyQuery.data?.company,
  });

  const draftQuery = useQuery({
    queryKey: ["draft-package", user?.id],
    queryFn: () => getOrCreateDraftPackage(user!.id),
    enabled: !!user,
  });
  const itemsQuery = useQuery({
    queryKey: ["draft-items", draftQuery.data?.id],
    queryFn: () => fetchPackageItems(draftQuery.data!.id),
    enabled: !!draftQuery.data?.id,
  });

  const txQuery = useQuery({ queryKey: ["my-transactions", user?.id], queryFn: () => fetchMyTransactions(user!.id), enabled: !!user });
  const notifQuery = useQuery({ queryKey: ["my-notifications", user?.id], queryFn: () => fetchNotifications(user!.id), enabled: !!user });

  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const budget = budgetQuery.data;
  const items = itemsQuery.data ?? [];
  const draftTotal = items.reduce((s, i) => s + Number(i.unit_price_all) * i.quantity, 0);
  const remainingBudget = budget ? Math.max(0, Number(budget.total_all) - Number(budget.used_all)) : 0;
  const budgetPct = budget && Number(budget.total_all) > 0 ? Math.min(100, Math.round((Number(budget.used_all) / Number(budget.total_all)) * 100)) : 0;

  const submit = async () => {
    if (!draftQuery.data) return;
    setSubmitting(true);
    try {
      await submitPackage(draftQuery.data.id, note);
      toast.success("Package submitted!");
      setNote("");
      if (user) progressQuest(user.id, "weekly_submit").catch(() => {});
      qc.invalidateQueries({ queryKey: ["draft-package", user?.id] });
      qc.invalidateQueries({ queryKey: ["draft-items"] });
      qc.invalidateQueries({ queryKey: ["my-budget"] });
      qc.invalidateQueries({ queryKey: ["my-transactions"] });
      qc.invalidateQueries({ queryKey: ["my-notifications"] });
      qc.invalidateQueries({ queryKey: ["stats", user?.id] });
      qc.invalidateQueries({ queryKey: ["quest-progress", user?.id] });
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(msg === "no_company" ? "Ask your employer to add you to their team first." : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell title="My benefits">
      {companyQuery.isLoading || draftQuery.isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : !companyQuery.data ? (
        <NoEmployer />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left: Budget + Package + History */}
          <div className="space-y-8">
            {/* Budget widget */}
            <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-4 w-4" />
                <p className="font-mono text-[10px] uppercase tracking-widest">Monthly budget · {companyQuery.data.company.name}</p>
              </div>
              <p className="mt-3 font-display text-4xl font-bold">{formatPrice(remainingBudget)}<span className="ml-2 text-base font-normal text-muted-foreground">remaining</span></p>
              {budget ? (
                <>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-700" style={{ width: `${budgetPct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatPrice(Number(budget.used_all))} used of {formatPrice(Number(budget.total_all))} this month
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Your employer hasn't set a budget for this period yet.</p>
              )}
            </div>

            {/* Package builder */}
            <section className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Smart package builder</p>
                  <h2 className="font-display text-xl font-bold">Your draft package</h2>
                </div>
                <Button asChild variant="outline" size="sm"><Link to="/marketplace">Add benefits</Link></Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <GiftDialog />
                <Button asChild variant="outline" size="sm"><Link to="/circles">Join a circle</Link></Button>
                <Button asChild variant="outline" size="sm"><Link to="/drops">Seasonal drops</Link></Button>
              </div>


              {items.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
                  <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-display text-base font-semibold">Your package is empty</p>
                  <p className="mt-1 text-sm text-muted-foreground">Pick benefits from the marketplace and they'll appear here.</p>
                  <Button asChild className="mt-4"><Link to="/marketplace">Browse marketplace</Link></Button>
                </div>
              ) : (
                <>
                  <ul className="mt-4 divide-y divide-border">
                    {items.map((it) => (
                      <li key={it.id} className="flex items-center gap-4 py-3">
                        <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                          {it.offers?.cover_url ? <img src={it.offers.cover_url} alt="" className="h-full w-full object-cover" /> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display font-semibold">{it.offers?.title}</p>
                          <p className="text-xs text-muted-foreground">{it.providers?.name}{it.offers?.city ? ` · ${it.offers.city}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={async () => { await updateItemQuantity(it.id, it.quantity - 1); qc.invalidateQueries({ queryKey: ["draft-items"] }); }}>
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-6 text-center text-sm font-semibold">{it.quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={async () => { await updateItemQuantity(it.id, it.quantity + 1); qc.invalidateQueries({ queryKey: ["draft-items"] }); }}>
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <span className="w-24 text-right font-display font-semibold">{formatPrice(Number(it.unit_price_all) * it.quantity)}</span>
                        <Button size="icon" variant="ghost" onClick={async () => { await updateItemQuantity(it.id, 0); qc.invalidateQueries({ queryKey: ["draft-items"] }); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 rounded-2xl bg-muted/40 p-4">
                    <div className="flex items-end justify-between">
                      <p className="font-display text-sm font-semibold">Total</p>
                      <p className="font-display text-2xl font-bold text-primary">{formatPrice(draftTotal)}</p>
                    </div>
                    {budget && draftTotal > remainingBudget ? (
                      <p className="mt-2 text-xs font-medium text-destructive">
                        This exceeds your remaining budget by {formatPrice(draftTotal - remainingBudget)} — you can still submit for approval.
                      </p>
                    ) : null}
                  </div>

                  <Textarea className="mt-4" rows={2} placeholder="Add a note for your manager (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                  <Button className="mt-3 w-full" size="lg" onClick={submit} disabled={submitting || draftTotal === 0}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit package for approval
                  </Button>
                </>
              )}
            </section>

            {/* Your activities — redeemable QR cards */}
            <section className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Your activities</p>
                  <h2 className="font-display text-xl font-bold">Approved benefits — show & scan at the venue</h2>
                </div>
              </div>
              {txQuery.isLoading ? <Skeleton className="mt-4 h-40 rounded-xl" /> : (txQuery.data ?? []).length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Once your employer approves a package, your venue passes appear here with a QR code.</p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {txQuery.data!.map((t) => <ActivityCard key={t.id} tx={t} />)}
                </div>
              )}
            </section>
          </div>

          {/* Right: company + notifications */}
          <aside className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Funded by</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
                <div>
                  <p className="font-display text-base font-semibold">{companyQuery.data.company.name}</p>
                  {companyQuery.data.company.city ? <p className="text-xs text-muted-foreground">{companyQuery.data.company.city}</p> : null}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Notifications</p></div>
              {notifQuery.isLoading ? <Skeleton className="mt-3 h-24 rounded-lg" /> : (notifQuery.data ?? []).length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">All caught up. ✨</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {notifQuery.data!.map((n) => (
                    <li key={n.id}
                      className={`rounded-xl border p-3 text-sm cursor-pointer transition-colors ${n.is_read ? "border-border bg-muted/30" : "border-primary/30 bg-primary/5"}`}
                      onClick={() => { markNotificationRead(n.id); qc.invalidateQueries({ queryKey: ["my-notifications"] }); }}
                    >
                      <div className="flex items-center gap-2">
                        {n.kind === "request_approved" ? <CheckCircle2 className="h-4 w-4 text-success" />
                          : n.kind === "request_rejected" ? <XCircle className="h-4 w-4 text-destructive" />
                          : <Bell className="h-4 w-4 text-primary" />}
                        <p className="font-display text-sm font-semibold">{n.title}</p>
                      </div>
                      {n.body ? <p className="mt-1 text-xs text-muted-foreground">{n.body}</p> : null}
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        <Clock className="mr-1 inline h-3 w-3" />{new Date(n.created_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Gamification full width */}
          <div className="lg:col-span-2">
            {user ? <GamificationPanel userId={user.id} /> : null}
          </div>
        </div>
      )}
      <ConciergeOrb />
    </DashboardShell>
  );
}

function NoEmployer() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Building2 className="h-7 w-7" /></div>
      <h2 className="mt-4 font-display text-2xl font-bold">You're not linked to a company yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">Ask your employer to add you using the email on your profile, and your monthly budget will activate immediately.</p>
      <Button asChild className="mt-6"><Link to="/marketplace">Browse the marketplace meanwhile</Link></Button>
    </div>
  );
}
