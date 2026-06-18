import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MarketingNav, MarketingFooter } from "@/components/marketing/marketing-shell";

export const Route = createFileRoute("/drops")({
  head: () => ({
    meta: [
      { title: "Seasonal Drops · Perkly" },
      { name: "description", content: "Limited-time benefit collections curated by season." },
      { property: "og:title", content: "Seasonal Drops · Perkly" },
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
