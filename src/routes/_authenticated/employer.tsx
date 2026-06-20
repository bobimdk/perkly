import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Users, Plus, Check, X, Loader2, Trash2, Hourglass, Wallet,
  ChevronDown, Package as PackageIcon, Mail,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ConciergeOrb } from "@/components/concierge/concierge-orb";
import { EmployerAIInsights } from "@/components/insights/employer-insights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  fetchMyCompany, fetchEmployees, fetchPendingRequests, fetchRequestsForCompany, fetchAutoApprovalRules,
  approveRequest, rejectRequest, ensureMonthlyBudget, fetchPackageItems,
  type Company, type CompanyEmployee, type BenefitRequest, type PackageItem,
} from "@/lib/perkly";

export const Route = createFileRoute("/_authenticated/employer")({
  head: () => ({ meta: [{ title: "Punëdhënësi · Perkly" }] }),
  component: EmployerPage,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

type CompanyInvite = {
  id: string; company_id: string; employer_id: string; email: string;
  employee_id: string | null;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  message: string | null;
  created_at: string; decided_at: string | null;
};

async function fetchCompanyInvites(companyId: string): Promise<CompanyInvite[]> {
  const { data, error } = await supabase
    .from("company_invites" as never)
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CompanyInvite[];
}

function EmployerPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const companyQuery = useQuery({
    queryKey: ["my-company", user?.id],
    queryFn: () => fetchMyCompany(user!.id),
    enabled: !!user,
  });

  return (
    <DashboardShell title="Paneli i punëdhënësit">
      {companyQuery.isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : !companyQuery.data ? (
        <CreateCompany onCreated={() => qc.invalidateQueries({ queryKey: ["my-company", user?.id] })} />
      ) : (
        <>
          <CompanyHome company={companyQuery.data} />
          <div className="mt-8">
            <EmployerAIInsights companyId={companyQuery.data.id} />
          </div>
        </>
      )}
      <ConciergeOrb />
    </DashboardShell>
  );
}

function CreateCompany({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("Tiranë");
  const [budget, setBudget] = useState<string>("5000");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("companies").insert({
      owner_id: user.id, name: name.trim(), slug, industry, city,
      monthly_default_budget_all: Number(budget) || 0,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Kompania u krijua!");
    onCreated();
  };

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-border bg-card p-10">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Building2 className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-display text-2xl font-bold">Konfiguroni kompaninë tuaj</h2>
      <p className="mt-1 text-sm text-muted-foreground">Shtoni ekipin tuaj në sekonda — ftoni punonjësit dhe filloni të financoni përfitimet e tyre.</p>
      <div className="mt-6 space-y-3">
        <div className="space-y-1.5"><Label>Emri i kompanisë</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="p.sh. Bunker SH.P.K" /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Industria</Label><Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Software, Tregti…" /></div>
          <div className="space-y-1.5"><Label>Qyteti</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label>Buxheti i parazgjedhur mujor për punonjës (ALL)</Label><Input type="number" inputMode="numeric" min={0} placeholder="0" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
        <Button onClick={save} disabled={saving || !name.trim()} className="w-full">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Krijo kompaninë
        </Button>
      </div>
    </div>
  );
}

function CompanyHome({ company }: { company: Company }) {
  const qc = useQueryClient();
  const employeesQuery = useQuery({ queryKey: ["employees", company.id], queryFn: () => fetchEmployees(company.id) });
  const pendingQuery = useQuery({ queryKey: ["pending-requests", company.id], queryFn: () => fetchPendingRequests(company.id) });
  const allRequestsQuery = useQuery({ queryKey: ["all-requests", company.id], queryFn: () => fetchRequestsForCompany(company.id) });
  const rulesQuery = useQuery({ queryKey: ["auto-rules", company.id], queryFn: () => fetchAutoApprovalRules(company.id) });
  const invitesQuery = useQuery({ queryKey: ["company-invites", company.id], queryFn: () => fetchCompanyInvites(company.id) });

  // Realtime: keep employees, invites, requests in sync
  useEffect(() => {
    const ch = supabase
      .channel(`employer-${company.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "company_invites", filter: `company_id=eq.${company.id}` },
        () => qc.invalidateQueries({ queryKey: ["company-invites", company.id] }))
      .on("postgres_changes",
        { event: "*", schema: "public", table: "company_employees", filter: `company_id=eq.${company.id}` },
        () => qc.invalidateQueries({ queryKey: ["employees", company.id] }))
      .on("postgres_changes",
        { event: "*", schema: "public", table: "benefit_requests", filter: `company_id=eq.${company.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["pending-requests", company.id] });
          qc.invalidateQueries({ queryKey: ["all-requests", company.id] });
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [company.id, qc]);

  const totals = useMemo(() => {
    const employees = employeesQuery.data ?? [];
    const reqs = allRequestsQuery.data ?? [];
    return {
      employees: employees.filter((e) => e.status !== "removed").length,
      pending: pendingQuery.data?.length ?? 0,
      pendingInvites: (invitesQuery.data ?? []).filter((i) => i.status === "pending").length,
      monthlySpend: reqs.filter((r) => r.status === "fulfilled" || r.status === "approved").reduce((s, r) => s + Number(r.total_all), 0),
    };
  }, [employeesQuery.data, allRequestsQuery.data, pendingQuery.data, invitesQuery.data]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={<Building2 />} label="Kompania" value={company.name} />
        <StatCard icon={<Users />} label="Punonjës" value={String(totals.employees)} />
        <StatCard icon={<Hourglass />} label="Në pritje" value={String(totals.pending + totals.pendingInvites)} />
        <StatCard icon={<Wallet />} label="Shpenzimet mujore" value={`${Math.round(totals.monthlySpend).toLocaleString()} ALL`} />
      </div>

      <Tabs defaultValue="approvals">
        <TabsList>
          <TabsTrigger value="approvals">Miratimet</TabsTrigger>
          <TabsTrigger value="employees">Punonjësit</TabsTrigger>
          <TabsTrigger value="invites">Ftesat</TabsTrigger>
          <TabsTrigger value="rules">Rregullat e auto-miratimit</TabsTrigger>
          <TabsTrigger value="history">Historiku</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="mt-6">
          <ApprovalCenter
            loading={pendingQuery.isLoading}
            requests={pendingQuery.data ?? []}
            onChanged={() => {
              qc.invalidateQueries({ queryKey: ["pending-requests", company.id] });
              qc.invalidateQueries({ queryKey: ["all-requests", company.id] });
            }}
          />
        </TabsContent>

        <TabsContent value="employees" className="mt-6">
          <EmployeesTable
            company={company}
            loading={employeesQuery.isLoading}
            employees={employeesQuery.data ?? []}
            requests={allRequestsQuery.data ?? []}
            onChanged={() => {
              qc.invalidateQueries({ queryKey: ["employees", company.id] });
              qc.invalidateQueries({ queryKey: ["pending-requests", company.id] });
              qc.invalidateQueries({ queryKey: ["all-requests", company.id] });
            }}
          />
        </TabsContent>

        <TabsContent value="invites" className="mt-6">
          <InvitesPanel
            company={company}
            loading={invitesQuery.isLoading}
            invites={invitesQuery.data ?? []}
            onChanged={() => qc.invalidateQueries({ queryKey: ["company-invites", company.id] })}
          />
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <AutoRules
            company={company}
            rules={rulesQuery.data ?? []}
            onChanged={() => qc.invalidateQueries({ queryKey: ["auto-rules", company.id] })}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <HistoryTable loading={allRequestsQuery.isLoading} requests={allRequestsQuery.data ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        <p className="font-mono text-[10px] uppercase tracking-widest">{label}</p>
      </div>
      <p className="mt-2 font-display text-xl font-bold truncate">{value}</p>
    </div>
  );
}

function ApprovalCenter({ loading, requests, onChanged }: { loading: boolean; requests: BenefitRequest[]; onChanged: () => void }) {
  const { formatPrice } = useI18n();
  if (loading) return <Skeleton className="h-40 rounded-2xl" />;
  if (requests.length === 0) {
    return <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">Nuk ka miratime në pritje. ✨</div>;
  }
  return (
    <ul className="space-y-3">
      {requests.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 font-display font-bold text-primary">
            {(r.profiles?.first_name?.[0] ?? r.profiles?.email?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold">
              {r.profiles?.first_name} {r.profiles?.last_name} <span className="text-muted-foreground font-mono text-xs">{r.profiles?.email}</span>
            </p>
            <p className="text-xs text-muted-foreground">{r.packages?.name ?? "Përfitim i vetëm"} · {new Date(r.created_at).toLocaleDateString()}</p>
            {r.note ? <p className="mt-1 text-sm text-foreground/80">"{r.note}"</p> : null}
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-bold text-primary">{formatPrice(Number(r.total_all))}</p>
            {r.auto_approved ? <p className="text-[10px] uppercase tracking-wider text-success">i pranueshëm automatikisht</p> : null}
          </div>
          <Button size="sm" variant="outline" onClick={async () => {
            const reason = prompt("Arsyeja e refuzimit?") ?? "Nuk u miratua.";
            try { await rejectRequest(r.id, reason); toast.success("U refuzua"); onChanged(); }
            catch (e) { toast.error((e as Error).message); }
          }}><X className="mr-1 h-4 w-4" /> Refuzo</Button>
          <Button size="sm" onClick={async () => {
            try { await approveRequest(r.id); toast.success("U miratua dhe u pagua"); onChanged(); }
            catch (e) { toast.error((e as Error).message); }
          }}><Check className="mr-1 h-4 w-4" /> Mirato</Button>
        </li>
      ))}
    </ul>
  );
}

function InvitesPanel({ company, loading, invites, onChanged }: {
  company: Company; loading: boolean; invites: CompanyInvite[]; onChanged: () => void;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const e = email.trim().toLowerCase();
    if (!e) return;
    setSending(true);
    const { error } = await supabase.from("company_invites" as never).insert({
      company_id: company.id,
      employer_id: (await supabase.auth.getUser()).data.user?.id,
      email: e,
      message: message || null,
    } as never);
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Ftesa u dërgua");
    setEmail(""); setMessage("");
    onChanged();
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.from("company_invites" as never)
      .update({ status: "cancelled", decided_at: new Date().toISOString() } as never)
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Ftesa u anulua");
    onChanged();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("company_invites" as never).delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChanged();
  };

  const badge = (s: CompanyInvite["status"]) => {
    if (s === "accepted") return "bg-success/15 text-success";
    if (s === "pending") return "bg-warning/15 text-warning-foreground";
    if (s === "rejected") return "bg-destructive/15 text-destructive";
    return "bg-muted text-muted-foreground";
  };
  const label = (s: CompanyInvite["status"]) =>
    s === "accepted" ? "E pranuar"
    : s === "pending" ? "Në pritje"
    : s === "rejected" ? "E refuzuar"
    : "E anuluar";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="font-display font-semibold">Dërgo ftesë te një punonjës</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Vendosni email-in. Nëse personi ka tashmë llogari Perkly, do të marrë njoftim menjëherë.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="email@kompani.al" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Mesazh opsional" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button onClick={send} disabled={sending || !email.trim()}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />} Dërgo ftesën
          </Button>
        </div>
      </div>

      {loading ? <Skeleton className="h-40 rounded-2xl" /> : invites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nuk ka ftesa ende. Dërgo të parën më sipër.
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {invites.map((i) => (
            <li key={i.id} className="flex items-center gap-4 p-3 text-sm">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-bold">
                {(i.email?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{i.email}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Dërguar {new Date(i.created_at).toLocaleString()}
                  {i.decided_at ? ` · përditësuar ${new Date(i.decided_at).toLocaleString()}` : ""}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${badge(i.status)}`}>
                {label(i.status)}
              </span>
              {i.status === "pending" ? (
                <Button size="sm" variant="outline" onClick={() => cancel(i.id)}>Anulo</Button>
              ) : (
                <Button size="icon" variant="ghost" onClick={() => remove(i.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmployeesTable({ company, loading, employees, requests, onChanged }: {
  company: Company; loading: boolean; employees: CompanyEmployee[]; requests: BenefitRequest[]; onChanged: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [removing, setRemoving] = useState<CompanyEmployee | null>(null);

  const add = async () => {
    if (!email.trim()) return;
    setAdding(true);
    const { data: foundUserId } = await supabase.rpc("find_user_id_by_email" as any, { _email: email.trim() });
    const profile = foundUserId ? { id: foundUserId as unknown as string } : null;
    const payload = {
      company_id: company.id,
      invite_email: email.trim(),
      full_name: name || null,
      department: department || null,
      user_id: profile?.id ?? null,
      status: (profile?.id ? "active" : "pending") as "pending" | "active",
      monthly_budget_all: company.monthly_default_budget_all,
    };
    const { error } = await supabase.from("company_employees").insert(payload);
    if (error) { setAdding(false); return toast.error(error.message); }
    if (profile?.id) {
      try { await ensureMonthlyBudget(profile.id, company.id, company.monthly_default_budget_all); } catch {}
    }
    setAdding(false);
    setEmail(""); setName(""); setDepartment("");
    toast.success(profile?.id ? "Punonjësi u lidh me kompaninë" : "Ftesa u ruajt (do të aktivizohet pas regjistrimit)");
    onChanged();
  };

  const confirmRemove = async () => {
    if (!removing) return;
    const { error } = await supabase.from("company_employees").delete().eq("id", removing.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Punonjësi u hoq");
    setRemoving(null);
    onChanged();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <Input placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Emri i plotë" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Departamenti" value={department} onChange={(e) => setDepartment(e.target.value)} />
        <Button onClick={add} disabled={adding || !email.trim()}>
          {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Shto
        </Button>
      </div>

      {loading ? <Skeleton className="h-40 rounded-2xl" /> : employees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">Ende pa punonjës — shtoni të parin më sipër ose përdorni ftesat.</div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {employees.map((e) => {
            const empRequests = requests.filter((r) => r.user_id === e.user_id);
            const pendingCount = empRequests.filter((r) => r.status === "pending").length;
            const isOpen = expanded === e.id;
            const statusLabel =
              e.status === "active" ? "aktiv"
              : e.status === "pending" ? "në pritje"
              : "i hequr";
            return (
              <li key={e.id} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : e.id)}
                  className="flex items-center gap-4 p-3 text-left hover:bg-muted/40 transition"
                >
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-bold">
                    {(e.full_name?.[0] ?? e.invite_email?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.full_name ?? e.invite_email}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.invite_email} {e.department ? `· ${e.department}` : ""}</p>
                  </div>
                  {pendingCount > 0 && (
                    <span className="rounded-full bg-warning/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-warning-foreground">
                      {pendingCount} në pritje
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                    e.status === "active" ? "bg-success/15 text-success" : e.status === "pending" ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground"
                  }`}>{statusLabel}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(ev) => { ev.stopPropagation(); setRemoving(e); }}
                    className="grid h-8 w-8 place-items-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-dashed border-border bg-muted/20 p-4">
                    {empRequests.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Ky punonjës nuk ka paraqitur ende pakete.</p>
                    ) : (
                      <div className="space-y-3">
                        {empRequests.map((r) => (
                          <EmployeeRequestCard key={r.id} request={r} onChanged={onChanged} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmo heqjen</AlertDialogTitle>
            <AlertDialogDescription>
              {removing
                ? `A jeni i sigurt që dëshironi të hiqni ${removing.full_name?.trim() || removing.invite_email || "këtë punonjës"} nga biznesi juaj?`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulo</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hiq punonjësin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmployeeRequestCard({ request, onChanged }: { request: BenefitRequest; onChanged: () => void }) {
  const { formatPrice } = useI18n();
  const [busy, setBusy] = useState(false);
  const itemsQuery = useQuery({
    queryKey: ["package-items", request.package_id],
    queryFn: () => request.package_id ? fetchPackageItems(request.package_id) : Promise.resolve([] as PackageItem[]),
    enabled: !!request.package_id,
  });
  const items = itemsQuery.data ?? [];
  const statusColor =
    request.status === "fulfilled" || request.status === "approved" ? "bg-success/15 text-success"
    : request.status === "pending" ? "bg-warning/15 text-warning-foreground"
    : "bg-destructive/15 text-destructive";
  const statusLabel =
    request.status === "fulfilled" ? "i përfunduar"
    : request.status === "approved" ? "i miratuar"
    : request.status === "pending" ? "në pritje"
    : request.status === "rejected" ? "i refuzuar"
    : request.status;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <PackageIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold">{request.packages?.name ?? "Paketë"}</p>
          <p className="text-xs text-muted-foreground">
            Paraqitur më {new Date(request.created_at).toLocaleDateString()}
            {request.note ? ` · "${request.note}"` : ""}
          </p>
        </div>
        <p className="font-display text-lg font-bold text-primary">{formatPrice(Number(request.total_all))}</p>
        <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {items.length > 0 && (
        <ul className="mt-3 divide-y divide-border/60 rounded-lg border border-border/60 bg-muted/30">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 p-2.5 text-sm">
              {it.offers?.cover_url ? (
                <img src={it.offers.cover_url} alt="" className="h-10 w-10 rounded-md object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-md bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{it.offers?.title ?? "Oferta"}</p>
                <p className="truncate text-xs text-muted-foreground">{it.providers?.name} {it.offers?.city ? `· ${it.offers.city}` : ""}</p>
              </div>
              <span className="font-mono text-xs text-muted-foreground">×{it.quantity}</span>
              <span className="font-display font-semibold">{formatPrice(Number(it.unit_price_all) * it.quantity)}</span>
            </li>
          ))}
        </ul>
      )}

      {request.status === "pending" && (
        <div className="mt-3 flex justify-end gap-2">
          <Button size="sm" variant="outline" disabled={busy} onClick={async () => {
            const reason = prompt("Arsyeja e refuzimit?") ?? "Nuk u miratua.";
            setBusy(true);
            try { await rejectRequest(request.id, reason); toast.success("U refuzua"); onChanged(); }
            catch (e) { toast.error((e as Error).message); }
            finally { setBusy(false); }
          }}><X className="mr-1 h-4 w-4" /> Refuzo</Button>
          <Button size="sm" disabled={busy} onClick={async () => {
            setBusy(true);
            try { await approveRequest(request.id); toast.success("U miratua — bilanci i punonjësit u përditësua"); onChanged(); }
            catch (e) { toast.error((e as Error).message); }
            finally { setBusy(false); }
          }}><Check className="mr-1 h-4 w-4" /> Mirato dhe paguaj</Button>
        </div>
      )}
    </div>
  );
}

function AutoRules({ company, rules, onChanged }: { company: Company; rules: ReturnType<typeof Object>; onChanged: () => void }) {
  const [name, setName] = useState("");
  const [maxAmount, setMaxAmount] = useState<string>("2000");
  return (
    <div className="space-y-4">
      <Dialog>
        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Rregull i ri</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Krijo rregull auto-miratimi</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Emri i rregullit</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Përfitime të vogla nën 2000 ALL" /></div>
            <div className="space-y-1.5"><Label>Shuma maksimale (ALL)</Label><Input type="number" inputMode="numeric" min={0} placeholder="0" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button onClick={async () => {
              const maxAmountNum = Number(maxAmount) || 0;
              const { error } = await supabase.from("auto_approval_rules").insert({ company_id: company.id, name: name || `Deri në ${maxAmountNum} ALL`, max_amount_all: maxAmountNum });
              if (error) return toast.error(error.message);
              toast.success("Rregulli u krijua");
              setName(""); setMaxAmount("2000");
              onChanged();
            }}>Ruaj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(rules as Array<{ id: string; name: string; max_amount_all: number; is_active: boolean }>).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nuk ka rregulla ende. Shtoni një për të miratuar automatikisht kërkesat e vogla.
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {(rules as Array<{ id: string; name: string; max_amount_all: number; is_active: boolean }>).map((r) => (
            <li key={r.id} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-display font-semibold">{r.name}</p>
                <p className="text-xs text-muted-foreground">Auto-mirato deri në {r.max_amount_all.toLocaleString()} ALL</p>
              </div>
              <Switch checked={r.is_active} onCheckedChange={async (v) => {
                await supabase.from("auto_approval_rules").update({ is_active: v }).eq("id", r.id);
                onChanged();
              }} />
              <Button size="icon" variant="ghost" onClick={async () => {
                await supabase.from("auto_approval_rules").delete().eq("id", r.id);
                onChanged();
              }}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HistoryTable({ loading, requests }: { loading: boolean; requests: BenefitRequest[] }) {
  const { formatPrice } = useI18n();
  if (loading) return <Skeleton className="h-40 rounded-2xl" />;
  if (requests.length === 0) return <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Nuk ka historik ende.</p>;
  const label = (s: string) =>
    s === "fulfilled" ? "i përfunduar"
    : s === "approved" ? "i miratuar"
    : s === "pending" ? "në pritje"
    : s === "rejected" ? "i refuzuar"
    : s;
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {requests.map((r) => (
        <li key={r.id} className="flex items-center gap-4 p-3 text-sm">
          <span className="font-mono text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate">{r.profiles?.first_name} {r.profiles?.last_name}</p>
            <p className="truncate text-xs text-muted-foreground">{r.packages?.name}</p>
          </div>
          <span className="font-display font-semibold">{formatPrice(Number(r.total_all))}</span>
          <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
            r.status === "fulfilled" || r.status === "approved" ? "bg-success/15 text-success"
            : r.status === "pending" ? "bg-warning/15 text-warning-foreground"
            : "bg-destructive/15 text-destructive"
          }`}>{label(r.status)}</span>
        </li>
      ))}
    </ul>
  );
}
