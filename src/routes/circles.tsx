import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MarketingNav, MarketingFooter } from "@/components/marketing/marketing-shell";

export const Route = createFileRoute("/circles")({
  head: () => ({
    meta: [
      { title: "Benefit Circles · Perkly" },
      { name: "description", content: "Join interest-based circles, chat with colleagues, and unlock group benefits." },
      { property: "og:title", content: "Benefit Circles · Perkly" },
      { property: "og:description", content: "Runners, gym lovers, travelers — find your people on Perkly." },
    ],
  }),
  component: () => (
    <div className="min-h-screen">
      <MarketingNav />
      <Outlet />
      <MarketingFooter />
    </div>
  ),
});
