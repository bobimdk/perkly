import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingNav, MarketingFooter } from "@/components/marketing/marketing-shell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchExperiences, upsertExperience, deleteExperience,
  fetchEducation, upsertEducation, deleteEducation,
  updateOwnProfile, type Experience, type Education,
} from "@/lib/phase5";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings/profile")({
  component: SettingsProfilePage,
});

type Basics = {
  first_name: string; last_name: string; username: string;
  headline: string; location: string; bio: string;
  avatar_url: string; cover_url: string;
  company_name: string; role_title: string;
  skills: string[]; interests: string[]; languages: string[];
};

const emptyBasics: Basics = {
  first_name: "", last_name: "", username: "", headline: "", location: "", bio: "",
  avatar_url: "", cover_url: "", company_name: "", role_title: "",
  skills: [], interests: [], languages: [],
};

function SettingsProfilePage() {
  const { user, refresh } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [basics, setBasics] = useState<Basics>(emptyBasics);
  const [saving, setSaving] = useState(false);

  // Load full profile row
  const profileQ = useQuery({
    queryKey: ["profile-edit", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!profileQ.data) return;
    const p: any = profileQ.data;
    setBasics({
      first_name: p.first_name ?? "", last_name: p.last_name ?? "",
      username: p.username ?? "", headline: p.headline ?? "",
      location: p.location ?? "", bio: p.bio ?? "",
      avatar_url: p.avatar_url ?? "", cover_url: p.cover_url ?? "",
      company_name: p.company_name ?? "", role_title: p.role_title ?? "",
      skills: p.skills ?? [], interests: p.interests ?? [], languages: p.languages ?? [],
    });
  }, [profileQ.data]);

  const expQ = useQuery({
    queryKey: ["experiences", user?.id],
    enabled: !!user,
    queryFn: () => fetchExperiences(user!.id),
  });
  const eduQ = useQuery({
    queryKey: ["education", user?.id],
    enabled: !!user,
    queryFn: () => fetchEducation(user!.id),
  });

  const saveBasics = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateOwnProfile(user.id, basics);
      toast.success("Profile updated");
      await refresh();
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user || profileQ.isLoading) {
    return (
      <div className="min-h-screen">
        <MarketingNav />
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
      </div>
    );
  }

  const username = basics.username || user.id;

  return (
    <div className="min-h-screen bg-muted/30">
      <MarketingNav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Edit profile</h1>
            <p className="text-sm text-muted-foreground">Build out your professional story.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/u/$username" params={{ username }}><ArrowLeft className="mr-2 h-4 w-4" /> View profile</Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First name"><Input value={basics.first_name} onChange={(e) => setBasics((b) => ({ ...b, first_name: e.target.value }))} /></Field>
              <Field label="Last name"><Input value={basics.last_name} onChange={(e) => setBasics((b) => ({ ...b, last_name: e.target.value }))} /></Field>
              <Field label="Username"><Input value={basics.username} onChange={(e) => setBasics((b) => ({ ...b, username: e.target.value }))} placeholder="janedoe" /></Field>
              <Field label="Location"><Input value={basics.location} onChange={(e) => setBasics((b) => ({ ...b, location: e.target.value }))} placeholder="Tirana, Albania" /></Field>
              <Field label="Headline" className="sm:col-span-2"><Input value={basics.headline} onChange={(e) => setBasics((b) => ({ ...b, headline: e.target.value }))} placeholder="Product designer at Perkly" /></Field>
              <Field label="Company"><Input value={basics.company_name} onChange={(e) => setBasics((b) => ({ ...b, company_name: e.target.value }))} /></Field>
              <Field label="Role title"><Input value={basics.role_title} onChange={(e) => setBasics((b) => ({ ...b, role_title: e.target.value }))} /></Field>
              <Field label="Avatar URL" className="sm:col-span-2"><Input value={basics.avatar_url} onChange={(e) => setBasics((b) => ({ ...b, avatar_url: e.target.value }))} placeholder="https://..." /></Field>
              <Field label="Cover URL" className="sm:col-span-2"><Input value={basics.cover_url} onChange={(e) => setBasics((b) => ({ ...b, cover_url: e.target.value }))} placeholder="https://..." /></Field>
              <Field label="About" className="sm:col-span-2"><Textarea rows={4} value={basics.bio} onChange={(e) => setBasics((b) => ({ ...b, bio: e.target.value }))} placeholder="Tell people about yourself" /></Field>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle>Skills, interests, languages</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <TagInput label="Skills" tags={basics.skills} onChange={(t) => setBasics((b) => ({ ...b, skills: t }))} placeholder="e.g. Figma" />
            <TagInput label="Interests" tags={basics.interests} onChange={(t) => setBasics((b) => ({ ...b, interests: t }))} placeholder="e.g. Hiking" />
            <TagInput label="Languages" tags={basics.languages} onChange={(t) => setBasics((b) => ({ ...b, languages: t }))} placeholder="e.g. English" />
          </CardContent>
        </Card>

        <div className="mb-6 flex justify-end">
          <Button onClick={saveBasics} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save profile
          </Button>
        </div>

        <ExperienceCard
          userId={user.id}
          items={expQ.data ?? []}
          onChanged={() => qc.invalidateQueries({ queryKey: ["experiences", user.id] })}
        />

        <EducationCard
          userId={user.id}
          items={eduQ.data ?? []}
          onChanged={() => qc.invalidateQueries({ queryKey: ["education", user.id] })}
        />
      </main>
      <MarketingFooter />
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block space-y-1.5 ${className ?? ""}`}>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function TagInput({ label, tags, onChange, placeholder }: { label: string; tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [val, setVal] = useState("");
  const add = () => {
    const v = val.trim();
    if (!v) return;
    if (tags.includes(v)) { setVal(""); return; }
    onChange([...tags, v]);
    setVal("");
  };
  return (
    <div>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1.5">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="opacity-60 hover:opacity-100">×</button>
          </Badge>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function ExperienceCard({ userId, items, onChanged }: { userId: string; items: Experience[]; onChanged: () => void }) {
  const [draft, setDraft] = useState<Partial<Experience>>({});
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!draft.title?.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      await upsertExperience({ user_id: userId, ...(draft as any), title: draft.title.trim() });
      toast.success("Experience saved");
      setDraft({});
      onChanged();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };
  const remove = async (id: string) => {
    await deleteExperience(id);
    toast.success("Removed");
    onChanged();
  };
  return (
    <Card className="mb-6">
      <CardHeader><CardTitle>Experience</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No experience yet. Add your first role below.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((x) => (
              <li key={x.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3">
                <div>
                  <p className="font-semibold">{x.title}{x.company ? ` · ${x.company}` : ""}</p>
                  <p className="text-xs text-muted-foreground">{[x.start_date, x.end_date || "Present"].filter(Boolean).join(" — ")}{x.location ? ` · ${x.location}` : ""}</p>
                  {x.description ? <p className="mt-1 text-sm">{x.description}</p> : null}
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(x.id)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-3 rounded-lg border border-dashed border-border p-3 sm:grid-cols-2">
          <Field label="Title"><Input value={draft.title ?? ""} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Senior designer" /></Field>
          <Field label="Company"><Input value={draft.company ?? ""} onChange={(e) => setDraft((d) => ({ ...d, company: e.target.value }))} /></Field>
          <Field label="Location"><Input value={draft.location ?? ""} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} /></Field>
          <div />
          <Field label="Start date"><Input type="date" value={draft.start_date ?? ""} onChange={(e) => setDraft((d) => ({ ...d, start_date: e.target.value || null }))} /></Field>
          <Field label="End date (leave empty if current)"><Input type="date" value={draft.end_date ?? ""} onChange={(e) => setDraft((d) => ({ ...d, end_date: e.target.value || null }))} /></Field>
          <Field label="Description" className="sm:col-span-2"><Textarea rows={2} value={draft.description ?? ""} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} /></Field>
          <div className="sm:col-span-2 flex justify-end">
            <Button onClick={save} disabled={saving}><Plus className="mr-2 h-4 w-4" />Add experience</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EducationCard({ userId, items, onChanged }: { userId: string; items: Education[]; onChanged: () => void }) {
  const [draft, setDraft] = useState<Partial<Education>>({});
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!draft.school?.trim()) { toast.error("School is required"); return; }
    setSaving(true);
    try {
      await upsertEducation({ user_id: userId, ...(draft as any), school: draft.school.trim() });
      toast.success("Education saved");
      setDraft({});
      onChanged();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };
  const remove = async (id: string) => {
    await deleteEducation(id);
    toast.success("Removed");
    onChanged();
  };
  return (
    <Card className="mb-6">
      <CardHeader><CardTitle>Education</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No education yet. Add your first school below.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((x) => (
              <li key={x.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3">
                <div>
                  <p className="font-semibold">{x.school}</p>
                  <p className="text-xs text-muted-foreground">
                    {[x.degree, x.field].filter(Boolean).join(", ")}
                    {(x.start_year || x.end_year) ? ` · ${x.start_year ?? "?"} — ${x.end_year ?? "Present"}` : ""}
                  </p>
                  {x.description ? <p className="mt-1 text-sm">{x.description}</p> : null}
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(x.id)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-3 rounded-lg border border-dashed border-border p-3 sm:grid-cols-2">
          <Field label="School" className="sm:col-span-2"><Input value={draft.school ?? ""} onChange={(e) => setDraft((d) => ({ ...d, school: e.target.value }))} placeholder="University of Tirana" /></Field>
          <Field label="Degree"><Input value={draft.degree ?? ""} onChange={(e) => setDraft((d) => ({ ...d, degree: e.target.value }))} placeholder="BSc" /></Field>
          <Field label="Field of study"><Input value={draft.field ?? ""} onChange={(e) => setDraft((d) => ({ ...d, field: e.target.value }))} placeholder="Computer Science" /></Field>
          <Field label="Start year"><Input type="number" value={draft.start_year ?? ""} onChange={(e) => setDraft((d) => ({ ...d, start_year: e.target.value ? Number(e.target.value) : null }))} /></Field>
          <Field label="End year"><Input type="number" value={draft.end_year ?? ""} onChange={(e) => setDraft((d) => ({ ...d, end_year: e.target.value ? Number(e.target.value) : null }))} /></Field>
          <Field label="Description" className="sm:col-span-2"><Textarea rows={2} value={draft.description ?? ""} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} /></Field>
          <div className="sm:col-span-2 flex justify-end">
            <Button onClick={save} disabled={saving}><Plus className="mr-2 h-4 w-4" />Add education</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
