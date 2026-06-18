import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, PlaceholderCard } from "@/components/dashboard/dashboard-shell";

export const Route = createFileRoute("/_authenticated/employer")({
  head: () => ({ meta: [{ title: "Employer · Perkly" }] }),
  component: () => (
    <DashboardShell title="Employer command center">
      <div className="grid gap-6 md:grid-cols-2">
        <PlaceholderCard phase="Phase 3" title="Add & manage employees" description="Single form + CSV bulk upload, edit budgets, watch pending invites." />
        <PlaceholderCard phase="Phase 3" title="Approval center" description="One-click approve/reject. Build auto-rules by threshold, category, employee." />
        <PlaceholderCard phase="Phase 4" title="AI insights" description="Most-requested categories, underused budgets, recommended new perks." />
        <PlaceholderCard phase="Phase 3" title="Simulated payments" description="See every approved package split instantly across providers." />
      </div>
    </DashboardShell>
  ),
});
