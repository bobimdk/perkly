import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Upload, Image as ImageIcon, ExternalLink, Loader2, MapPin, Crosshair, BarChart3, Heart,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ConciergeOrb } from "@/components/concierge/concierge-orb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocationPickerDialog } from "@/components/provider/location-picker";
import { useAuth } from "@/lib/auth-context";
import { fetchCategories, fetchMyProviders, fetchProviderOffers, type ProviderRow, type OfferRow } from "@/lib/marketplace";
import { redeemTransaction } from "@/lib/perkly";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/provider")({
  head: () => ({ meta: [{ title: "Ofruesi · Perkly" }] }),
  component: ProviderPage,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function statusLabel(s: ProviderRow["status"] | OfferRow["status"]) {
  switch (s) {
    case "active": return "aktiv";
    case "published": return "i publikuar";
    case "pending": return "në pritje";
    case "draft": return "skicë";
    case "rejected": return "i refuzuar";
    case "archived": return "i arkivuar";
    case "suspended": return "i pezulluar";
    default: return s;
  }
}

function ProviderPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const providersQuery = useQuery({
    queryKey: ["my-providers", user?.id],
    queryFn: () => fetchMyProviders(user!.id),
    enabled: !!user,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedId && providersQuery.data?.length) setSelectedId(providersQuery.data[0].id);
  }, [providersQuery.data, selectedId]);

  const selected = providersQuery.data?.find((p) => p.id === selectedId) ?? null;

  return (
    <DashboardShell title="Hapësira e ofruesit">
      {providersQuery.isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (providersQuery.data ?? []).length === 0 ? (
        <CreateProviderCard onCreated={() => qc.invalidateQueries({ queryKey: ["my-providers", user?.id] })} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Bizneset tuaja</p>
            {providersQuery.data!.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  selectedId === p.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted"
                }`}
              >
                {p.logo_url ? (
                  <img src={p.logo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-bold">
                    {p.name[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold">{p.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{statusLabel(p.status)}</p>
                </div>
              </button>
            ))}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Biznes i ri
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Krijo biznes të ri</DialogTitle></DialogHeader>
                <CreateProviderInline onCreated={() => qc.invalidateQueries({ queryKey: ["my-providers", user?.id] })} />
              </DialogContent>
            </Dialog>
          </aside>

          <div>
            {selected ? <ProviderDetail provider={selected} /> : null}
          </div>
        </div>
      )}
      <ConciergeOrb />
    </DashboardShell>
  );
}

function CreateProviderCard({ onCreated }: { onCreated: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Mirë se vini te Perkly për ofrues</p>
      <h2 className="mt-2 font-display text-2xl font-bold">Listoni biznesin tuaj në marketplace</h2>
      <p className="mt-2 text-sm text-muted-foreground">Krijoni profilin e ofruesit dhe publikoni oferta të dukshme për mijëra punonjës.</p>
      <div className="mt-6 mx-auto max-w-md text-left">
        <CreateProviderInline onCreated={onCreated} />
      </div>
    </div>
  );
}

function CreateProviderInline({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [city, setCity] = useState("Tiranë");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("providers").insert({
      owner_id: user.id, name: name.trim(), tagline, city, slug, status: "active",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Biznesi u publikua në marketplace 🎉");
    setName(""); setTagline("");
    onCreated();
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Emri i biznesit</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="p.sh. Aurora Spa" />
      </div>
      <div className="space-y-1.5">
        <Label>Slogani</Label>
        <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Fjalia juaj e shkurtër" />
      </div>
      <div className="space-y-1.5">
        <Label>Qyteti</Label>
        <Input value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <Button onClick={save} disabled={saving || !name.trim()} className="w-full">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Krijo biznesin
      </Button>
    </div>
  );
}

function ProviderDetail({ provider }: { provider: ProviderRow }) {
  const qc = useQueryClient();
  const offersQuery = useQuery({
    queryKey: ["provider-offers", provider.id],
    queryFn: () => fetchProviderOffers(provider.id),
  });

  const stats = useMemo(() => {
    const list = offersQuery.data ?? [];
    return {
      published: list.filter((o) => o.status === "published").length,
      pending: list.filter((o) => o.status === "pending").length,
      drafts: list.filter((o) => o.status === "draft").length,
      views: list.reduce((s, o) => s + o.views_count, 0),
      favorites: list.reduce((s, o) => s + o.favorites_count, 0),
    };
  }, [offersQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">{provider.name}</h2>
          {provider.tagline ? <p className="text-sm text-muted-foreground">{provider.tagline}</p> : null}
          <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
            provider.status === "active" ? "bg-success/15 text-success" : provider.status === "pending" ? "bg-warning/15 text-warning-foreground" : "bg-destructive/15 text-destructive"
          }`}>{statusLabel(provider.status)}</span>
        </div>
        <NewOfferDialog
          provider={provider}
          onCreated={() => qc.invalidateQueries({ queryKey: ["provider-offers", provider.id] })}
        />
      </div>

      <BusinessProfileEditor provider={provider} onSaved={() => qc.invalidateQueries({ queryKey: ["my-providers"] })} />

      <LocationEditor provider={provider} onSaved={() => qc.invalidateQueries({ queryKey: ["my-providers"] })} />

      <div className="grid gap-3 sm:grid-cols-5">
        <StatCard label="Të publikuara" value={stats.published} />
        <StatCard label="Në pritje" value={stats.pending} />
        <StatCard label="Skica" value={stats.drafts} />
        <StatCard label="Shikime" value={stats.views} />
        <StatCard label="Ruajtjet" value={stats.favorites} />
      </div>

      <BusinessAnalytics providerId={provider.id} offers={offersQuery.data ?? []} />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Të gjitha</TabsTrigger>
          <TabsTrigger value="published">Të publikuara</TabsTrigger>
          <TabsTrigger value="pending">Në pritje</TabsTrigger>
          <TabsTrigger value="draft">Skica</TabsTrigger>
          <TabsTrigger value="redeem">Kodi i shfrytëzimit</TabsTrigger>
          <TabsTrigger value="payouts">Pagesat</TabsTrigger>
        </TabsList>
        {(["all","published","pending","draft"] as const).map((t) => (
          <TabsContent key={t} value={t} className="mt-4">
            <OffersList
              offers={(offersQuery.data ?? []).filter((o) => t === "all" || o.status === t)}
              loading={offersQuery.isLoading}
              onChanged={() => qc.invalidateQueries({ queryKey: ["provider-offers", provider.id] })}
            />
          </TabsContent>
        ))}
        <TabsContent value="redeem" className="mt-4">
          <RedeemPanel providerId={provider.id} />
        </TabsContent>
        <TabsContent value="payouts" className="mt-4">
          <PayoutsList providerId={provider.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function BusinessProfileEditor({ provider, onSaved }: { provider: ProviderRow; onSaved: () => void }) {
  const [name, setName] = useState(provider.name);
  const [tagline, setTagline] = useState(provider.tagline ?? "");
  const [description, setDescription] = useState(provider.description ?? "");
  const [email, setEmail] = useState(provider.email ?? "");
  const [phone, setPhone] = useState(provider.phone ?? "");
  const [website, setWebsite] = useState(provider.website ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("providers").update({
      name, tagline: tagline || null, description: description || null,
      email: email || null, phone: phone || null, website: website || null,
    }).eq("id", provider.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profili i biznesit u përditësua");
    onSaved();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="font-display font-semibold">Informacioni i biznesit</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Këto të dhëna parazgjedhin fushat kur krijoni një ofertë të re.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2"><Label>Emri</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Slogani</Label><Input value={tagline} onChange={(e) => setTagline(e.target.value)} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Përshkrimi</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Email kontakti</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@biznesi.al" /></div>
        <div className="space-y-1.5"><Label>Telefoni</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+355 …" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Faqja e internetit</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" /></div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Ruaj
        </Button>
      </div>
    </div>
  );
}

function LocationEditor({ provider, onSaved }: { provider: ProviderRow; onSaved: () => void }) {
  const [address, setAddress] = useState(provider.address ?? "");
  const [city, setCity] = useState(provider.city ?? "");
  const [lat, setLat] = useState<number | null>(provider.lat ?? null);
  const [lng, setLng] = useState<number | null>(provider.lng ?? null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const useCurrent = () => {
    if (!navigator.geolocation) return toast.error("Gjeolokacioni nuk mbështetet");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setLocating(false);
        toast.success("Vendndodhja aktuale u shenjua");
      },
      (err) => { setLocating(false); toast.error(err.message); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("providers")
      .update({ address: address || null, city: city || null, lat, lng })
      .eq("id", provider.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Vendndodhja u përditësua");
    onSaved();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <p className="font-display font-semibold">Vendndodhja e biznesit</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Vendosni ku ndodhet biznesi juaj që punonjësit ta gjejnë në hartë.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Adresa</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="p.sh. Rruga e Durrësit 23" />
        </div>
        <div className="space-y-1.5">
          <Label>Qyteti</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tiranë" />
        </div>
        <div className="space-y-1.5">
          <Label>Koordinatat</Label>
          <Input
            readOnly
            value={lat != null && lng != null ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : ""}
            placeholder="Zgjidh në hartë"
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={useCurrent} disabled={locating}>
          <Crosshair className="mr-2 h-4 w-4" /> Përdor vendndodhjen aktuale
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
          <MapPin className="mr-2 h-4 w-4" /> Zgjidh në hartë
        </Button>
        <Button size="sm" onClick={save} disabled={saving} className="ml-auto">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Ruaj vendndodhjen
        </Button>
      </div>

      <LocationPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        initialLat={lat ?? provider.lat ?? null}
        initialLng={lng ?? provider.lng ?? null}
        initialAddress={address || provider.address || ""}
        onPicked={(loc) => {
          setLat(Number(loc.lat.toFixed(6)));
          setLng(Number(loc.lng.toFixed(6)));
          setAddress(loc.address);
          toast.success("Vendndodhja u zgjodh — mos harroni të ruani");
        }}
      />
    </div>
  );
}

function BusinessAnalytics({ providerId, offers }: { providerId: string; offers: OfferRow[] }) {
  const favQuery = useQuery({
    queryKey: ["provider-fav-counts", providerId, offers.map((o) => o.id).join(",")],
    queryFn: async () => {
      const ids = offers.map((o) => o.id);
      if (ids.length === 0) return {} as Record<string, number>;
      const { data, error } = await supabase
        .from("favorites")
        .select("offer_id")
        .in("offer_id", ids);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r) => { counts[r.offer_id] = (counts[r.offer_id] ?? 0) + 1; });
      return counts;
    },
    enabled: offers.length > 0,
  });

  const txQuery = useQuery({
    queryKey: ["provider-engagement", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("offer_id")
        .eq("provider_id", providerId);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        if (r.offer_id) counts[r.offer_id] = (counts[r.offer_id] ?? 0) + 1;
      });
      return counts;
    },
  });

  const rows = useMemo(() => {
    const favs = favQuery.data ?? {};
    const tx = txQuery.data ?? {};
    return offers
      .map((o) => ({
        id: o.id,
        title: o.title,
        cover: o.cover_url,
        favorites: favs[o.id] ?? o.favorites_count ?? 0,
        engagement: tx[o.id] ?? 0,
      }))
      .sort((a, b) => (b.favorites + b.engagement) - (a.favorites + a.engagement))
      .slice(0, 8);
  }, [offers, favQuery.data, txQuery.data]);

  const maxFav = Math.max(1, ...rows.map((r) => r.favorites));
  const maxEng = Math.max(1, ...rows.map((r) => r.engagement));

  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <p className="font-display font-semibold">Analiza e biznesit</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Çfarë preferojnë më shumë punonjësit — bazuar te të preferuarat dhe shfrytëzimet e ofertave tuaja.
      </p>

      {favQuery.isLoading || txQuery.isLoading ? (
        <Skeleton className="mt-4 h-40 rounded-xl" />
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Ende pa të dhëna. Publikoni ofertat dhe ndiqni angazhimin këtu.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <div className="flex items-center gap-3">
                {r.cover ? (
                  <img src={r.cover} alt="" className="h-10 w-14 rounded-md object-cover" />
                ) : (
                  <div className="grid h-10 w-14 place-items-center rounded-md bg-muted text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                )}
                <p className="min-w-0 flex-1 truncate font-medium">{r.title}</p>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="h-3.5 w-3.5 fill-destructive text-destructive" /> {r.favorites}
                </span>
                <span className="text-xs text-muted-foreground">{r.engagement} shfrytëzime</span>
              </div>
              <div className="mt-2 grid gap-1.5">
                <div>
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>Të preferuarat</span><span>{r.favorites}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-destructive to-primary"
                      style={{ width: `${(r.favorites / maxFav) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>Angazhimi</span><span>{r.engagement}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                      style={{ width: `${(r.engagement / maxEng) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function OffersList({ offers, loading, onChanged }: { offers: OfferRow[]; loading: boolean; onChanged: () => void }) {
  const { formatPrice } = useI18n();
  if (loading) return <Skeleton className="h-40 rounded-2xl" />;
  if (offers.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Nuk ka oferta në këtë pamje.</p>;
  }
  return (
    <ul className="space-y-2">
      {offers.map((o) => (
        <li key={o.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3">
          <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {o.cover_url ? <img src={o.cover_url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="m-auto h-6 w-6 text-muted-foreground" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display font-semibold">{o.title}</p>
            <p className="text-xs text-muted-foreground">{formatPrice(o.price_all)} · {o.views_count} shikime · {o.favorites_count} ruajtje</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
            o.status === "published" ? "bg-success/15 text-success"
            : o.status === "pending" ? "bg-warning/15 text-warning-foreground"
            : o.status === "rejected" ? "bg-destructive/15 text-destructive"
            : "bg-muted text-muted-foreground"
          }`}>{statusLabel(o.status)}</span>
          <a href={`/marketplace/${o.slug}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Shiko">
            <ExternalLink className="h-4 w-4" />
          </a>
          <Button
            size="icon"
            variant="ghost"
            onClick={async () => {
              if (!confirm("Fshi këtë ofertë?")) return;
              const { error } = await supabase.from("offers").delete().eq("id", o.id);
              if (error) return toast.error(error.message);
              toast.success("U fshi");
              onChanged();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}

function NewOfferDialog({ provider, onCreated }: { provider: ProviderRow; onCreated: () => void }) {
  const { user } = useAuth();
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(provider.name);
  const [subtitle, setSubtitle] = useState(provider.tagline ?? "");
  const [description, setDescription] = useState(provider.description ?? "");
  const [categoryId, setCategoryId] = useState<string>("");
  const [priceAll, setPriceAll] = useState<string>("");
  const [priceEur, setPriceEur] = useState<string>("");
  const [originalPrice, setOriginalPrice] = useState<number | "">("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [city, setCity] = useState(provider.city ?? "Tiranë");
  const [isLimited, setIsLimited] = useState(false);
  const [coverUrl, setCoverUrl] = useState(provider.cover_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Re-prefill whenever the dialog opens (after user updates business profile)
  useEffect(() => {
    if (!open) return;
    setTitle((t) => t || provider.name);
    setSubtitle((s) => s || provider.tagline || "");
    setDescription((d) => d || provider.description || "");
    setCity((c) => c || provider.city || "Tiranë");
    setCoverUrl((c) => c || provider.cover_url || "");
  }, [open, provider]);

  const upload = async (f: File) => {
    if (!user) return;
    setUploading(true);
    const ext = f.name.split(".").pop() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("offer-images").upload(path, f, { upsert: false });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data, error: sErr } = await supabase.storage.from("offer-images").createSignedUrl(path, 60 * 60 * 24 * 365);
    setUploading(false);
    if (sErr || !data?.signedUrl) return toast.error(sErr?.message ?? "Nuk u krijua URL-ja");
    setCoverUrl(data.signedUrl);
    toast.success("Imazhi u ngarkua");
  };

  const submit = async (status: "draft" | "published") => {
    const priceAllNum = Number(priceAll);
    const priceEurNum = Number(priceEur);
    if (!title.trim() || !categoryId || !priceAll || priceAllNum <= 0)
      return toast.error("Titulli, kategoria dhe çmimi janë të detyrueshme");
    setSubmitting(true);
    const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
    const discount = originalPrice && Number(originalPrice) > priceAllNum
      ? Math.round((1 - priceAllNum / Number(originalPrice)) * 100) : null;
    const { error } = await supabase.from("offers").insert({
      provider_id: provider.id,
      category_id: categoryId,
      slug, title, subtitle: subtitle || null, description: description || null,
      price_all: priceAllNum, price_eur: priceEurNum || priceAllNum / 100,
      original_price_all: originalPrice ? Number(originalPrice) : null,
      discount_percent: discount,
      capacity: capacity ? Number(capacity) : null,
      remaining: capacity ? Number(capacity) : null,
      city, is_limited_time: isLimited,
      cover_url: coverUrl || null,
      status, published_at: status === "draft" ? null : new Date().toISOString(),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(status === "draft" ? "U ruajt si skicë" : "U publikua në marketplace 🎉");
    setOpen(false);
    setTitle(provider.name); setSubtitle(provider.tagline ?? ""); setDescription(provider.description ?? "");
    setPriceAll(""); setPriceEur(""); setOriginalPrice(""); setCapacity(""); setCoverUrl(provider.cover_url ?? "");
    setIsLimited(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Ofertë e re</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Krijo një ofertë të re</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Fushat janë parazgjedhur nga profili juaj i biznesit. Përditësojini sipas dëshirës.
        </p>
        <div className="grid gap-4">
          <div
            className="grid place-items-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}
          >
            {coverUrl ? (
              <img src={coverUrl} alt="kopertina" className="max-h-44 rounded-lg object-cover" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Tërhiq dhe lësho imazhin e kopertinës</p>
                <p className="text-xs text-muted-foreground">ose kliko për të zgjedhur</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
            <Button variant="outline" size="sm" className="mt-3" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />} Zgjidh imazhin
            </Button>
            <div className="mt-3 w-full">
              <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="…ose ngjit një URL imazhi" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Titulli *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="p.sh. Ditë në SPA" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nëntitulli</Label>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Përshkrimi</Label>
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Kategoria *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Zgjidh…" /></SelectTrigger>
                <SelectContent>
                  {(categoriesQuery.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name_sq}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Qyteti</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Çmimi (ALL) *</Label>
              <Input type="number" inputMode="numeric" min={0} placeholder="0" value={priceAll} onChange={(e) => setPriceAll(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Çmimi (EUR)</Label>
              <Input type="number" inputMode="decimal" min={0} step="0.01" placeholder="0.00" value={priceEur} onChange={(e) => setPriceEur(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Çmimi origjinal (ALL)</Label>
              <Input type="number" min={0} value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : "")} />
            </div>
            <div className="space-y-1.5">
              <Label>Kapaciteti</Label>
              <Input type="number" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : "")} />
            </div>
            <label className="flex items-center justify-between rounded-xl border border-border p-3 sm:col-span-2">
              <span className="text-sm font-medium">Ofertë me kohë të kufizuar</span>
              <Switch checked={isLimited} onCheckedChange={setIsLimited} />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => submit("draft")} disabled={submitting}>Ruaj skicën</Button>
          <Button onClick={() => submit("published")} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Publiko tani
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PayoutsList({ providerId }: { providerId: string }) {
  const { formatPrice } = useI18n();
  const txQuery = useQuery({
    queryKey: ["provider-tx", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, offers(title,slug)")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
  if (txQuery.isLoading) return <Skeleton className="h-40 rounded-2xl" />;
  const list = txQuery.data ?? [];
  const total = list.reduce((s, t) => s + Number(t.amount_all), 0);
  if (list.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Ende pa pagesa. Do të shfaqen këtu kur punonjësit shfrytëzojnë ofertat tuaja.</p>;
  }
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Totali i fituar</p>
        <p className="mt-1 font-display text-3xl font-bold text-primary">{formatPrice(total)}</p>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {list.map((t: { id: string; amount_all: number; reference: string | null; created_at: string; offers?: { title: string } | null }) => (
          <li key={t.id} className="flex items-center gap-4 p-3 text-sm">
            <span className="font-mono text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
            <span className="min-w-0 flex-1 truncate">{t.offers?.title ?? "Ofertë"}</span>
            <span className="font-mono text-xs text-muted-foreground">{t.reference}</span>
            <span className="font-display font-semibold text-success">+{formatPrice(Number(t.amount_all))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RedeemPanel({ providerId }: { providerId: string }) {
  const qc = useQueryClient();
  const { formatPrice } = useI18n();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ ok: boolean; msg: string; amount?: number; title?: string } | null>(null);

  const recentQuery = useQuery({
    queryKey: ["recent-redemptions", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id,reference,amount_all,redeemed_at,created_at, offers(title)")
        .eq("provider_id", providerId)
        .not("redeemed_at", "is", null)
        .order("redeemed_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const redeem = async (ref: string) => {
    const trimmed = ref.trim().toUpperCase();
    if (!trimmed) return;
    setBusy(true);
    setLast(null);
    try {
      const tx = await redeemTransaction(trimmed);
      setLast({ ok: true, msg: `U shfrytëzua ${trimmed}`, amount: Number(tx.amount_all) });
      toast.success("Kodi u shfrytëzua");
      setCode("");
      qc.invalidateQueries({ queryKey: ["recent-redemptions", providerId] });
    } catch (e) {
      const m = (e as Error).message;
      const friendly = m.includes("already_redeemed") ? "Ky kod është përdorur më parë."
        : m.includes("code_not_found") ? "Kodi nuk u gjet. Kontrolloni shifrat."
        : m.includes("forbidden") ? "Ky kod nuk i përket biznesit tuaj."
        : m;
      setLast({ ok: false, msg: friendly });
      toast.error(friendly);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Skano ose vendos kodin</p>
        <h3 className="mt-1 font-display text-lg font-bold">Shfrytëzo një përfitim të klientit</h3>
        <p className="mt-1 text-sm text-muted-foreground">Kërkoji klientit të shfaqë QR-në nga aplikacioni Perkly, pastaj vendos kodin më poshtë për ta shënuar si të përdorur.</p>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => { e.preventDefault(); redeem(code); }}
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="p.sh. PKLY-1A2B3C4D"
            className="font-mono uppercase tracking-wider"
          />
          <Button type="submit" disabled={busy || !code.trim()}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Shfrytëzo
          </Button>
        </form>
        {last ? (
          <div className={`mt-4 rounded-xl border p-3 text-sm ${last.ok ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
            {last.msg}{last.amount ? ` · ${formatPrice(last.amount)}` : ""}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Shfrytëzime të fundit</p>
        {recentQuery.isLoading ? <Skeleton className="mt-3 h-24 rounded-lg" /> : (recentQuery.data ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Ende pa kode të shfrytëzuara.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {recentQuery.data!.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="font-mono text-xs">{r.reference}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{(r as { offers?: { title?: string } | null }).offers?.title ?? "Ofertë"}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {new Date(r.redeemed_at!).toLocaleString()}
                </span>
                <span className="font-display font-semibold text-success">{formatPrice(Number(r.amount_all))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
