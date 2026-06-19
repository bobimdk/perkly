import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toggleFavorite } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

export function FavoriteToggle({
  offerId,
  className,
  size = 18,
}: {
  offerId: string;
  className?: string;
  size?: number;
}) {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsFav(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("offer_id", offerId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsFav(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [user, offerId]);

  const click = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Hyni në llogarinë tuaj për të ruajtur të preferuarat");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const next = await toggleFavorite(offerId, user.id);
      setIsFav(next);
      toast.success(next ? "Shtuar te të preferuarat" : "Hequr nga të preferuarat");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={click}
      aria-label={isFav ? "Hiq nga të preferuarat" : "Shto te të preferuarat"}
      aria-pressed={!!isFav}
      className={cn(
        "grid place-items-center rounded-full bg-background/90 backdrop-blur transition-transform hover:scale-110 shadow-sm",
        className,
      )}
      style={{ width: size + 18, height: size + 18 }}
    >
      <Heart
        size={size}
        className={cn(
          "transition-colors",
          isFav ? "fill-destructive text-destructive" : "text-foreground",
        )}
      />
    </button>
  );
}
