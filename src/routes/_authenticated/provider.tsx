import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon, ExternalLink, Loader2 } from "lucide-react";
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
import { useAuth } from "@/lib/auth-context";
import { fetchCategories, fetchMyProviders, fetchProviderOffers, type ProviderRow, type OfferRow } from "@/lib/marketplace";
import { redeemTransaction } from "@/lib/perkly";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/provider")({
  head: () => ({ meta: [{ title: "Provider · Perkly" }] }),
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
    <DashboardShell title="Provider workspace">
      {providersQuery.isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (providersQuery.data ?? []).length === 0 ? (
        <CreateProviderCard onCreated={() => qc.invalidateQueries({ queryKey: ["my-providers", user?.id] })} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Your businesses</p>
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
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{p.status}</p>
                </div>
              </button>
            ))}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="mr-1 h-3.5 w-3.5" /> New business
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create new business</DialogTitle></DialogHeader>
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
      <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Welcome to Perkly Providers</p>
      <h2 className="mt-2 font-display text-2xl font-bold">List your business in the marketplace</h2>
      <p className="mt-2 text-sm text-muted-foreground">Create your provider profile, then publish offers visible to thousands of employees.</p>
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
    toast.success("Business published to the marketplace 🎉");
    setName(""); setTagline("");
    onCreated();
  };


  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Business name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aurora Spa" />
      </div>
      <div className="space-y-1.5">
        <Label>Tagline</Label>
        <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Your one-liner" />
      </div>
      <div className="space-y-1.5">
        <Label>City</Label>
        <Input value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <Button onClick={save} disabled={saving || !name.trim()} className="w-full">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Create business
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
          }`}>{provider.status}</span>
        </div>
        <NewOfferDialog providerId={provider.id} onCreated={() => qc.invalidateQueries({ queryKey: ["provider-offers", provider.id] })} />
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        <StatCard label="Published" value={stats.published} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Drafts" value={stats.drafts} />
        <StatCard label="Views" value={stats.views} />
        <StatCard label="Saves" value={stats.favorites} />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All offers</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="redeem">Redeem code</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
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

function OffersList({ offers, loading, onChanged }: { offers: OfferRow[]; loading: boolean; onChanged: () => void }) {
  const { formatPrice } = useI18n();
  if (loading) return <Skeleton className="h-40 rounded-2xl" />;
  if (offers.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No offers in this view.</p>;
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
            <p className="text-xs text-muted-foreground">{formatPrice(o.price_all)} · {o.views_count} views · {o.favorites_count} saves</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
            o.status === "published" ? "bg-success/15 text-success"
            : o.status === "pending" ? "bg-warning/15 text-warning-foreground"
            : o.status === "rejected" ? "bg-destructive/15 text-destructive"
            : "bg-muted text-muted-foreground"
          }`}>{o.status}</span>
          <a href={`/marketplace/${o.slug}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Preview">
            <ExternalLink className="h-4 w-4" />
          </a>
          <Button
            size="icon"
            variant="ghost"
            onClick={async () => {
              if (!confirm("Delete this offer?")) return;
              const { error } = await supabase.from("offers").delete().eq("id", o.id);
              if (error) return toast.error(error.message);
              toast.success("Deleted");
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

function NewOfferDialog({ providerId, onCreated }: { providerId: string; onCreated: () => void }) {
  const { user } = useAuth();
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [priceAll, setPriceAll] = useState<number>(0);
  const [priceEur, setPriceEur] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number | "">("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [city, setCity] = useState("Tiranë");
  const [isLimited, setIsLimited] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const upload = async (f: File) => {
    if (!user) return;
    setUploading(true);
    const ext = f.name.split(".").pop() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("offer-images").upload(path, f, { upsert: false });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data, error: sErr } = await supabase.storage.from("offer-images").createSignedUrl(path, 60 * 60 * 24 * 365);
    setUploading(false);
    if (sErr || !data?.signedUrl) return toast.error(sErr?.message ?? "Could not create URL");
    setCoverUrl(data.signedUrl);
    toast.success("Image uploaded");
  };

  const submit = async (status: "draft" | "published") => {
    if (!title.trim() || !categoryId || priceAll <= 0) return toast.error("Title, category and price are required");
    setSubmitting(true);
    const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
    const discount = originalPrice && Number(originalPrice) > priceAll
      ? Math.round((1 - priceAll / Number(originalPrice)) * 100) : null;
    const { error } = await supabase.from("offers").insert({
      provider_id: providerId,
      category_id: categoryId,
      slug, title, subtitle: subtitle || null, description: description || null,
      price_all: priceAll, price_eur: priceEur || priceAll / 100,
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
    toast.success(status === "draft" ? "Saved as draft" : "Published to marketplace 🎉");
    setOpen(false);
    setTitle(""); setSubtitle(""); setDescription(""); setPriceAll(0); setPriceEur(0); setOriginalPrice(""); setCapacity(""); setCoverUrl(""); setIsLimited(false);
    onCreated();
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> New offer</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create a new offer</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          {/* Cover image */}
          <div
            className="grid place-items-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}
          >
            {coverUrl ? (
              <img src={coverUrl} alt="cover" className="max-h-44 rounded-lg object-cover" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Drag & drop cover image</p>
                <p className="text-xs text-muted-foreground">or click to choose</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
            <Button variant="outline" size="sm" className="mt-3" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />} Choose image
            </Button>
            <div className="mt-3 w-full">
              <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="…or paste an image URL" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Spa day pass" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Subtitle</Label>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Pick…" /></SelectTrigger>
                <SelectContent>
                  {(categoriesQuery.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Price (ALL) *</Label>
              <Input type="number" min={0} value={priceAll} onChange={(e) => setPriceAll(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Price (EUR)</Label>
              <Input type="number" min={0} step="0.01" value={priceEur} onChange={(e) => setPriceEur(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Original price (ALL)</Label>
              <Input type="number" min={0} value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : "")} />
            </div>
            <div className="space-y-1.5">
              <Label>Capacity</Label>
              <Input type="number" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : "")} />
            </div>
            <label className="flex items-center justify-between rounded-xl border border-border p-3 sm:col-span-2">
              <span className="text-sm font-medium">Limited-time offer</span>
              <Switch checked={isLimited} onCheckedChange={setIsLimited} />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => submit("draft")} disabled={submitting}>Save draft</Button>
          <Button onClick={() => submit("published")} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Publish now
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
    return <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No payouts yet. They will appear here when employees redeem your offers.</p>;
  }
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Total earned</p>
        <p className="mt-1 font-display text-3xl font-bold text-primary">{formatPrice(total)}</p>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {list.map((t: { id: string; amount_all: number; reference: string | null; created_at: string; offers?: { title: string } | null }) => (
          <li key={t.id} className="flex items-center gap-4 p-3 text-sm">
            <span className="font-mono text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
            <span className="min-w-0 flex-1 truncate">{t.offers?.title ?? "Offer"}</span>
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
      setLast({ ok: true, msg: `Redeemed ${trimmed}`, amount: Number(tx.amount_all) });
      toast.success("Code redeemed");
      setCode("");
      qc.invalidateQueries({ queryKey: ["recent-redemptions", providerId] });
    } catch (e) {
      const m = (e as Error).message;
      const friendly = m.includes("already_redeemed") ? "This code was already used."
        : m.includes("code_not_found") ? "Code not found. Double-check the digits."
        : m.includes("forbidden") ? "This code isn't for your business."
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
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Scan or enter code</p>
        <h3 className="mt-1 font-display text-lg font-bold">Redeem a customer's benefit</h3>
        <p className="mt-1 text-sm text-muted-foreground">Ask the customer to show the QR pass from their Perkly app, then enter the code below to mark it used.</p>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => { e.preventDefault(); redeem(code); }}
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. PKLY-1A2B3C4D"
            className="font-mono uppercase tracking-wider"
          />
          <Button type="submit" disabled={busy || !code.trim()}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Redeem
          </Button>
        </form>
        {last ? (
          <div className={`mt-4 rounded-xl border p-3 text-sm ${last.ok ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
            {last.msg}{last.amount ? ` · ${formatPrice(last.amount)}` : ""}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Recent redemptions</p>
        {recentQuery.isLoading ? <Skeleton className="mt-3 h-24 rounded-lg" /> : (recentQuery.data ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No codes redeemed yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {recentQuery.data!.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="font-mono text-xs">{r.reference}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{(r as { offers?: { title?: string } | null }).offers?.title ?? "Offer"}</span>
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
