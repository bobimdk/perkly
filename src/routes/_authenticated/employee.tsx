import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { DashboardShell, PlaceholderCard } from "@/components/dashboard/dashboard-shell";
import { useI18n } from "@/lib/i18n";
import { Wallet, ShoppingBag, Sparkles, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employee")({
  head: () => ({ meta: [{ title: "Dashboard · Perkly" }] }),
  component: EmployeeDashboard,
});

function EmployeeDashboard() {
  const { profile } = useAuth();
  const { formatPrice } = useI18n();

  return (
    <DashboardShell title={`Welcome back, ${profile?.first_name ?? "there"}`}>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Wallet} label="Available" value={formatPrice(0)} accent="from-amber-400 to-orange-500" />
        <StatCard icon={ShoppingBag} label="Used" value={formatPrice(0)} accent="from-emerald-400 to-teal-500" />
        <StatCard icon={TrendingUp} label="Remaining" value={formatPrice(0)} accent="from-sky-400 to-blue-500" />
        <StatCard icon={Sparkles} label="Active perks" value="0" accent="from-rose-400 to-pink-500" />
      </div>

      <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
          You're connected
        </p>
        <h2 className="mt-2 font-display text-xl font-bold">
          Your employer hasn't linked your account yet
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Once your employer adds you with matching name, email and phone, you'll get a notification
          to confirm — and your monthly budget will appear here instantly.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <PlaceholderCard phase="Phase 2" title="Marketplace feed" description="Browse 20+ Albanian providers, build packages, save favorites." />
        <PlaceholderCard phase="Phase 3" title="Package builder & approvals" description="Combine offers, submit for approval, watch simulated payments split." />
        <PlaceholderCard phase="Phase 4" title="AI Concierge & gamification" description="Chat with an AI shopper. Earn points, levels, mystery boxes." />
        <PlaceholderCard phase="Phase 5" title="Team circles & map" description="Join circles, gift perks, discover benefits near you." />
      </div>
    </DashboardShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${accent} text-white shadow-sm`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
