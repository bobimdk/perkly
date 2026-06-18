import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, PlaceholderCard } from "@/components/dashboard/dashboard-shell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin · Perkly" }] }),
  component: () => (
    <DashboardShell title="Platform admin">
      <div className="grid gap-6 md:grid-cols-2">
        <PlaceholderCard phase="Phase 2" title="Offer moderation" description="Approve / reject incoming provider offers." />
        <PlaceholderCard phase="Phase 5" title="User management" description="Search by name/email/role, suspend, export." />
        <PlaceholderCard phase="Phase 5" title="Platform analytics" description="Revenue trends, top categories, users by role." />
        <PlaceholderCard phase="Phase 5" title="System settings" description="Currencies, languages, feature flags, broadcasts." />
      </div>
    </DashboardShell>
  ),
});
