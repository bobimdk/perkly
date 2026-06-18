import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MarketingNav, MarketingFooter } from "@/components/marketing/marketing-shell";
import { fetchCheckIns } from "@/lib/phase5";
import { imageFor, CATEGORY_IMAGE, DEFAULT_BUSINESS_IMAGE } from "@/lib/category-images";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Benefits Near Me · Perkly" },
      { name: "description", content: "Live heatmap of perks happening around you." },
      { property: "og:title", content: "Benefits Near Me · Perkly" },
      { property: "og:description", content: "Real-time map of where colleagues are using their benefits." },
    ],
  }),
  component: MapPage,
});

function buildIcon(L: any, imgUrl: string, pulse = false) {
  const html = `
    <div class="perk-pin ${pulse ? "perk-pin-pulse" : ""}">
      <div class="perk-pin-ring"></div>
      <img src="${imgUrl}" referrerpolicy="no-referrer" onerror="this.src='${DEFAULT_BUSINESS_IMAGE}'" />
    </div>`;
  return L.divIcon({
    html,
    className: "perk-pin-wrap",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

function MapPage() {
  const q = useQuery({ queryKey: ["checkins"], queryFn: () => fetchCheckIns(500) });
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  // Load Leaflet CSS + custom pin styles once
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("perk-pin-css")) {
      const style = document.createElement("style");
      style.id = "perk-pin-css";
      style.innerHTML = `
        .perk-pin-wrap { background: transparent !important; border: 0 !important; }
        .perk-pin { position: relative; width: 48px; height: 48px; }
        .perk-pin img {
          position: absolute; inset: 6px; width: 36px; height: 36px;
          border-radius: 9999px; object-fit: cover;
          border: 2px solid #fff; box-shadow: 0 4px 14px rgba(245,158,11,.45);
          background: #fff;
        }
        .perk-pin-ring {
          position: absolute; inset: 0; border-radius: 9999px;
          background: radial-gradient(circle, rgba(245,158,11,.55) 0%, rgba(245,158,11,0) 70%);
        }
        .perk-pin-pulse .perk-pin-ring {
          animation: perk-pulse 1.4s ease-out infinite;
          background: radial-gradient(circle, rgba(239,68,68,.7) 0%, rgba(239,68,68,0) 70%);
        }
        @keyframes perk-pulse {
          0%   { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !mapEl.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      const map = L.map(mapEl.current).setView([41.3275, 19.8189], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current || !q.data) return;
    (async () => {
      const L = (await import("leaflet")).default;
      layerRef.current.clearLayers();
      for (const c of q.data) {
        const icon = buildIcon(L, imageFor(c));
        L.marker([c.lat, c.lng], { icon })
          .addTo(layerRef.current)
          .bindPopup(
            `<strong>${c.provider_name ?? "Perk check-in"}</strong>` +
            (c.category_slug ? `<br/><span style="opacity:.7;text-transform:uppercase;font-size:10px;letter-spacing:1px">${c.category_slug}</span>` : "")
          );
      }
    })();
  }, [q.data]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("checkins-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "perk_checkins" },
        async (payload) => {
          if (!layerRef.current) return;
          const L = (await import("leaflet")).default;
          const c = payload.new as any;
          // Look up provider for richer marker, fallback to default.
          const { data: prov } = await supabase
            .from("providers")
            .select("name, logo_url, offers(categories(slug))")
            .eq("id", c.provider_id)
            .maybeSingle();
          const cat = (prov as any)?.offers?.[0]?.categories?.slug ?? null;
          const img = (prov as any)?.logo_url
            || (cat ? CATEGORY_IMAGE[cat] : undefined)
            || DEFAULT_BUSINESS_IMAGE;
          const marker = L.marker([c.lat, c.lng], { icon: buildIcon(L, img, true) }).addTo(layerRef.current);
          setTimeout(() => marker.setIcon(buildIcon(L, img, false)), 1800);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      <MarketingNav />
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Live</p>
        <h1 className="mt-1 font-display text-4xl font-bold">Benefits Near Me</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Real-time map of where colleagues are using their perks across Tirana. Each pin is a fresh check-in.
        </p>
      </div>
      <div className="mx-auto mt-6 max-w-7xl px-4 pb-12 sm:px-6">
        <div ref={mapEl} className="h-[600px] w-full rounded-3xl border border-border shadow-lg" />
      </div>
      <MarketingFooter />
    </>
  );
}
