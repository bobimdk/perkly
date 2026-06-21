import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

type OfferPin = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price_all: number | null;
  price_eur: number | null;
  cover_url: string | null;
  category_slug: string | null;
  provider_id: string;
  name: string; // provider name (used by marker label / nearest list)
  provider_slug: string;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  lat: number;
  lng: number;
  is_sponsored?: boolean;
};

// Piramida e Tiranës — fallback "current location" when geolocation denied
const PIRAMIDA = { lat: 41.3236, lng: 19.8197 };

async function fetchOfferPins(): Promise<OfferPin[]> {
  const { data, error } = await supabase
    .from("offers")
    .select(
      "id,slug,title,subtitle,description,price_all,price_eur,cover_url,status," +
        "categories(slug)," +
        "providers!inner(id,name,slug,logo_url,address,city,lat,lng,status,is_sponsored)",
    )
    .eq("status", "published")
    .eq("providers.status", "active")
    .not("providers.lat", "is", null)
    .not("providers.lng", "is", null);
  if (error) throw error;
  return (data ?? [])
    .map((o: any) => {
      const pr = o.providers;
      if (!pr || pr.lat == null || pr.lng == null) return null;
      return {
        id: o.id,
        slug: o.slug,
        title: o.title,
        subtitle: o.subtitle ?? null,
        description: o.description ?? null,
        price_all: o.price_all ?? null,
        price_eur: o.price_eur ?? null,
        cover_url: o.cover_url ?? null,
        category_slug: o.categories?.slug ?? null,
        provider_id: pr.id,
        name: pr.name,
        provider_slug: pr.slug,
        logo_url: pr.logo_url,
        address: pr.address,
        city: pr.city,
        lat: Number(pr.lat),
        lng: Number(pr.lng),
        is_sponsored: !!pr.is_sponsored,
      } as OfferPin;
    })
    .filter((x): x is OfferPin => x !== null);
}

function fmtMeters(km: number) {
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

function imageForOffer(p: OfferPin) {
  return (
    p.cover_url ||
    p.logo_url ||
    (p.category_slug ? CATEGORY_IMAGE[p.category_slug] : undefined) ||
    DEFAULT_BUSINESS_IMAGE
  );
}

// Pretty label for a category slug (Pulse filter chips)
function catLabel(slug: string) {
  const map: Record<string, string> = { health: "Healthcare" };
  const v = map[slug] ?? slug;
  return v.charAt(0).toUpperCase() + v.slice(1);
}

// Amber photo-pin / featured-pin marker, matching the Pulse mockup
function buildPulseIcon(L: any, imgUrl: string, featured = false) {
  const html = featured
    ? `<div class="pk-feat"><div class="pk-feat-inner" style="background-image:url('${imgUrl}')"></div><span class="pk-star">★</span></div>`
    : `<div class="pk-pin"><div class="pk-pin-img" style="background-image:url('${imgUrl}')"></div></div>`;
  const size = featured ? 54 : 40;
  return L.divIcon({
    html,
    className: "pk-divicon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const PULSE_STYLE_ID = "pulse-map-css";
const PULSE_FONTS_ID = "pulse-fonts";

function MapPage() {
  const { t } = useI18n();

  const checkins = useQuery({ queryKey: ["checkins"], queryFn: () => fetchCheckIns(500) });
  const offers = useQuery({ queryKey: ["map-offer-pins"], queryFn: fetchOfferPins });

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  // marker handles keyed by offer id, for filter/search show-hide
  const markerMap = useRef<Map<string, any>>(new Map());

  // Inject Pulse fonts + styles once
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById(PULSE_FONTS_ID)) {
      const f = document.createElement("link");
      f.id = PULSE_FONTS_ID;
      f.rel = "stylesheet";
      f.href =
        "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap";
      document.head.appendChild(f);
    }
    if (!document.getElementById(PULSE_STYLE_ID)) {
      const style = document.createElement("style");
      style.id = PULSE_STYLE_ID;
      style.textContent = `
        @keyframes pkShimmer{0%{background-position:-450px 0;}100%{background-position:450px 0;}}
        @keyframes pkPing{0%{transform:scale(.4);opacity:.8;}80%{opacity:0;}100%{transform:scale(2.4);opacity:0;}}
        @keyframes pkDrop{0%{opacity:0;transform:translateY(-26px) scale(.4);}60%{opacity:1;}100%{opacity:1;transform:translateY(0) scale(1);}}
        @keyframes pkInUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}
        .pulse-scope ::selection{background:#f0b450;color:#3a2708;}
        .pk-scroll::-webkit-scrollbar{width:7px;}
        .pk-scroll::-webkit-scrollbar-thumb{background:#e0cfa8;border-radius:8px;}
        .pk-scroll::-webkit-scrollbar-track{background:transparent;}
        .pk-li{transition:transform .3s cubic-bezier(.2,.7,.2,1),box-shadow .3s,border-color .3s,background .3s;}
        .pk-li:hover{transform:translateX(4px);border-color:#e9c98a;box-shadow:0 12px 26px rgba(120,70,10,.12);background:#fffdf8;}
        .pk-li:hover .pk-go{opacity:1;transform:translateX(0);}
        .pk-go{opacity:0;transform:translateX(-6px);transition:opacity .3s,transform .3s;}
        .pk-btn{transition:transform .2s,box-shadow .3s,background .25s;}
        .pk-btn:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(217,119,6,.3);}
        .pk-chip{transition:all .2s;cursor:pointer;}
        .pk-chip:hover{border-color:#e9c98a;color:#a85d06;}
        .pk-skel{position:absolute;inset:0;z-index:20;background:#efe7d6;display:flex;align-items:center;justify-content:center;transition:opacity .7s;}
        .pk-skel.gone{opacity:0;pointer-events:none;}
        .pk-shimmer{background:linear-gradient(90deg,#e9e0cd 0%,#f3ecdb 50%,#e9e0cd 100%);background-size:900px 100%;animation:pkShimmer 1.4s linear infinite;}
        .pk-divicon{background:none;border:none;}
        .pk-pin{width:40px;height:40px;border-radius:50%;padding:2px;background:linear-gradient(160deg,#f6b042,#d97706);box-shadow:0 4px 12px rgba(80,45,5,.32);cursor:pointer;transition:transform .25s cubic-bezier(.2,.7,.2,1);transform-origin:center bottom;}
        .pk-pin:hover{transform:scale(1.16);z-index:600;}
        .pk-pin-img{width:100%;height:100%;border-radius:50%;background-size:cover;background-position:center;border:2px solid #fffaf0;}
        .pk-feat{width:54px;height:54px;border-radius:50%;padding:3px;background:linear-gradient(160deg,#7a1322,#b21e3a);box-shadow:0 6px 18px rgba(80,5,15,.4);position:relative;cursor:pointer;transition:transform .25s cubic-bezier(.2,.7,.2,1);}
        .pk-feat:hover{transform:scale(1.12);z-index:600;}
        .pk-feat-inner{width:100%;height:100%;border-radius:50%;background-size:cover;background-position:center;border:2px solid #ffe7a8;}
        .pk-star{position:absolute;top:-4px;right:-4px;width:20px;height:20px;border-radius:50%;background:#f6b042;color:#5a2a02;font-size:11px;display:flex;align-items:center;justify-content:center;border:2px solid #fffaf0;box-shadow:0 2px 5px rgba(0,0,0,.25);}
        .pk-drop{animation:pkDrop .6s cubic-bezier(.2,1.3,.4,1) both;}
        .pulse-scope .leaflet-popup-content-wrapper{border-radius:13px;box-shadow:0 12px 30px rgba(80,45,5,.22);}
        .pulse-scope .leaflet-popup-content{margin:11px 15px;font-family:'Hanken Grotesk',system-ui,sans-serif;font-size:13px;color:#2a1c0a;}
        .pulse-scope .leaflet-container{background:#eee7d8;font-family:'Hanken Grotesk',system-ui,sans-serif;}
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Initialize map (CARTO Voyager light tiles, like the Pulse mockup)
  useEffect(() => {
    if (typeof window === "undefined" || !mapEl.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      const map = L.map(mapEl.current, { zoomControl: true }).setView([PIRAMIDA.lat, PIRAMIDA.lng], 14);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap, © CARTO",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
      setTimeout(() => map.invalidateSize(), 80);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const requestLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
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

  // Render user / Pyramid marker
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const pos = userPos ?? PIRAMIDA;
      const label = userPos ? t("map.youAreHere") : t("map.pyramid");
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([pos.lat, pos.lng]).setPopupContent(`<strong>${label}</strong>`);
      } else {
        const icon = L.divIcon({
          html: `<div style="position:relative;width:28px;height:28px"><div style="position:absolute;inset:8px;width:12px;height:12px;background:#2563eb;border:2px solid #fff;border-radius:9999px;box-shadow:0 2px 8px rgba(37,99,235,.6)"></div><div style="position:absolute;inset:0;border-radius:9999px;background:radial-gradient(circle,rgba(37,99,235,.4) 0%,rgba(37,99,235,0) 70%);animation:pkPing 2s ease-out infinite"></div></div>`,
          className: "pk-divicon",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        userMarkerRef.current = L.marker([pos.lat, pos.lng], { icon })
          .addTo(mapRef.current)
          .bindPopup(`<strong>${label}</strong>`);
      }
    })();
  }, [userPos, t, mapReady]);

  // Render offer + checkin markers
  useEffect(() => {
    if (!mapRef.current || !layerRef.current || !mapReady) return;
    const origin = userPos ?? PIRAMIDA;
    (async () => {
      const L = (await import("leaflet")).default;
      layerRef.current.clearLayers();
      markerMap.current.clear();
      const list = offers.data ?? [];
      list.forEach((p, i) => {
        const icon = buildPulseIcon(L, imageForOffer(p), !!p.is_sponsored);
        const km = distanceKm(origin, p);
        const priceLine =
          p.price_all != null || p.price_eur != null
            ? `<div style="margin-top:6px;font-family:ui-monospace,monospace;font-size:11px;color:#d97706;font-weight:600">${p.price_all != null ? `${p.price_all} ALL` : ""}${p.price_eur != null ? ` · €${p.price_eur}` : ""}</div>`
            : "";
        const html = `
          <div style="min-width:200px;max-width:240px">
            <div style="font-weight:700;font-size:14px;line-height:1.2">${escapeHtml(p.title)}${p.is_sponsored ? ' <span style="display:inline-block;margin-left:4px;padding:1px 6px;border-radius:999px;background:#f6b042;color:#5a2a02;font-size:10px;font-weight:800">★</span>' : ""}</div>
            <div style="font-size:11px;color:#8a7553;margin-top:2px">${escapeHtml(p.name)} · ${fmtMeters(km)}</div>
            ${priceLine}
            <a href="/marketplace/${p.slug}" style="display:inline-block;margin-top:9px;padding:6px 12px;background:linear-gradient(160deg,#f6b042,#d97706);color:#fff;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none">${t("map.seeMore")}</a>
          </div>`;
        const m = L.marker([p.lat, p.lng], { icon, title: p.title }).addTo(layerRef.current).bindPopup(html);
        markerMap.current.set(p.id, m);
        // staggered drop-in
        const node = m.getElement?.();
        if (node) {
          node.style.opacity = "0";
          setTimeout(() => {
            node.style.opacity = "";
            node.firstChild && (node.firstChild as HTMLElement).classList.add("pk-drop");
          }, 300 + i * 70);
        }
      });
      for (const c of checkins.data ?? []) {
        const icon = buildPulseIcon(L, imageFor(c));
        L.marker([c.lat, c.lng], { icon })
          .addTo(layerRef.current)
          .bindPopup(`<strong>${escapeHtml(c.provider_name ?? t("map.checkIn"))}</strong>`);
      }
    })();
  }, [offers.data, checkins.data, userPos, t, mapReady]);

  // Categories present in the data → Pulse filter chips
  const cats = useMemo(() => {
    const present = new Set<string>();
    for (const p of offers.data ?? []) if (p.category_slug) present.add(p.category_slug);
    return ["All", ...Array.from(present)];
  }, [offers.data]);

  const passes = (p: OfferPin) => {
    if (filter !== "All" && p.category_slug !== filter) return false;
    const q = query.trim().toLowerCase();
    if (q && !(p.title.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))) return false;
    return true;
  };

  // Show/hide markers when filter or query changes
  useEffect(() => {
    for (const p of offers.data ?? []) {
      const m = markerMap.current.get(p.id);
      const node = m?.getElement?.();
      if (node) node.style.display = passes(p) ? "" : "none";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, query, offers.data]);

  const nearest = useMemo(() => {
    const origin = userPos ?? PIRAMIDA;
    return (offers.data ?? [])
      .filter(passes)
      .map((p) => ({ ...p, _km: distanceKm(origin, p) }))
      .sort((a, b) => (a._km ?? 99999) - (b._km ?? 99999));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers.data, userPos, filter, query]);

  const focus = (p: OfferPin) => {
    const m = markerMap.current.get(p.id);
    mapRef.current?.flyTo([p.lat, p.lng], 16, { duration: 0.85 });
    if (m) setTimeout(() => m.openPopup(), 700);
  };

  const liveCount = checkins.data?.length ?? 0;
  const loading = offers.isLoading || !mapReady;

  return (
    <div
      className="pulse-scope"
      style={{
        position: "relative",
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#faf4e8",
        fontFamily: "'Hanken Grotesk',system-ui,sans-serif",
        WebkitFontSmoothing: "antialiased",
        overflow: "hidden",
      }}
    >
      {/* TOP BAR */}
      <header
        style={{
          flex: "none",
          padding: "16px 22px",
          display: "flex",
          alignItems: "center",
          gap: 18,
          borderBottom: "1px solid #ece0c6",
          background: "#fbf6ec",
          zIndex: 6,
          animation: "pkInUp .7s .05s both",
        }}
      >
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, flex: "none", textDecoration: "none" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "linear-gradient(160deg,#f6b042,#d97706)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Newsreader,serif",
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            P
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontFamily: "Newsreader,serif", fontSize: 18, fontWeight: 600, color: "#241a0c", lineHeight: 1 }}>
                {t("map.title")}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, letterSpacing: ".18em", color: "#c0392b", fontWeight: 700 }}>
                <span style={{ position: "relative", width: 7, height: 7 }}>
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#c0392b" }} />
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#c0392b", animation: "pkPing 2s ease-out infinite" }} />
                </span>
                LIVE
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#8a7553", marginTop: 2 }}>
              {liveCount > 0 ? `${liveCount} colleagues using perks right now` : "Live perk activity near you"}
            </div>
          </div>
        </a>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: 430,
            background: "#fff",
            border: "1px solid #eadcc0",
            borderRadius: 12,
            padding: "10px 14px",
          }}
        >
          <span style={{ color: "#c9a86a" }}>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search spas, gyms, restaurants, tours…"
            style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontFamily: "inherit", fontSize: 14, color: "#241a0c" }}
          />
        </div>

        <button
          className="pk-btn"
          onClick={requestLocation}
          disabled={locating}
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            padding: "11px 18px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(160deg,#f6b042,#d97706)",
            color: "#fff",
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: 14,
            cursor: locating ? "default" : "pointer",
            boxShadow: "0 8px 22px rgba(217,119,6,.26)",
            flex: "none",
            opacity: locating ? 0.8 : 1,
          }}
        >
          <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #fff", borderTopColor: "transparent", display: "inline-block" }} />
          {userPos ? t("map.recenter") : locating ? t("map.locating") : t("map.useMyLocation")}
        </button>
      </header>

      {/* FILTER CHIPS */}
      <div
        style={{
          flex: "none",
          padding: "13px 22px",
          display: "flex",
          gap: 9,
          alignItems: "center",
          borderBottom: "1px solid #ece0c6",
          background: "#fdf9f0",
          overflowX: "auto",
          zIndex: 5,
          animation: "pkInUp .7s .12s both",
        }}
      >
        {cats.map((c) => {
          const active = filter === c;
          return (
            <span
              key={c}
              className="pk-chip"
              onClick={() => setFilter(c)}
              style={{
                flex: "none",
                padding: "8px 16px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                border: `1px solid ${active ? "#241a0c" : "#eadcc0"}`,
                background: active ? "#241a0c" : "#fff",
                color: active ? "#fdeccb" : "#6a5733",
              }}
            >
              {c === "All" ? "All" : catLabel(c)}
            </span>
          );
        })}
      </div>

      {/* BODY */}
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {/* MAP */}
        <div style={{ flex: 1, minWidth: 0, position: "relative", isolation: "isolate" }}>
          <div ref={mapEl} style={{ position: "absolute", inset: 0, zIndex: 0 }} />
          <div className={`pk-skel${loading ? "" : " gone"}`} style={{ display: loading ? "flex" : undefined, pointerEvents: loading ? undefined : "none" }}>
            <div style={{ textAlign: "center" }}>
              <div className="pk-shimmer" style={{ width: 240, height: 14, borderRadius: 7, margin: "0 auto 12px" }} />
              <div className="pk-shimmer" style={{ width: 180, height: 14, borderRadius: 7, margin: "0 auto" }} />
              <div style={{ fontSize: 13, letterSpacing: ".2em", color: "#b09a6e", marginTop: 20, textTransform: "uppercase" }}>
                {t("map.locating") === "Locating…" ? "Loading live map…" : t("map.locating")}
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div
          style={{
            width: 360,
            flex: "none",
            borderLeft: "1px solid #ece0c6",
            background: "#fbf6ec",
            display: "flex",
            flexDirection: "column",
            animation: "pkInUp .7s .2s both",
          }}
        >
          <div style={{ padding: "20px 22px 14px", borderBottom: "1px solid #eadcc0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: "Newsreader,serif", fontWeight: 600, fontSize: 19, margin: 0, letterSpacing: "-.01em", color: "#241a0c" }}>
                {userPos ? t("map.nearestYou") : t("map.nearestPyramid")}
              </h2>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#9a6a14", background: "#f6e2b8", padding: "4px 10px", borderRadius: 999 }}>
                {nearest.length} perks
              </span>
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "#8a7553", margin: "6px 0 0" }}>
              {userPos ? t("map.yourLocation") : t("map.pyramidHint")}
            </p>
          </div>

          <div className="pk-scroll" style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {nearest.map((p) => (
              <div
                key={p.id}
                className="pk-li"
                onClick={() => focus(p)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  padding: 11,
                  borderRadius: 15,
                  border: "1px solid #f0e3c6",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 13,
                    flex: "none",
                    backgroundImage: `url('${imageForOffer(p)}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    boxShadow: "0 4px 10px rgba(80,45,5,.14)",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: "#241a0c", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#8a7553", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#b09a6e", marginTop: 2 }}>
                    {p.category_slug ? catLabel(p.category_slug) : "Perk"} · ◍ {p.city || p.address || "—"}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#9a6a14", background: "#f6e2b8", padding: "4px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>
                    {fmtMeters(p._km)}
                  </span>
                  <span className="pk-go" style={{ color: "#d97706", fontSize: 15 }}>→</span>
                </div>
              </div>
            ))}
            {!loading && nearest.length === 0 ? (
              <div style={{ border: "1px dashed #e0cfa8", borderRadius: 15, padding: 20, textAlign: "center", fontSize: 13, color: "#b09a6e" }}>
                {t("map.empty")}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
