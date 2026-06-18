import { useState } from "react";
import { Gift, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { findUserByEmail, sendGift } from "@/lib/phase5";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export function GiftDialog() {
  const { formatPrice } = useI18n();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [amount, setAmount] = useState(1000);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!email) return;
    const data = await findUserByEmail(email);
    setResults(data);
  };
  const send = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await sendGift(selected.id, amount, message);
      toast.success(`Sent ${formatPrice(amount)} to ${selected.first_name ?? selected.email}!`);
      setOpen(false);
      setSelected(null);
      setMessage("");
      setEmail("");
      setResults([]);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Gift className="mr-2 h-4 w-4" /> Gift a colleague
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gift perks to a colleague</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!selected ? (
            <>
              <div className="flex gap-2">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email…" />
                <Button onClick={search} variant="secondary"><Search className="h-4 w-4" /></Button>
              </div>
              <ul className="space-y-2">
                {results.map((r) => (
                  <li
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="cursor-pointer rounded-lg border border-border bg-card p-3 text-sm hover:bg-muted"
                  >
                    <div className="font-medium">{r.first_name} {r.last_name}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </li>
                ))}
                {email && results.length === 0 && (
                  <li className="text-xs text-muted-foreground">No matches. Search for an exact email.</li>
                )}
              </ul>
            </>
          ) : (
            <>
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">{selected.first_name} {selected.last_name}</p>
                <p className="text-xs text-muted-foreground">{selected.email}</p>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Amount (ALL)</label>
                <Input type="number" min={100} step={100} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                <p className="mt-1 text-xs text-muted-foreground">{formatPrice(amount)} will move from your budget to theirs.</p>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Message</label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Happy birthday! 🎂" rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setSelected(null)}>Back</Button>
                <Button onClick={send} disabled={loading || amount <= 0}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
                  Send gift
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
