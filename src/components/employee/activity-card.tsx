import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CheckCircle2, MapPin, Ticket } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export type ActivityTx = {
  id: string;
  amount_all: number;
  reference: string | null;
  created_at: string;
  redeemed_at?: string | null;
  providers?: { name: string; logo_url: string | null } | null;
  offers?: { title: string; slug: string } | null;
};

export function ActivityCard({ tx }: { tx: ActivityTx }) {
  const { formatPrice, t, lang } = useI18n();
  const locale = lang === "sq" ? "sq-AL" : "en-IE";
  const [qr, setQr] = useState<string | null>(null);
  const redeemed = !!tx.redeemed_at;

  useEffect(() => {
    const value = tx.reference ?? `PKLY-${tx.id.slice(0, 8).toUpperCase()}`;
    QRCode.toDataURL(value, { margin: 1, width: 240, color: { dark: "#000000", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [tx.reference, tx.id]);

  return (
    <div className={`overflow-hidden rounded-2xl border ${redeemed ? "border-border bg-muted/30 opacity-80" : "border-border bg-card"}`}>
      {/* Stacked on mobile, side-by-side on >=sm */}
      <div className="flex flex-col sm:flex-row">
        {/* Brand + amount */}
        <div className="flex flex-1 flex-col justify-between gap-4 bg-gradient-to-br from-primary/10 via-card to-card p-5">
          <div className="flex items-center gap-3 min-w-0">
            {tx.providers?.logo_url ? (
              <img src={tx.providers.logo_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                <Ticket className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold leading-tight">{tx.offers?.title ?? (lang === "sq" ? "Përfitim" : "Benefit")}</p>
              <p className="truncate text-xs text-muted-foreground">{tx.providers?.name}</p>
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{lang === "sq" ? "Vlera" : "Value"}</p>
            <p className="font-display text-2xl font-bold">{formatPrice(Number(tx.amount_all))}</p>
          </div>

          <div>
            {redeemed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> {t("act.redeemed")} {new Date(tx.redeemed_at!).toLocaleDateString(locale)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <MapPin className="h-3.5 w-3.5" /> {t("act.showAtVenue")}
              </span>
            )}
          </div>
        </div>

        {/* QR code panel */}
        <div className="flex w-full shrink-0 items-center justify-center border-t border-dashed border-border bg-white p-4 sm:w-44 sm:border-l sm:border-t-0">
          <div className="aspect-square w-40 max-w-full">
            {qr ? (
              <img src={qr} alt="Redemption QR" className="h-full w-full object-contain" />
            ) : (
              <div className="h-full w-full animate-pulse bg-muted" />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-dashed border-border px-5 py-2.5">
        <p className="font-mono text-xs font-semibold tracking-wider">
          {tx.reference ?? `PKLY-${tx.id.slice(0, 8).toUpperCase()}`}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {lang === "sq" ? "Lëshuar" : "Issued"} {new Date(tx.created_at).toLocaleDateString(locale)}
        </p>
      </div>
    </div>
  );
}
