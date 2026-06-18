import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, PlaceholderCard } from "@/components/dashboard/dashboard-shell";

export const Route = createFileRoute("/_authenticated/provider")({
  head: () => ({ meta: [{ title: "Provider · Perkly" }] }),
  component: () => (
    <DashboardShell title="Provider workspace">
      <div className="grid gap-6 md:grid-cols-2">
        <PlaceholderCard phase="Phase 2" title="Manage offers" description="Create offers with images, availability, capacity and pricing in ALL/EUR." />
        <PlaceholderCard phase="Phase 2" title="Performance analytics" description="Views, saves, requests, revenue — with charts." />
        <PlaceholderCard phase="Phase 3" title="Simulated payouts" description="Track every package payment splitting in your favor." />
        <PlaceholderCard phase="Phase 4" title="AI improvement tips" description="'Adding a photo increases views by 40%' — and more." />
      </div>
    </DashboardShell>
  ),
});
