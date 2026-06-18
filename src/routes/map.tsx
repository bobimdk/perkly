import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MarketingNav, MarketingFooter } from "@/components/marketing/marketing-shell";
import { fetchCheckIns } from "@/lib/phase5";
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

function MapPage() {
  const q = useQuery({ queryKey: ["checkins"], queryFn: () => fetchCheckIns(500) });
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  // Load Leaflet CSS once
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
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
        L.circleMarker([c.lat, c.lng], {
          radius: 8,
          color: "#f59e0b",
          fillColor: "#f59e0b",
          fillOpacity: 0.5,
          weight: 1,
        }).addTo(layerRef.current);
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
          const marker = L.circleMarker([c.lat, c.lng], {
            radius: 14,
            color: "#ef4444",
            fillColor: "#ef4444",
            fillOpacity: 0.7,
            weight: 2,
          }).addTo(layerRef.current);
          setTimeout(() => {
            marker.setStyle({ radius: 8, color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.5 });
          }, 1200);
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
          Real-time heatmap of where colleagues are using their perks across Tirana. Each pulse is a fresh check-in.
        </p>
      </div>
      <div className="mx-auto mt-6 max-w-7xl px-4 pb-12 sm:px-6">
        <div ref={mapEl} className="h-[600px] w-full rounded-3xl border border-border shadow-lg" />
      </div>
      <MarketingFooter />
    </>
  );
}
