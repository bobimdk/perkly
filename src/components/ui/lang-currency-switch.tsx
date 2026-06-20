import { Languages, Coins, Check, ChevronDown } from "lucide-react";
import { useI18n, type Lang, type Currency } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Size = "sm" | "md";

const LANGS: { code: Lang; labels: Record<Lang, string>; flag: string }[] = [
  { code: "en", labels: { en: "English", sq: "Anglisht" }, flag: "🇬🇧" },
  { code: "sq", labels: { en: "Albanian", sq: "Shqip" }, flag: "🇦🇱" },
];

const CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: "ALL", label: "Lek", symbol: "L" },
  { code: "EUR", label: "Euro", symbol: "€" },
];

function pillClasses(size: Size) {
  return cn(
    "inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 backdrop-blur-sm font-medium text-foreground/80 transition-all hover:border-primary/40 hover:bg-card hover:text-foreground hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer",
    size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
  );
}

export function LanguageSwitch({ size = "sm" }: { size?: Size }) {
  const { lang, setLang, t } = useI18n();
  const active = LANGS.find((l) => l.code === lang) ?? LANGS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={pillClasses(size)} aria-label={t("nav.language")}>
        <Languages className="h-3.5 w-3.5 text-primary" />
        <span className="leading-none">{active.flag}</span>
        <span className="font-mono text-[11px] uppercase tracking-wider">{active.code}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <div className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {t("nav.language")}
        </div>
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className="flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <span>{l.flag}</span>
              <span className="font-medium">{l.label}</span>
            </span>
            {lang === l.code && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CurrencySwitch({ size = "sm" }: { size?: Size }) {
  const { currency, setCurrency, t } = useI18n();
  const active = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={pillClasses(size)} aria-label={t("nav.currency")}>
        <Coins className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono text-[11px] uppercase tracking-wider">{active.code}</span>
        <span className="text-muted-foreground">{active.symbol}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <div className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {t("nav.currency")}
        </div>
        {CURRENCIES.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className="flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs">{c.code}</span>
              <span className="text-muted-foreground">· {c.label}</span>
            </span>
            {currency === c.code && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
