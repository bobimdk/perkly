import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingNav, MarketingFooter } from "@/components/marketing/marketing-shell";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  Heart,
  GraduationCap,
  Plane,
  UtensilsCrossed,
  Laptop,
  Stethoscope,
  Music,
  Gift,
  Globe,
  Compass,
  MessageCircle,
  Package,


  BarChart3,
  ArrowRight,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Perkly — Benefits employees actually want" },
      {
        name: "description",
        content:
          "Modern employee benefits marketplace. Personalized perks, wellness, travel and exclusive deals funded directly by your employer.",
      },
      { property: "og:title", content: "Perkly — Benefits employees actually want" },
      {
        property: "og:description",
        content:
          "The Netflix of employee benefits. Albania-first, global-ready marketplace.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <Hero t={t} />
        <TrustStrip />
        <HowItWorks t={t} />
        <Categories t={t} />
        <AIFeatures t={t} />
        <Testimonials t={t} />
        <CTA />
      </main>
      <MarketingFooter />
    </div>
  );
}

function Hero({ t }: { t: (k: string) => string }) {
  return (
    <section className="relative overflow-hidden bg-warm-gradient">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-primary-glow/30 blur-3xl" />
      </div>
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2 lg:py-32">
        <div className="reveal">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
            <Globe className="h-3 w-3" /> Albania first · Global ready
          </div>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            {t("hero.title.a")}{" "}
            <span className="text-gradient-amber">{t("hero.title.b")}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("hero.sub")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 px-6 text-base shadow-md">
              <Link to="/auth">
                {t("hero.cta")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <a href="#how">{t("hero.demo")}</a>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <span>20+ providers</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
            <span>4 roles</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
            <span>SQ · EN · ALL · EUR</span>
          </div>
        </div>

        <div className="reveal relative">
          <HeroCard />
        </div>
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div className="card-tilt card-tilt-hover relative mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-primary/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Monthly budget
          </p>
          <p className="mt-1 font-display text-3xl font-bold">
            12,400 <span className="text-base text-muted-foreground">ALL</span>
          </p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
          <Gift className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary to-primary-glow" />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>Used 8,200</span>
        <span>Left 4,200</span>
      </div>

      <div className="mt-6 space-y-3">
        {[
          { name: "Elite Fitness Tirana", price: "4,500 ALL", color: "from-amber-400 to-orange-500", icon: Dumbbell },
          { name: "Prime Wellness · Spa Day", price: "2,800 ALL", color: "from-rose-400 to-pink-500", icon: Heart },
          { name: "Coursera · Annual Plan", price: "900 ALL", color: "from-sky-400 to-blue-500", icon: GraduationCap },
        ].map((row) => (
          <div key={row.name} className="flex items-center gap-3 rounded-xl border border-border/60 p-3 transition-colors hover:bg-muted/50">
            <div className={`grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br ${row.color} text-white`}>
              <row.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{row.name}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Active</p>
            </div>
            <span className="font-mono text-xs font-semibold">{row.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustStrip() {
  const names = ["Vodafone AL", "One Albania", "BKT", "Raiffeisen", "Albtelecom", "ProCredit"];
  return (
    <section className="border-y border-border/60 bg-background py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Trusted by forward-thinking teams
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
          {names.map((n) => (
            <span key={n} className="font-display text-lg font-semibold text-muted-foreground">
              {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ t }: { t: (k: string) => string }) {
  const steps = [
    { n: "01", t: t("how.s1.t"), d: t("how.s1.d") },
    { n: "02", t: t("how.s2.t"), d: t("how.s2.d") },
    { n: "03", t: t("how.s3.t"), d: t("how.s3.d") },
  ];
  return (
    <section id="how" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Workflow</p>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{t("how.title")}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("how.sub")}</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="reveal relative rounded-2xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span className="font-mono text-xs font-semibold tracking-widest text-primary">{s.n}</span>
              <h3 className="mt-4 font-display text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              {i < steps.length - 1 && (
                <ArrowRight className="absolute right-4 top-1/2 hidden -translate-y-1/2 text-muted-foreground/30 md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Categories({ t }: { t: (k: string) => string }) {
  const cats = [
    { icon: Dumbbell, label: "Fitness", color: "from-amber-400 to-orange-500" },
    { icon: Heart, label: "Wellness", color: "from-rose-400 to-pink-500" },
    { icon: GraduationCap, label: "Learning", color: "from-sky-400 to-blue-500" },
    { icon: Plane, label: "Travel", color: "from-cyan-400 to-teal-500" },
    { icon: UtensilsCrossed, label: "Food", color: "from-lime-400 to-emerald-500" },
    { icon: Laptop, label: "Technology", color: "from-violet-400 to-indigo-500" },
    { icon: Stethoscope, label: "Healthcare", color: "from-red-400 to-rose-500" },
    { icon: Music, label: "Entertainment", color: "from-fuchsia-400 to-purple-500" },
  ];
  return (
    <section id="features" className="bg-muted/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Categories</p>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{t("cats.title")}</h2>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {cats.map((c, i) => (
            <div
              key={c.label}
              className="reveal card-tilt card-tilt-hover group rounded-2xl border border-border bg-card p-6"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${c.color} text-white shadow-md transition-transform group-hover:scale-110`}>
                <c.icon className="h-6 w-6" />
              </div>
              <p className="mt-4 font-display text-lg font-semibold">{c.label}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                30+ offers
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AIFeatures({ t }: { t: (k: string) => string }) {
  const items = [
    { icon: MessageCircle, t: t("ai.concierge"), d: "Chat in plain Albanian or English. The AI finds, bundles and submits benefits for you." },
    { icon: Compass, t: t("ai.recs"), d: "Personalized picks based on your role, budget and what colleagues love." },
    { icon: Package, t: t("ai.bundle"), d: "Tell it a goal — 'a month of wellness' — get a full multi-vendor package within budget." },
    { icon: BarChart3, t: t("ai.insights"), d: "Employer dashboards surface engagement gaps and money about to expire." },
  ];
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Intelligence</p>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{t("ai.title")}</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {items.map((it, i) => (
            <div
              key={it.t}
              className="reveal flex gap-5 rounded-2xl border border-border bg-card p-7 transition-shadow hover:shadow-md"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-md">
                <it.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">{it.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{it.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ t }: { t: (k: string) => string }) {
  const quotes = [
    {
      q: "We replaced a cluttered HR portal with Perkly and engagement tripled in a quarter.",
      n: "Erida K.",
      r: "Head of People · Vodafone AL",
    },
    {
      q: "My monthly perks are now actually something I look forward to. The AI even bundled a wellness month for me.",
      n: "Genti P.",
      r: "Software engineer",
    },
    {
      q: "Listing our gym on Perkly brought 200+ new members in two months. Payments land instantly.",
      n: "Arian M.",
      r: "Owner · Elite Fitness Tirana",
    },
  ];
  return (
    <section id="providers" className="bg-muted/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Voices</p>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{t("test.title")}</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {quotes.map((q, i) => (
            <figure
              key={q.n}
              className="reveal flex h-full flex-col rounded-2xl border border-border bg-card p-7"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="flex gap-1 text-primary">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-base leading-relaxed">"{q.q}"</blockquote>
              <figcaption className="mt-6 border-t border-border pt-4">
                <p className="font-display font-semibold">{q.n}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{q.r}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="reveal relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-glow p-12 text-primary-foreground shadow-2xl sm:p-16">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_30%,white_0,transparent_30%),radial-gradient(circle_at_80%_70%,white_0,transparent_30%)]" />
          <div className="relative">
            <h2 className="font-display text-4xl font-bold sm:text-5xl">
              Ready to build perks people love?
            </h2>
            <p className="mt-4 max-w-2xl text-lg opacity-90">
              Join the platform reshaping employee benefits across Albania — and soon all of Europe.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary" className="h-12 px-6 text-base">
                <Link to="/auth">Create your free account</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 border-white/30 bg-transparent px-6 text-base text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                <a href="#how">See how it works</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
