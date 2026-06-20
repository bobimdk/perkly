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
    // Nav
    "nav.features": "Features",
    "nav.how": "How it works",
    "nav.providers": "Providers",
    "nav.signin": "Sign in",
    "nav.getStarted": "Get started",
    "nav.marketplace": "Marketplace",
    "nav.circles": "Circles",
    "nav.drops": "Packages",
    "nav.nearMe": "Near me",
    "nav.dashboard": "Dashboard",
    "nav.language": "Language",
    "nav.currency": "Currency",
    "nav.signOut": "Sign out",

    // Hero
    "hero.badge": "Albania first · Global ready",
    "hero.title.a": "Benefits employees",
    "hero.title.b": "actually want.",
    "hero.sub":
      "Discover personalized perks, wellness programs, travel experiences and exclusive deals — funded directly by your employer.",
    "hero.cta": "Get started",
    "hero.demo": "See live demo",
    "hero.stat.providers": "20+ providers",
    "hero.stat.roles": "4 roles",
    "hero.card.monthly": "Monthly budget",
    "hero.card.used": "Used",
    "hero.card.left": "Left",
    "hero.card.active": "Active",

    // Trust
    "trust.title": "Trusted by forward-thinking teams",

    // How it works
    "how.kicker": "Workflow",
    "how.title": "How Perkly works",
    "how.sub": "Three steps from request to reward.",
    "how.s1.t": "Employee picks",
    "how.s1.d": "Browse the marketplace, build a personal benefits package.",
    "how.s2.t": "Employer approves",
    "how.s2.d": "Auto-rules or one-click approval from the dashboard.",
    "how.s3.t": "Provider gets paid",
    "how.s3.d": "Simulated split payment lands instantly with every provider.",

    // Categories
    "cats.kicker": "Categories",
    "cats.title": "Benefits for every kind of human",
    "cats.offers": "30+ offers",
    "cat.fitness": "Fitness",
    "cat.wellness": "Wellness",
    "cat.learning": "Learning",
    "cat.travel": "Travel",
    "cat.food": "Food",
    "cat.tech": "Technology",
    "cat.healthcare": "Healthcare",
    "cat.entertainment": "Entertainment",

    // AI
    "ai.kicker": "Intelligence",
    "ai.title": "AI that actually helps",
    "ai.concierge": "AI Benefit Concierge",
    "ai.concierge.d": "Chat in plain Albanian or English. The AI finds, bundles and submits benefits for you.",
    "ai.recs": "Smart Recommendations",
    "ai.recs.d": "Personalized picks based on your role, budget and what colleagues love.",
    "ai.bundle": "Smart Bundling",
    "ai.bundle.d": "Tell it a goal — 'a month of wellness' — get a full multi-vendor package within budget.",
    "ai.insights": "Employer Insights",
    "ai.insights.d": "Employer dashboards surface engagement gaps and money about to expire.",

    // Testimonials & CTA
    "test.kicker": "Voices",
    "test.title": "Loved by teams in Tirana and beyond",
    "cta.title": "Ready to build perks people love?",
    "cta.sub": "Join the platform reshaping employee benefits across Albania — and soon all of Europe.",
    "cta.primary": "Create your free account",
    "cta.secondary": "See how it works",

    // Footer
    "footer.tag": "The modern employee benefits marketplace.",
    "footer.madeIn": "Made in Tirana · Built for the world",
    "footer.company": "Company",
    "footer.product": "Product",
    "footer.legal": "Legal",

    // Marketplace index
    "mkt.kicker": "Perkly marketplace",
    "mkt.title.a": "Discover benefits",
    "mkt.title.b": "worth your time",
    "mkt.sub": "From the best gyms in Tirana to spa days, language courses and weekend getaways — handpicked for modern teams.",
    "mkt.search": "Search for yoga, hotels, courses…",
    "mkt.filters": "Filters",
    "mkt.all": "All",
    "mkt.tab.trending": "Trending",
    "mkt.tab.new": "New",
    "mkt.tab.recommended": "Recommended",
    "mkt.tab.limited": "Limited",
    "mkt.empty.title": "No offers match your search",
    "mkt.empty.sub": "Try a different category or search term.",
    "mkt.sponsored.title": "Sponsored",
    "mkt.sponsored.sub": "Hand-picked partners featured for you",

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

    // Map
    "map.title": "Benefits near me",
    "map.sub": "Real-time map of where colleagues are using their perks. Allow location to see the closest businesses to you.",
    "map.useMyLocation": "Use my location",
    "map.locating": "Locating…",
    "map.recenter": "Recenter on me",
    "map.nearestYou": "Nearest to you",
    "map.nearestPyramid": "Nearest to Piramida e Tiranës",
    "map.pyramidHint": "Showing distances from Piramida e Tiranës, Albania. Share your location for exact distances.",
    "map.empty": "No businesses on the map yet.",
    "map.youAreHere": "You are here",
    "map.yourLocation": "your location",
    "map.pyramid": "Piramida e Tiranës",
    "map.from": "from",
    "map.seeMore": "See more →",
    "map.checkIn": "Perk check-in",
    "map.live": "Live",

    // Employee dashboard
    "emp.title": "My benefits",
    "emp.monthly": "Monthly budget",
    "emp.remaining": "remaining",
    "emp.usedOf": "used of",
    "emp.thisMonth": "this month",
    "emp.noBudget": "Your employer hasn't set a budget for this period yet.",
    "emp.builderKicker": "Smart package builder",
    "emp.builderTitle": "Your draft package",
    "emp.addBenefits": "Add benefits",
    "emp.joinCircle": "Join a circle",
    "emp.seasonalDrops": "Seasonal packages",
    "emp.exceedsBudget": "This exceeds your remaining budget by",
    "emp.canStillSubmit": "— you can still submit for approval.",
    "emp.noteHint": "Add a note for your manager (optional)",
    "emp.submitForApproval": "Submit package for approval",
    "emp.activitiesKicker": "Your activities",
    "emp.activitiesTitle": "Approved benefits — show & scan at the venue",
    "emp.noActivities": "Once your employer approves a package, your venue passes appear here with a QR code.",
    "emp.fundedBy": "Funded by",
    "emp.notifications": "Notifications",
    "emp.allCaught": "All caught up. ✨",
    "emp.noCompany.title": "You're not linked to a company yet",
    "emp.noCompany.sub": "Ask your employer to add you using the email on your profile, and your monthly budget will activate immediately.",
    "emp.browseMeanwhile": "Browse the marketplace meanwhile",
    "emp.packageSubmitted": "Package submitted!",
    "emp.noCompanyError": "Ask your employer to add you to their team first.",

    // Package / activity
    "pkg.total": "Total",
    "pkg.items": "Items",
    "pkg.submit": "Send for approval",
    "pkg.empty": "Your package is empty",
    "pkg.emptySub": "Pick benefits from the marketplace and they'll appear here.",
    "pkg.browse": "Browse marketplace",
    "pkg.pending": "Pending approval",
    "pkg.approved": "Approved",
    "pkg.rejected": "Rejected",
    "act.yourActivities": "Your activities",
    "act.showAtVenue": "Show at venue",
    "act.redeemed": "Redeemed",
    "act.ref": "Reference",
  },
  sq: {
    // Nav
    "nav.features": "Veçoritë",
    "nav.how": "Si funksionon",
    "nav.providers": "Ofruesit",
    "nav.signin": "Hyr",
    "nav.getStarted": "Fillo tani",
    "nav.marketplace": "Tregu",
    "nav.circles": "Rrethet",
    "nav.drops": "Paketat",
    "nav.nearMe": "Pranë meje",
    "nav.dashboard": "Paneli",
    "nav.language": "Gjuha",
    "nav.currency": "Monedha",
    "nav.signOut": "Dil",

    // Hero
    "hero.badge": "Shqipëria së pari · Gati për botën",
    "hero.title.a": "Përfitime që punonjësit",
    "hero.title.b": "vërtet i duan.",
    "hero.sub":
      "Zbuloni përfitime të personalizuara, programe wellness, përvoja udhëtimi dhe oferta ekskluzive — të financuara nga punëdhënësi juaj.",
    "hero.cta": "Fillo tani",
    "hero.demo": "Shiko demon",
    "hero.stat.providers": "20+ ofrues",
    "hero.stat.roles": "4 role",
    "hero.card.monthly": "Buxheti mujor",
    "hero.card.used": "Përdorur",
    "hero.card.left": "Mbetur",
    "hero.card.active": "Aktive",

    // Trust
    "trust.title": "Të besuara nga ekipe progresive",

    // How it works
    "how.kicker": "Fluksi i punës",
    "how.title": "Si funksionon Perkly",
    "how.sub": "Tri hapa nga kërkesa te shpërblimi.",
    "how.s1.t": "Punonjësi zgjedh",
    "how.s1.d": "Eksploroni tregun dhe ndërtoni paketën tuaj personale.",
    "how.s2.t": "Punëdhënësi miraton",
    "how.s2.d": "Rregulla automatike ose miratim me një klikim.",
    "how.s3.t": "Ofruesi paguhet",
    "how.s3.d": "Pagesa e simuluar shpërndahet menjëherë te çdo ofrues.",

    // Categories
    "cats.kicker": "Kategori",
    "cats.title": "Përfitime për çdo lloj njeriu",
    "cats.offers": "30+ oferta",
    "cat.fitness": "Fitnes",
    "cat.wellness": "Mirëqenie",
    "cat.learning": "Mësim",
    "cat.travel": "Udhëtim",
    "cat.food": "Ushqim",
    "cat.tech": "Teknologji",
    "cat.healthcare": "Shëndetësi",
    "cat.entertainment": "Argëtim",

    // AI
    "ai.kicker": "Inteligjencë",
    "ai.title": "AI që vërtet ndihmon",
    "ai.concierge": "Koncerzhi i AI",
    "ai.concierge.d": "Bisedo në shqip ose anglisht. AI gjen, paketon dhe dorëzon përfitimet për ty.",
    "ai.recs": "Rekomandime Smart",
    "ai.recs.d": "Zgjedhje të personalizuara sipas rolit, buxhetit dhe asaj që duan kolegët.",
    "ai.bundle": "Paketim Smart",
    "ai.bundle.d": "Thuaji një qëllim — 'një muaj wellness' — dhe merr një paketë të plotë brenda buxhetit.",
    "ai.insights": "Statistika për Punëdhënësin",
    "ai.insights.d": "Panelet e punëdhënësit nxjerrin në pah hendeqet dhe paratë që po skadojnë.",

    // Testimonials & CTA
    "test.kicker": "Zëra",
    "test.title": "I dashur nga ekipet në Tiranë e më gjerë",
    "cta.title": "Gati të ndërtosh përfitime që i duan vërtet?",
    "cta.sub": "Bashkohu me platformën që po riformon përfitimet e punonjësve në Shqipëri — dhe së shpejti në gjithë Evropën.",
    "cta.primary": "Krijo llogarinë tënde falas",
    "cta.secondary": "Shiko si funksionon",

    // Footer
    "footer.tag": "Tregu modern i përfitimeve për punonjësit.",
    "footer.madeIn": "Bërë në Tiranë · Ndërtuar për botën",
    "footer.company": "Kompania",
    "footer.product": "Produkti",
    "footer.legal": "Ligjore",

    // Marketplace index
    "mkt.kicker": "Tregu Perkly",
    "mkt.title.a": "Zbulo përfitime",
    "mkt.title.b": "që ia vlejnë kohën",
    "mkt.sub": "Nga palestrat më të mira në Tiranë te ditët në spa, kurset gjuhësore dhe arratisjet e fundjavës — të zgjedhura me kujdes.",
    "mkt.search": "Kërko për yoga, hotele, kurse…",
    "mkt.filters": "Filtra",
    "mkt.all": "Të gjitha",
    "mkt.tab.trending": "Në trend",
    "mkt.tab.new": "Të reja",
    "mkt.tab.recommended": "Të rekomanduara",
    "mkt.tab.limited": "Të kufizuara",
    "mkt.empty.title": "S'ka oferta që përputhen me kërkimin",
    "mkt.empty.sub": "Provo një kategori ose term tjetër.",
    "mkt.sponsored.title": "Sponsorizuar",
    "mkt.sponsored.sub": "Partnerë të zgjedhur veçanërisht për ty",

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

    // Map
    "map.title": "Përfitime pranë meje",
    "map.sub": "Hartë në kohë reale e vendeve ku kolegët përdorin përfitimet e tyre. Lejo vendndodhjen për të parë bizneset më të afërta.",
    "map.useMyLocation": "Përdor vendndodhjen time",
    "map.locating": "Po vendosemi…",
    "map.recenter": "Qendro te unë",
    "map.nearestYou": "Më të afërt me ty",
    "map.nearestPyramid": "Më të afërt me Piramidën e Tiranës",
    "map.pyramidHint": "Distancat llogariten nga Piramida e Tiranës, Shqipëri. Ndaje vendndodhjen tënde për distanca të sakta.",
    "map.empty": "Ende nuk ka biznese në hartë.",
    "map.youAreHere": "Ti je këtu",
    "map.yourLocation": "vendndodhja jote",
    "map.pyramid": "Piramida e Tiranës",
    "map.from": "nga",
    "map.seeMore": "Shiko më shumë →",
    "map.checkIn": "Përdorim i përfitimit",
    "map.live": "Live",

    // Employee dashboard
    "emp.title": "Përfitimet e mia",
    "emp.monthly": "Buxheti mujor",
    "emp.remaining": "të mbetura",
    "emp.usedOf": "përdorur nga",
    "emp.thisMonth": "këtë muaj",
    "emp.noBudget": "Punëdhënësi yt s'ka caktuar ende një buxhet për këtë periudhë.",
    "emp.builderKicker": "Ndërtuesi smart i paketës",
    "emp.builderTitle": "Paketa jote draft",
    "emp.addBenefits": "Shto përfitime",
    "emp.joinCircle": "Bashkohu një rrethi",
    "emp.seasonalDrops": "Paketat sezonale",
    "emp.exceedsBudget": "Kjo e tejkalon buxhetin e mbetur me",
    "emp.canStillSubmit": "— prapë mund ta dërgosh për miratim.",
    "emp.noteHint": "Shto një shënim për menaxherin (opsionale)",
    "emp.submitForApproval": "Dërgo paketën për miratim",
    "emp.activitiesKicker": "Aktivitetet e tua",
    "emp.activitiesTitle": "Përfitimet e miratuara — trego & skano në vendndodhje",
    "emp.noActivities": "Kur punëdhënësi miraton paketën, pasaportat e vendndodhjes shfaqen këtu me një kod QR.",
    "emp.fundedBy": "Financuar nga",
    "emp.notifications": "Njoftimet",
    "emp.allCaught": "S'ka asgjë të re. ✨",
    "emp.noCompany.title": "Ende nuk je i lidhur me një kompani",
    "emp.noCompany.sub": "Kërkoji punëdhënësit të të shtojë me emailin e profilit, dhe buxheti yt mujor aktivizohet menjëherë.",
    "emp.browseMeanwhile": "Eksploro tregun ndërkohë",
    "emp.packageSubmitted": "Paketa u dërgua!",
    "emp.noCompanyError": "Kërkoji punëdhënësit të të shtojë në ekip së pari.",

    // Package / activity
    "pkg.total": "Totali",
    "pkg.items": "Artikuj",
    "pkg.submit": "Dërgo për miratim",
    "pkg.empty": "Paketa jote është bosh",
    "pkg.emptySub": "Zgjidh përfitime nga tregu dhe ato shfaqen këtu.",
    "pkg.browse": "Eksploro tregun",
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
