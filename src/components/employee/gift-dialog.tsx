import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gift, Loader2, ArrowLeft, UserPlus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fetchFriends, sendGift, type ProfileLite } from "@/lib/phase5";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export function GiftDialog() {
  const { formatPrice } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ProfileLite | null>(null);
  const [amount, setAmount] = useState<string>("1000");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const friendsQ = useQuery({
    queryKey: ["friends", user?.id],
    queryFn: () => fetchFriends(user!.id),
    enabled: !!user && open,
  });

  const send = async () => {
    if (!selected) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      await sendGift(selected.id, amt, message);
      toast.success(`Sent ${formatPrice(amt)} to ${selected.first_name ?? selected.username}!`);
      setOpen(false);
      setSelected(null);
      setMessage("");
      setAmount("1000");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const friends = (friendsQ.data ?? []).map((f) => f.other!).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelected(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Gift className="mr-2 h-4 w-4" /> Send a gift
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selected ? "Send gift" : "Pick a friend"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!selected ? (
            <>
              {friendsQ.isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : friends.length === 0 ? (
                <div className="space-y-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground">You don't have any friends in your network yet.</p>
                  <Button asChild size="sm" onClick={() => setOpen(false)}>
                    <Link to="/network"><UserPlus className="mr-2 h-4 w-4" /> Add friends</Link>
                  </Button>
                </div>
              ) : (
                <ul className="max-h-80 space-y-2 overflow-y-auto">
                  {friends.map((f) => (
                    <li
                      key={f.id}
                      onClick={() => setSelected(f)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow font-display text-sm font-bold text-primary-foreground">
                        {f.avatar_url ? (
                          <img src={f.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          (f.first_name?.[0] ?? f.username?.[0] ?? "U").toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {f.first_name} {f.last_name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {f.role_title || f.company_name || f.email}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow font-display text-sm font-bold text-primary-foreground">
                  {selected.avatar_url ? (
                    <img src={selected.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    (selected.first_name?.[0] ?? selected.username?.[0] ?? "U").toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{selected.first_name} {selected.last_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{selected.role_title || selected.email}</p>
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Amount (ALL)</label>
                <Input type="number" min={100} step={100} value={amount} onChange={(e) => setAmount(e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">{formatPrice(Number(amount) || 0)} will be transferred from your budget.</p>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Message</label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Happy birthday! 🎂" rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setSelected(null)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={send} disabled={loading || !amount || Number(amount) <= 0}>
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
