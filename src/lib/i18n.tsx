import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "sq" | "en";
export type Currency = "ALL" | "EUR";

type Dict = Record<string, string>;

const dictionaries: Record<Lang, Dict> = {
  en: {
    "nav.features": "Features",
    "nav.how": "How it works",
    "nav.providers": "Providers",
    "nav.signin": "Sign in",
    "nav.getStarted": "Get started",
    "hero.title.a": "Benefits employees",
    "hero.title.b": "actually want.",
    "hero.sub":
      "Discover personalized perks, wellness programs, travel experiences and exclusive deals — funded directly by your employer.",
    "hero.cta": "Get started",
    "hero.demo": "See live demo",
    "how.title": "How Perkly works",
    "how.sub": "Three steps from request to reward.",
    "how.s1.t": "Employee picks",
    "how.s1.d": "Browse the marketplace, build a personal benefits package.",
    "how.s2.t": "Employer approves",
    "how.s2.d": "Auto-rules or one-click approval from the dashboard.",
    "how.s3.t": "Provider gets paid",
    "how.s3.d": "Simulated split payment lands instantly with every provider.",
    "cats.title": "Benefits for every kind of human",
    "ai.title": "AI that actually helps",
    "ai.concierge": "AI Benefit Concierge",
    "ai.recs": "Smart Recommendations",
    "ai.bundle": "Smart Bundling",
    "ai.insights": "Employer Insights",
    "test.title": "Loved by teams in Tirana and beyond",
    "footer.tag": "The modern employee benefits marketplace.",
    // Marketplace / offer detail
    "mk.back": "Back to marketplace",
    "mk.limited": "Limited time",
    "mk.spotsLeft": "spots left",
    "mk.reviews": "reviews",
    "mk.new": "New",
    "mk.about": "About this perk",
    "mk.reviewsTitle": "Reviews",
    "mk.noReviews": "No reviews yet. Be the first to share your experience after you redeem this perk.",
    "mk.addToPackage": "Add to my package",
    "mk.signInPackage": "Sign in to build your package",
    "mk.added": "Added to your package",
    "mk.signInSave": "Sign in to save offers",
    "mk.saved": "Saved",
    "mk.removedFav": "Removed from favorites",
    "mk.saveLater": "Save for later",
    "mk.perk1": "Instant approval via your employer's rules",
    "mk.perk2": "No upfront cost — paid from your monthly budget",
    "mk.perk3": "Confirmation by email and in-app",
    "mk.provider": "Provider",
    // Package / activity
    "pkg.total": "Total",
    "pkg.items": "Items",
    "pkg.submit": "Send for approval",
    "pkg.empty": "Your package is empty",
    "pkg.pending": "Pending approval",
    "pkg.approved": "Approved",
    "pkg.rejected": "Rejected",
    "act.yourActivities": "Your activities",
    "act.showAtVenue": "Show at venue",
    "act.redeemed": "Redeemed",
    "act.ref": "Reference",
  },
  sq: {
    "nav.features": "Veçoritë",
    "nav.how": "Si funksionon",
    "nav.providers": "Ofruesit",
    "nav.signin": "Hyr",
    "nav.getStarted": "Fillo tani",
    "hero.title.a": "Përfitime që punonjësit",
    "hero.title.b": "vërtet i duan.",
    "hero.sub":
      "Zbuloni përfitime të personalizuara, programe wellness, përvoja udhëtimi dhe oferta ekskluzive — të financuara nga punëdhënësi juaj.",
    "hero.cta": "Fillo tani",
    "hero.demo": "Shiko demon",
    "how.title": "Si funksionon Perkly",
    "how.sub": "Tri hapa nga kërkesa te shpërblimi.",
    "how.s1.t": "Punonjësi zgjedh",
    "how.s1.d": "Eksploroni tregun dhe ndërtoni paketën tuaj personale.",
    "how.s2.t": "Punëdhënësi miraton",
    "how.s2.d": "Rregulla automatike ose miratim me një klikim.",
    "how.s3.t": "Ofruesi paguhet",
    "how.s3.d": "Pagesa e simuluar shpërndahet menjëherë te çdo ofrues.",
    "cats.title": "Përfitime për çdo lloj njeriu",
    "ai.title": "AI që vërtet ndihmon",
    "ai.concierge": "Koncerzhi i AI",
    "ai.recs": "Rekomandime Smart",
    "ai.bundle": "Paketim Smart",
    "ai.insights": "Statistika për Punëdhënësin",
    "test.title": "I dashur nga ekipet në Tiranë e më gjerë",
    "footer.tag": "Tregu modern i përfitimeve për punonjësit.",
    // Marketplace / offer detail
    "mk.back": "Kthehu te tregu",
    "mk.limited": "Kohë e kufizuar",
    "mk.spotsLeft": "vende të lira",
    "mk.reviews": "vlerësime",
    "mk.new": "I ri",
    "mk.about": "Rreth kësaj oferte",
    "mk.reviewsTitle": "Vlerësimet",
    "mk.noReviews": "Ende pa vlerësime. Bëhu i pari që ndan përvojën pasi ta përdorësh këtë ofertë.",
    "mk.addToPackage": "Shto në paketën time",
    "mk.signInPackage": "Hyr për të ndërtuar paketën",
    "mk.added": "U shtua në paketën tënde",
    "mk.signInSave": "Hyr për të ruajtur ofertat",
    "mk.saved": "U ruajt",
    "mk.removedFav": "U hoq nga të preferuarat",
    "mk.saveLater": "Ruaj për më vonë",
    "mk.perk1": "Miratim i menjëhershëm sipas rregullave të punëdhënësit",
    "mk.perk2": "Pa kosto paraprake — paguhet nga buxheti yt mujor",
    "mk.perk3": "Konfirmim me email dhe brenda aplikacionit",
    "mk.provider": "Ofruesi",
    // Package / activity
    "pkg.total": "Totali",
    "pkg.items": "Artikuj",
    "pkg.submit": "Dërgo për miratim",
    "pkg.empty": "Paketa jote është bosh",
    "pkg.pending": "Në pritje të miratimit",
    "pkg.approved": "U miratua",
    "pkg.rejected": "U refuzua",
    "act.yourActivities": "Aktivitetet e tua",
    "act.showAtVenue": "Trego në vendndodhje",
    "act.redeemed": "I përdorur",
    "act.ref": "Referenca",
  },
};

// FX: ALL per 1 EUR. Static fallback; can be replaced by live API later.
const FX_RATE_ALL_PER_EUR = 100;

interface I18nContextValue {
  lang: Lang;
  currency: Currency;
  setLang: (l: Lang) => void;
  setCurrency: (c: Currency) => void;
  t: (key: string) => string;
  formatPrice: (amountInALL: number) => string;
  convert: (amount: number, from: Currency, to: Currency) => number;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [currency, setCurrencyState] = useState<Currency>("ALL");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const l = (localStorage.getItem("perkly.lang") as Lang | null) ?? "en";
    const c = (localStorage.getItem("perkly.currency") as Currency | null) ?? "ALL";
    setLangState(l);
    setCurrencyState(c);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("perkly.lang", l);
  };
  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    if (typeof window !== "undefined") localStorage.setItem("perkly.currency", c);
  };

  const t = (key: string) => dictionaries[lang][key] ?? dictionaries.en[key] ?? key;

  const convert = (amount: number, from: Currency, to: Currency) => {
    if (from === to) return amount;
    if (from === "ALL" && to === "EUR") return amount / FX_RATE_ALL_PER_EUR;
    return amount * FX_RATE_ALL_PER_EUR;
  };

  const formatPrice = (amountInALL: number) => {
    const value = convert(amountInALL, "ALL", currency);
    if (currency === "ALL") {
      return `${Math.round(value).toLocaleString("sq-AL")} ALL`;
    }
    return `€${value.toLocaleString("en-IE", { maximumFractionDigits: 2 })}`;
  };

  const value = useMemo<I18nContextValue>(
    () => ({ lang, currency, setLang, setCurrency, t, formatPrice, convert }),
    [lang, currency],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
