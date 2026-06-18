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
    if (!tx.reference) return;
    QRCode.toDataURL(tx.reference, { margin: 1, width: 220, color: { dark: "#000000", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [tx.reference]);

  return (
    <div className={`overflow-hidden rounded-2xl border ${redeemed ? "border-border bg-muted/30 opacity-75" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between border-b border-dashed border-border px-5 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {tx.providers?.logo_url ? (
            <img src={tx.providers.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
              <Ticket className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-display font-semibold">{tx.offers?.title ?? "Benefit"}</p>
            <p className="truncate text-xs text-muted-foreground">{tx.providers?.name}</p>
          </div>
        </div>
        <span className="font-display font-semibold">{formatPrice(Number(tx.amount_all))}</span>
      </div>

      <div className="flex items-center gap-5 p-5">
        <div className="grid h-32 w-32 flex-shrink-0 place-items-center rounded-xl bg-white p-2">
          {qr ? <img src={qr} alt="Redemption QR" className="h-full w-full" /> : <div className="h-full w-full animate-pulse bg-muted" />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Show this at the venue</p>
            <p className="mt-1 font-mono text-base font-bold tracking-wider">{tx.reference}</p>
          </div>
          {redeemed ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Redeemed {new Date(tx.redeemed_at!).toLocaleDateString()}
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <MapPin className="h-3.5 w-3.5" /> Ready to use
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Issued {new Date(tx.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
