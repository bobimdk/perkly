import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { resolveChatModel } from "@/lib/gemini.server";

type InsightsInput = { companyId: string };

export const generateEmployerInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as InsightsInput;
    if (!i || typeof i.companyId !== "string") throw new Error("companyId required");
    return { companyId: i.companyId };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // verify ownership
    const { data: company } = await supabase
      .from("companies")
      .select("id, name, owner_id, monthly_default_budget_all")
      .eq("id", data.companyId)
      .maybeSingle();
    if (!company || company.owner_id !== userId) throw new Error("forbidden");

    // pull aggregates
    const [employees, requests, transactions, budgets] = await Promise.all([
      supabase.from("company_employees").select("id, status").eq("company_id", data.companyId),
      supabase
        .from("benefit_requests")
        .select("id, status, total_all, auto_approved, created_at")
        .eq("company_id", data.companyId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("transactions")
        .select("amount_all, provider_id, offer_id, providers(name), offers(title, category_id, categories(name))")
        .eq("company_id", data.companyId)
        .limit(100),
      supabase
        .from("employee_budgets")
        .select("total_all, used_all")
        .eq("company_id", data.companyId),
    ]);

    const empList = employees.data ?? [];
    const reqList = requests.data ?? [];
    const txList = (transactions.data ?? []) as Array<{
      amount_all: number;
      providers: { name: string } | null;
      offers: { title: string; categories: { name: string } | null } | null;
    }>;
    const bdgList = budgets.data ?? [];

    const totalSpend = txList.reduce((s, t) => s + Number(t.amount_all), 0);
    const byCategory = new Map<string, number>();
    txList.forEach((t) => {
      const cat = t.offers?.categories?.name ?? "Other";
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + Number(t.amount_all));
    });
    const topCategories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    const totalBudget = bdgList.reduce((s, b) => s + Number(b.total_all), 0);
    const usedBudget = bdgList.reduce((s, b) => s + Number(b.used_all), 0);
    const utilization = totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;

    const stats = {
      company: company.name,
      employees: { total: empList.length, active: empList.filter((e) => e.status === "active").length },
      requests: {
        total: reqList.length,
        pending: reqList.filter((r) => r.status === "pending").length,
        approved: reqList.filter((r) => r.status === "approved" || r.status === "fulfilled").length,
        rejected: reqList.filter((r) => r.status === "rejected").length,
        autoApprovedRate:
          reqList.length === 0 ? 0 : Math.round((reqList.filter((r) => r.auto_approved).length / reqList.length) * 100),
      },
      spend: { totalAll: totalSpend, byCategory: topCategories },
      budgetUtilization: { totalAll: totalBudget, usedAll: usedBudget, pct: utilization },
    };

    const prompt = `You are an HR / benefits analyst. Look at this snapshot for "${stats.company}" and write a concise insight brief in **markdown** (no preamble, ~150 words).

Snapshot (JSON):
\`\`\`json
${JSON.stringify(stats, null, 2)}
\`\`\`

Format:
- **Headline** (one sentence summary)
- **What's working** (2 bullets)
- **What to fix** (2 bullets)
- **Recommendation** (one concrete next action this month)

Use Albanian Lek (ALL). Be specific. Don't hallucinate categories that aren't in the data.`;

    const { text } = await generateText({
      model: resolveChatModel(),
      prompt,
    });

    return { stats, insights: text };
  });
