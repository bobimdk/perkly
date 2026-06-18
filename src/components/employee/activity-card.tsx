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
  const { formatPrice } = useI18n();
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
      {/* 16:9 ticket face */}
      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        <div className="absolute inset-0 flex">
          {/* Left: brand + amount */}
          <div className="flex flex-1 flex-col justify-between bg-gradient-to-br from-primary/10 via-card to-card p-5">
            <div className="flex items-center gap-3 min-w-0">
              {tx.providers?.logo_url ? (
                <img src={tx.providers.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
                  <Ticket className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-base font-semibold leading-tight">{tx.offers?.title ?? "Benefit"}</p>
                <p className="truncate text-xs text-muted-foreground">{tx.providers?.name}</p>
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Value</p>
              <p className="font-display text-2xl font-bold">{formatPrice(Number(tx.amount_all))}</p>
            </div>

            <div>
              {redeemed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Redeemed {new Date(tx.redeemed_at!).toLocaleDateString()}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <MapPin className="h-3.5 w-3.5" /> Show at venue
                </span>
              )}
            </div>
          </div>

          {/* Perforation */}
          <div className="relative w-px bg-border">
            <div className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-background" />
            <div className="absolute -left-2 -bottom-2 h-4 w-4 rounded-full bg-background" />
          </div>

          {/* Right: QR */}
          <div className="flex aspect-square flex-col items-center justify-center bg-white p-3">
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
          Issued {new Date(tx.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
