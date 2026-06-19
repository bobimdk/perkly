import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crosshair, MapPin, Navigation } from "lucide-react";
import { MarketingNav, MarketingFooter } from "@/components/marketing/marketing-shell";
import { Button } from "@/components/ui/button";
import { fetchCheckIns } from "@/lib/phase5";
import { imageFor, CATEGORY_IMAGE, DEFAULT_BUSINESS_IMAGE } from "@/lib/category-images";
import { useI18n } from "@/lib/i18n";
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

type FeaturedOffer = {
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price_all: number | null;
  price_eur: number | null;
  cover_url: string | null;
};

type ProviderPin = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  tagline: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  lat: number;
  lng: number;
  category_slug: string | null;
  featured: FeaturedOffer | null;
};

// Piramida e Tiranës — fallback "current location" when geolocation denied
const PIRAMIDA = { lat: 41.3236, lng: 19.8197 };

async function fetchProviderPins(): Promise<ProviderPin[]> {
  const { data, error } = await supabase
    .from("providers")
    .select(
      "id,name,slug,logo_url,tagline,description,address,city,lat,lng," +
        "offers(slug,title,subtitle,description,price_all,price_eur,cover_url,status,categories(slug))",
    )
    .eq("status", "active")
    .not("lat", "is", null)
    .not("lng", "is", null);
  if (error) throw error;
  return (data ?? []).map((p: any) => {
    const offers: any[] = Array.isArray(p.offers) ? p.offers : [];
    const published = offers.find((o) => o?.status === "published") ?? offers[0] ?? null;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      logo_url: p.logo_url,
      tagline: p.tagline,
      description: p.description,
      address: p.address,
      city: p.city,
      lat: Number(p.lat),
      lng: Number(p.lng),
      category_slug: published?.categories?.slug ?? null,
      featured: published
        ? {
            slug: published.slug,
            title: published.title,
            subtitle: published.subtitle ?? null,
            description: published.description ?? null,
            price_all: published.price_all ?? null,
            price_eur: published.price_eur ?? null,
            cover_url: published.cover_url ?? null,
          }
        : null,
    };
  });
}

function fmtDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

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

function buildUserIcon(L: any) {
  return L.divIcon({
    html: `<div class="perk-user-pin"><div class="perk-user-dot"></div><div class="perk-user-ring"></div></div>`,
    className: "perk-pin-wrap",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function imageForProvider(p: ProviderPin) {
  return p.logo_url
    || (p.category_slug ? CATEGORY_IMAGE[p.category_slug] : undefined)
    || DEFAULT_BUSINESS_IMAGE;
}

function MapPage() {
  const { t } = useI18n();
  const checkins = useQuery({ queryKey: ["checkins"], queryFn: () => fetchCheckIns(500) });
  const providers = useQuery({ queryKey: ["provider-pins"], queryFn: fetchProviderPins });

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  // Load Leaflet CSS + custom pin styles
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
        .perk-user-pin { position: relative; width: 28px; height: 28px; }
        .perk-user-dot {
          position: absolute; inset: 8px; width: 12px; height: 12px;
          background: #2563eb; border: 2px solid #fff; border-radius: 9999px;
          box-shadow: 0 2px 8px rgba(37,99,235,.6);
        }
        .perk-user-ring {
          position: absolute; inset: 0; border-radius: 9999px;
          background: radial-gradient(circle, rgba(37,99,235,.4) 0%, rgba(37,99,235,0) 70%);
          animation: perk-pulse 2s ease-out infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined" || !mapEl.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      const map = L.map(mapEl.current).setView([PIRAMIDA.lat, PIRAMIDA.lng], 14);
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

  // Request user location on mount
  const requestLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        setLocating(false);
        mapRef.current?.flyTo([p.lat, p.lng], 14, { duration: 1 });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render user / Pyramid marker
  useEffect(() => {
    if (!mapRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const pos = userPos ?? PIRAMIDA;
      const label = userPos ? t("map.youAreHere") : t("map.pyramid");
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([pos.lat, pos.lng]).setPopupContent(`<strong>${label}</strong>`);
      } else {
        userMarkerRef.current = L.marker([pos.lat, pos.lng], { icon: buildUserIcon(L) })
          .addTo(mapRef.current)
          .bindPopup(`<strong>${label}</strong>`);
      }
    })();
  }, [userPos, t]);

  // Render provider + checkin markers
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    const origin = userPos ?? PIRAMIDA;
    const originLabel = userPos ? t("map.yourLocation") : t("map.pyramid");
    (async () => {
      const L = (await import("leaflet")).default;
      layerRef.current.clearLayers();
      for (const p of providers.data ?? []) {
        const icon = buildIcon(L, imageForProvider(p));
        const km = distanceKm(origin, p);
        const desc =
          p.featured?.subtitle ||
          (p.featured?.description ? p.featured.description.slice(0, 140) : null) ||
          p.tagline ||
          (p.description ? p.description.slice(0, 140) : null) ||
          "";
        const priceLine =
          p.featured && (p.featured.price_all != null || p.featured.price_eur != null)
            ? `<div style="margin-top:6px;font-family:ui-monospace,monospace;font-size:11px;color:#f59e0b;font-weight:600">
                 ${p.featured.price_all != null ? `${p.featured.price_all} ALL` : ""}
                 ${p.featured.price_eur != null ? ` · €${p.featured.price_eur}` : ""}
               </div>`
            : "";
        const ctaHref = p.featured ? `/marketplace/${p.featured.slug}` : `/marketplace`;
        const html = `
          <div style="min-width:220px;max-width:260px;font-family:inherit">
            <div style="font-weight:700;font-size:14px;line-height:1.2">${escapeHtml(p.name)}</div>
            ${p.featured?.title ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">${escapeHtml(p.featured.title)}</div>` : ""}
            <div style="margin-top:6px;display:flex;align-items:center;gap:6px;font-size:11px;color:#f59e0b;font-weight:600">
              <span>${fmtDistance(km)}</span>
              <span style="color:#9ca3af;font-weight:400">${t("map.from")} ${originLabel}</span>
            </div>
            ${p.address ? `<div style="margin-top:4px;font-size:11px;color:#6b7280">${escapeHtml(p.address)}</div>` : ""}
            ${desc ? `<div style="margin-top:8px;font-size:12px;color:#374151;line-height:1.35">${escapeHtml(desc)}</div>` : ""}
            ${priceLine}
            <a href="${ctaHref}" style="display:inline-block;margin-top:10px;padding:6px 12px;background:#f59e0b;color:white;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none">${t("map.seeMore")}</a>
          </div>`;
        L.marker([p.lat, p.lng], { icon }).addTo(layerRef.current).bindPopup(html);
      }
      for (const c of checkins.data ?? []) {
        const icon = buildIcon(L, imageFor(c));
        L.marker([c.lat, c.lng], { icon })
          .addTo(layerRef.current)
          .bindPopup(`<strong>${escapeHtml(c.provider_name ?? t("map.checkIn"))}</strong>`);
      }
    })();
  }, [providers.data, checkins.data, userPos]);


  // Realtime check-ins
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

  const nearest = useMemo(() => {
    const list = providers.data ?? [];
    const origin = userPos ?? PIRAMIDA;
    return list
      .map((p) => ({ ...p, _km: distanceKm(origin, p) }))
      .sort((a, b) => (a._km ?? 99999) - (b._km ?? 99999))
      .slice(0, 12);
  }, [providers.data, userPos]);


  const focus = (p: ProviderPin) => {
    mapRef.current?.flyTo([p.lat, p.lng], 16, { duration: 0.8 });
  };

  return (
    <>
      <MarketingNav />
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{t("map.live")}</p>
        <h1 className="mt-1 font-display text-4xl font-bold">{t("map.title")}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t("map.sub")}</p>
        <div className="mt-4">
          <Button onClick={requestLocation} disabled={locating} variant="outline" size="sm">
            <Crosshair className="mr-2 h-4 w-4" />
            {userPos ? t("map.recenter") : locating ? t("map.locating") : t("map.useMyLocation")}
          </Button>
        </div>
      </div>
      <div className="mx-auto mt-6 grid max-w-7xl gap-4 px-4 pb-12 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div ref={mapEl} className="h-[600px] w-full rounded-3xl border border-border shadow-lg" />
        <aside className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" />
            <p className="font-display font-semibold">
              {userPos ? t("map.nearestYou") : t("map.nearestPyramid")}
            </p>
          </div>
          {!userPos ? (
            <p className="mt-2 text-xs text-muted-foreground">{t("map.pyramidHint")}</p>
          ) : null}

          <ul className="mt-3 max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {(nearest ?? []).map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => focus(p)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-2 text-left transition-colors hover:bg-muted"
                >
                  <img
                    src={imageForProvider(p)}
                    alt=""
                    className="h-10 w-10 flex-shrink-0 rounded-full border border-border object-cover"
                    onError={(e) => ((e.target as HTMLImageElement).src = DEFAULT_BUSINESS_IMAGE)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold">{p.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      <MapPin className="mr-0.5 inline h-3 w-3" />
                      {p.address || p.city || "—"}
                    </p>
                  </div>
                  {p._km != null ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                      {p._km < 1 ? `${Math.round(p._km * 1000)} m` : `${p._km.toFixed(1)} km`}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
            {(providers.data ?? []).length === 0 ? (
              <li className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                {t("map.empty")}
              </li>
            ) : null}
          </ul>
        </aside>
      </div>
      <MarketingFooter />
    </>
  );
}
