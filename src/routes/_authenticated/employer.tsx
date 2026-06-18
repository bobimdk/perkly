import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Users, Plus, Check, X, Loader2, Trash2, Hourglass, Wallet, ChevronDown, Package as PackageIcon } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ConciergeOrb } from "@/components/concierge/concierge-orb";
import { EmployerAIInsights } from "@/components/insights/employer-insights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
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
  head: () => ({ meta: [{ title: "Employer · Perkly" }] }),
  component: EmployerPage,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
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
    <DashboardShell title="Employer dashboard">
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
  const [budget, setBudget] = useState(5000);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("companies").insert({
      owner_id: user.id, name: name.trim(), slug, industry, city,
      monthly_default_budget_all: budget,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Company created!");
    onCreated();
  };

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-border bg-card p-10">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Building2 className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-display text-2xl font-bold">Set up your company</h2>
      <p className="mt-1 text-sm text-muted-foreground">Add your team in seconds — invite employees and start funding their perks.</p>
      <div className="mt-6 space-y-3">
        <div className="space-y-1.5"><Label>Company name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bunker SH.P.K" /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Industry</Label><Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Software, Retail…" /></div>
          <div className="space-y-1.5"><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label>Default monthly budget per employee (ALL)</Label><Input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} /></div>
        <Button onClick={save} disabled={saving || !name.trim()} className="w-full">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Create company
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

  const totals = useMemo(() => {
    const employees = employeesQuery.data ?? [];
    const reqs = allRequestsQuery.data ?? [];
    return {
      employees: employees.filter((e) => e.status !== "removed").length,
      pending: pendingQuery.data?.length ?? 0,
      monthlySpend: reqs.filter((r) => r.status === "fulfilled" || r.status === "approved").reduce((s, r) => s + Number(r.total_all), 0),
    };
  }, [employeesQuery.data, allRequestsQuery.data, pendingQuery.data]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={<Building2 />} label="Company" value={company.name} />
        <StatCard icon={<Users />} label="Employees" value={String(totals.employees)} />
        <StatCard icon={<Hourglass />} label="Pending" value={String(totals.pending)} />
        <StatCard icon={<Wallet />} label="Monthly spend" value={`${Math.round(totals.monthlySpend).toLocaleString()} ALL`} />
      </div>

      <Tabs defaultValue="approvals">
        <TabsList>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="rules">Auto-approval rules</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
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
    return <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">No pending approvals. ✨</div>;
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
            <p className="text-xs text-muted-foreground">{r.packages?.name ?? "Single benefit"} · {new Date(r.created_at).toLocaleDateString()}</p>
            {r.note ? <p className="mt-1 text-sm text-foreground/80">"{r.note}"</p> : null}
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-bold text-primary">{formatPrice(Number(r.total_all))}</p>
            {r.auto_approved ? <p className="text-[10px] uppercase tracking-wider text-success">auto eligible</p> : null}
          </div>
          <Button size="sm" variant="outline" onClick={async () => {
            const reason = prompt("Reason for rejection?") ?? "Not approved.";
            try { await rejectRequest(r.id, reason); toast.success("Rejected"); onChanged(); }
            catch (e) { toast.error((e as Error).message); }
          }}><X className="mr-1 h-4 w-4" /> Reject</Button>
          <Button size="sm" onClick={async () => {
            try { await approveRequest(r.id); toast.success("Approved & paid out"); onChanged(); }
            catch (e) { toast.error((e as Error).message); }
          }}><Check className="mr-1 h-4 w-4" /> Approve</Button>
        </li>
      ))}
    </ul>
  );
}

function EmployeesTable({ company, loading, employees, onChanged }: { company: Company; loading: boolean; employees: CompanyEmployee[]; onChanged: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!email.trim()) return;
    setAdding(true);
    // Try to find an existing user by email via profiles
    const { data: profile } = await supabase.from("profiles").select("id").eq("email", email.trim()).maybeSingle();
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
    toast.success(profile?.id ? "Employee linked" : "Invite saved (will activate on signup)");
    onChanged();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <Input placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
        <Button onClick={add} disabled={adding || !email.trim()}>
          {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Add
        </Button>
      </div>

      {loading ? <Skeleton className="h-40 rounded-2xl" /> : employees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">No employees yet — add the first one above.</div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {employees.map((e) => (
            <li key={e.id} className="flex items-center gap-4 p-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-bold">
                {(e.full_name?.[0] ?? e.invite_email?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.full_name ?? e.invite_email}</p>
                <p className="truncate text-xs text-muted-foreground">{e.invite_email} {e.department ? `· ${e.department}` : ""}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                e.status === "active" ? "bg-success/15 text-success" : e.status === "pending" ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground"
              }`}>{e.status}</span>
              <Button size="icon" variant="ghost" onClick={async () => {
                if (!confirm("Remove this employee?")) return;
                await supabase.from("company_employees").delete().eq("id", e.id);
                onChanged();
              }}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AutoRules({ company, rules, onChanged }: { company: Company; rules: ReturnType<typeof Object>; onChanged: () => void }) {
  const [name, setName] = useState("");
  const [maxAmount, setMaxAmount] = useState(2000);
  return (
    <div className="space-y-4">
      <Dialog>
        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New rule</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Create auto-approval rule</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Rule name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Small perks under 2000 ALL" /></div>
            <div className="space-y-1.5"><Label>Max amount (ALL)</Label><Input type="number" value={maxAmount} onChange={(e) => setMaxAmount(Number(e.target.value))} /></div>
          </div>
          <DialogFooter>
            <Button onClick={async () => {
              const { error } = await supabase.from("auto_approval_rules").insert({ company_id: company.id, name: name || `Up to ${maxAmount} ALL`, max_amount_all: maxAmount });
              if (error) return toast.error(error.message);
              toast.success("Rule created");
              setName(""); setMaxAmount(2000);
              onChanged();
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(rules as Array<{ id: string; name: string; max_amount_all: number; is_active: boolean }>).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No rules yet. Add one to auto-approve small requests instantly.
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {(rules as Array<{ id: string; name: string; max_amount_all: number; is_active: boolean }>).map((r) => (
            <li key={r.id} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-display font-semibold">{r.name}</p>
                <p className="text-xs text-muted-foreground">Auto-approve up to {r.max_amount_all.toLocaleString()} ALL</p>
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
  if (requests.length === 0) return <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No history yet.</p>;
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
          }`}>{r.status}</span>
        </li>
      ))}
    </ul>
  );
}
