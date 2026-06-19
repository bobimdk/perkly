import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Mail, CheckCircle2, XCircle, Gift } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { fetchNotifications, markNotificationRead } from "@/lib/perkly";

function iconFor(kind: string) {
  if (kind === "request_approved" || kind === "invite_accepted")
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (kind === "request_rejected" || kind === "invite_rejected")
    return <XCircle className="h-4 w-4 text-destructive" />;
  if (kind === "company_invite") return <Mail className="h-4 w-4 text-primary" />;
  if (kind === "gift_received") return <Gift className="h-4 w-4 text-primary" />;
  return <Bell className="h-4 w-4 text-primary" />;
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "tani";
  if (m < 60) return `${m} min më parë`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} orë më parë`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} ditë më parë`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationsBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const q = useQuery({
    queryKey: ["notifications-bell", user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["notifications-bell", user.id] });
          qc.invalidateQueries({ queryKey: ["my-notifications", user.id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const list = q.data ?? [];
  const unread = list.filter((n) => !n.is_read).length;

  const handleClick = async (n: { id: string; href: string | null; is_read: boolean }) => {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      qc.invalidateQueries({ queryKey: ["notifications-bell", user?.id] });
      qc.invalidateQueries({ queryKey: ["my-notifications", user?.id] });
    }
    if (n.href) navigate({ to: n.href });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Njoftimet">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border p-3">
          <p className="font-display text-sm font-semibold">Njoftimet</p>
          <p className="text-xs text-muted-foreground">
            {unread > 0 ? `${unread} të palexuara` : "Të gjitha të lexuara"}
          </p>
        </div>
        {!user ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Hyni në llogarinë tuaj për të parë njoftimet.
          </p>
        ) : list.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Nuk keni njoftime.</p>
        ) : (
          <ScrollArea className="max-h-80">
            <ul className="divide-y divide-border">
              {list.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`cursor-pointer p-3 text-sm transition-colors hover:bg-muted/60 ${
                    n.is_read ? "" : "bg-primary/5"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">{iconFor(n.kind)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-tight">{n.title}</p>
                      {n.body ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      ) : null}
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-hidden />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
