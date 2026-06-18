import { Link } from "@tanstack/react-router";
import { useI18n, type Lang, type Currency } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { Gift, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MarketingNav() {
  const { t, lang, currency, setLang, setCurrency } = useI18n();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-sm">
            <Gift className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">Perkly</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/marketplace" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Marketplace
          </Link>
          <Link to="/circles" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Circles
          </Link>
          <Link to="/drops" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Drops
          </Link>
          <Link to="/map" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Near me
          </Link>
          <a href="/#how" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            {t("nav.how")}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="hidden items-center gap-1 rounded-md px-2 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:bg-muted sm:flex">
              {lang} · {currency} <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setLang("en" as Lang)}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLang("sq" as Lang)}>Shqip</DropdownMenuItem>
              <div className="my-1 h-px bg-border" />
              <DropdownMenuItem onClick={() => setCurrency("ALL" as Currency)}>ALL (Lek)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrency("EUR" as Currency)}>EUR (€)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <Button asChild variant="default" size="sm">
              <Link to="/auth">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">{t("nav.signin")}</Link>
              </Button>
              <Button asChild size="sm" className="shadow-sm">
                <Link to="/auth">{t("nav.getStarted")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
              <Gift className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold">Perkly</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{t("footer.tag")}</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Made in Tirana · Built for the world
          </p>
        </div>
        <FooterCol title="Company" items={["About", "Careers", "Press", "Contact"]} />
        <FooterCol title="Product" items={["Marketplace", "AI Concierge", "For Employers", "For Providers"]} />
        <FooterCol title="Legal" items={["Privacy", "Terms", "Security", "DPA"]} />
      </div>
      <div className="border-t border-border/60 py-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        © {new Date().getFullYear()} Perkly · All rights reserved
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i}>
            <a href="#" className="hover:text-foreground">
              {i}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
