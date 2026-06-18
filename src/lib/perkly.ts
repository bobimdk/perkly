import { supabase } from "@/integrations/supabase/client";

export type Company = {
  id: string; owner_id: string; name: string; slug: string; logo_url: string | null;
  industry: string | null; city: string | null; size_label: string | null;
  monthly_default_budget_all: number; currency: string;
};

export type CompanyEmployee = {
  id: string; company_id: string; user_id: string | null; invite_email: string | null;
  full_name: string | null; department: string | null;
  status: "pending" | "active" | "removed"; monthly_budget_all: number | null;
};

export type EmployeeBudget = {
  id: string; user_id: string; company_id: string; period_start: string; period_end: string;
  total_all: number; used_all: number;
};

export type PackageRow = {
  id: string; user_id: string; company_id: string | null; name: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "fulfilled" | "cancelled";
  total_all: number; created_at: string;
};

export type PackageItem = {
  id: string; package_id: string; offer_id: string; provider_id: string;
  quantity: number; unit_price_all: number;
  offers?: { id: string; title: string; slug: string; cover_url: string | null; city: string | null } | null;
  providers?: { id: string; name: string; logo_url: string | null } | null;
};

export type BenefitRequest = {
  id: string; user_id: string; company_id: string; package_id: string | null;
  total_all: number; note: string | null; status: "pending"|"approved"|"rejected"|"cancelled"|"fulfilled";
  decided_by: string | null; decided_at: string | null; reject_reason: string | null;
  auto_approved: boolean; created_at: string;
  profiles?: { first_name: string | null; last_name: string | null; email: string | null } | null;
  packages?: { id: string; name: string } | null;
};

export type Transaction = {
  id: string; request_id: string; user_id: string; company_id: string; provider_id: string;
  offer_id: string | null; amount_all: number; status: string; reference: string | null; created_at: string;
  redeemed_at?: string | null; redeemed_by?: string | null;
  providers?: { name: string; logo_url: string | null } | null;
  offers?: { title: string; slug: string } | null;
};

export async function redeemTransaction(reference: string) {
  const { data, error } = await supabase.rpc("redeem_transaction", { _reference: reference });
  if (error) throw error;
  return data as Transaction;
}

export type Notification = {
  id: string; user_id: string; kind: string; title: string; body: string | null;
  href: string | null; is_read: boolean; created_at: string;
};

export type AutoApprovalRule = {
  id: string; company_id: string; name: string; max_amount_all: number;
  category_id: string | null; is_active: boolean;
};

// ---------- COMPANY (employer) ----------
export async function fetchMyCompany(userId: string): Promise<Company | null> {
  const { data, error } = await supabase.from("companies").select("*").eq("owner_id", userId).maybeSingle();
  if (error) throw error;
  return data as Company | null;
}

export async function fetchCompanyForEmployee(userId: string): Promise<{ company: Company; employee: CompanyEmployee } | null> {
  const { data: emp } = await supabase
    .from("company_employees").select("*").eq("user_id", userId).eq("status", "active").limit(1).maybeSingle();
  if (!emp) return null;
  const { data: company } = await supabase.from("companies").select("*").eq("id", emp.company_id).maybeSingle();
  if (!company) return null;
  return { company: company as Company, employee: emp as CompanyEmployee };
}

export async function fetchEmployees(companyId: string): Promise<CompanyEmployee[]> {
  const { data, error } = await supabase.from("company_employees").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CompanyEmployee[];
}

export async function fetchPendingRequests(companyId: string): Promise<BenefitRequest[]> {
  const { data, error } = await supabase
    .from("benefit_requests")
    .select("*, profiles:user_id(first_name,last_name,email), packages(id,name)")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as BenefitRequest[];
}

export async function fetchRequestsForCompany(companyId: string): Promise<BenefitRequest[]> {
  const { data, error } = await supabase
    .from("benefit_requests")
    .select("*, profiles:user_id(first_name,last_name,email), packages(id,name)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as BenefitRequest[];
}

export async function fetchAutoApprovalRules(companyId: string): Promise<AutoApprovalRule[]> {
  const { data, error } = await supabase.from("auto_approval_rules").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AutoApprovalRule[];
}

// ---------- BUDGETS ----------
export async function fetchCurrentBudget(userId: string, companyId: string): Promise<EmployeeBudget | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("employee_budgets")
    .select("*").eq("user_id", userId).eq("company_id", companyId)
    .lte("period_start", today).gte("period_end", today).maybeSingle();
  return (data ?? null) as EmployeeBudget | null;
}

export function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

export async function ensureMonthlyBudget(userId: string, companyId: string, totalAll: number): Promise<EmployeeBudget> {
  const { start, end } = currentMonthRange();
  const { data: existing } = await supabase.from("employee_budgets")
    .select("*").eq("user_id", userId).eq("company_id", companyId).eq("period_start", start).maybeSingle();
  if (existing) return existing as EmployeeBudget;
  const { data, error } = await supabase.from("employee_budgets")
    .insert({ user_id: userId, company_id: companyId, period_start: start, period_end: end, total_all: totalAll, used_all: 0 })
    .select("*").single();
  if (error) throw error;
  return data as EmployeeBudget;
}

// ---------- PACKAGES ----------
export async function getOrCreateDraftPackage(userId: string): Promise<PackageRow> {
  const { data: existing } = await supabase
    .from("packages").select("*").eq("user_id", userId).eq("status", "draft").maybeSingle();
  if (existing) return existing as PackageRow;
  const { data, error } = await supabase.from("packages").insert({ user_id: userId, name: "My package", status: "draft" }).select("*").single();
  if (error) throw error;
  return data as PackageRow;
}

export async function fetchPackageItems(packageId: string): Promise<PackageItem[]> {
  const { data, error } = await supabase
    .from("package_items")
    .select("*, offers(id,title,slug,cover_url,city), providers(id,name,logo_url)")
    .eq("package_id", packageId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as PackageItem[];
}

export async function addOfferToDraft(userId: string, offer: { id: string; provider_id: string; price_all: number }) {
  const pkg = await getOrCreateDraftPackage(userId);
  const { data: existing } = await supabase
    .from("package_items").select("id,quantity").eq("package_id", pkg.id).eq("offer_id", offer.id).maybeSingle();
  if (existing) {
    await supabase.from("package_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
  } else {
    await supabase.from("package_items").insert({
      package_id: pkg.id, offer_id: offer.id, provider_id: offer.provider_id,
      quantity: 1, unit_price_all: offer.price_all,
    });
  }
  return pkg;
}

export async function updateItemQuantity(itemId: string, qty: number) {
  if (qty <= 0) {
    await supabase.from("package_items").delete().eq("id", itemId);
  } else {
    await supabase.from("package_items").update({ quantity: qty }).eq("id", itemId);
  }
}

export async function submitPackage(packageId: string, note: string | null) {
  const { data, error } = await supabase.rpc("submit_benefit_request", { _package_id: packageId, _note: note ?? "" });
  if (error) throw error;
  return data;
}

export async function approveRequest(requestId: string) {
  const { data, error } = await supabase.rpc("approve_benefit_request", { _request_id: requestId });
  if (error) throw error;
  return data;
}

export async function rejectRequest(requestId: string, reason: string) {
  const { data, error } = await supabase.rpc("reject_benefit_request", { _request_id: requestId, _reason: reason });
  if (error) throw error;
  return data;
}

// ---------- TRANSACTIONS / NOTIFICATIONS ----------
export async function fetchMyTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions").select("*, providers(name,logo_url), offers(title,slug)")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as Transaction[];
}

export async function fetchProviderTransactions(providerId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions").select("*, offers(title,slug)")
    .eq("provider_id", providerId).order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as Transaction[];
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function markNotificationRead(id: string) {
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
}
