import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MarketingNav, MarketingFooter } from "@/components/marketing/marketing-shell";

export const Route = createFileRoute("/drops")({
  head: () => ({
    meta: [
      { title: "Packages · Perkly" },
      { name: "description", content: "Limited-time benefit packages curated by season." },
      { property: "og:title", content: "Packages · Perkly" },
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
