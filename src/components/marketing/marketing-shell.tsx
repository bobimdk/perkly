import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { Gift, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitch, CurrencySwitch } from "@/components/ui/lang-currency-switch";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export function MarketingNav() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const navLinks = (
    <>
      <Link to="/marketplace" onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        {t("nav.marketplace")}
      </Link>
      <Link to="/circles" onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        {t("nav.circles")}
      </Link>
      <Link to="/drops" onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        {t("nav.drops")}
      </Link>
      <Link to="/map" onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        {t("nav.nearMe")}
      </Link>
      <a href="/#how" onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        {t("nav.how")}
      </a>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-sm">
            <Gift className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">Perkly</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">{navLinks}</nav>

        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1.5 sm:flex">
            <LanguageSwitch />
            <CurrencySwitch />
          </div>

          {user ? (
            <Button asChild variant="default" size="sm">
              <Link to="/auth">{t("nav.dashboard")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">{t("nav.signin")}</Link>
              </Button>
              <Button asChild size="sm" className="shadow-sm hidden sm:inline-flex">
                <Link to="/auth">{t("nav.getStarted")}</Link>
              </Button>
            </>
          )}

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="mt-8 flex flex-col gap-5">
                {navLinks}
                <div className="flex items-center gap-2 pt-2">
                  <LanguageSwitch />
                  <CurrencySwitch />
                </div>
                {!user && (
                  <div className="flex flex-col gap-2 pt-2">
                    <Button asChild variant="outline" onClick={() => setOpen(false)}>
                      <Link to="/auth">{t("nav.signin")}</Link>
                    </Button>
                    <Button asChild onClick={() => setOpen(false)}>
                      <Link to="/auth">{t("nav.getStarted")}</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

type FooterLink = { label: string; to?: string; href?: string };

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
            {t("footer.madeIn")}
          </p>
        </div>
        <FooterCol
          title={t("footer.company")}
          items={[
            { label: "About", href: "/#how" },
            { label: "Contact", href: "mailto:hello@perkly.al" },
          ]}
        />
        <FooterCol
          title={t("footer.product")}
          items={[
            { label: "Marketplace", to: "/marketplace" },
            { label: "Circles", to: "/circles" },
            { label: "Drops", to: "/drops" },
            { label: "Near me", to: "/map" },
          ]}
        />
        <FooterCol
          title={t("footer.legal")}
          items={[
            { label: "Privacy", href: "/#how" },
            { label: "Terms", href: "/#how" },
          ]}
        />
      </div>
      <div className="border-t border-border/60 py-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        © {new Date().getFullYear()} Perkly · All rights reserved
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: FooterLink[] }) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i.label}>
            {i.to ? (
              <Link to={i.to} className="hover:text-foreground">
                {i.label}
              </Link>
            ) : (
              <a href={i.href ?? "#"} className="hover:text-foreground">
                {i.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
