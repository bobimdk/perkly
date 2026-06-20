import { Link } from "@tanstack/react-router";
import { Heart, Star, MapPin, Clock, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { OfferRow } from "@/lib/marketplace";

export function OfferCard({
  offer,
  isFavorite,
  onToggleFavorite,
  highlighted,
}: {
  offer: OfferRow;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  highlighted?: boolean;
}) {
  const { formatPrice, lang } = useI18n();
  const categoryName = offer.categories ? (lang === "sq" ? offer.categories.name_sq : offer.categories.name_en) : null;

  return (
    <Link
      to="/marketplace/$slug"
      params={{ slug: offer.slug }}
      className="card-tilt card-tilt-hover group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {offer.cover_url ? (
          <img
            src={offer.cover_url}
            alt={offer.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {offer.providers?.is_sponsored ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-950 shadow">
              <Star className="h-3 w-3 fill-current" /> Sponsored
            </span>
          ) : null}
          {offer.is_limited_time ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive-foreground">
              <Clock className="h-3 w-3" /> Limited
            </span>
          ) : null}
          {offer.is_featured ? (
            <span className="rounded-full bg-primary/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
              Featured
            </span>
          ) : null}
          {categoryName ? (
            <span className="rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
              {categoryName}
            </span>
          ) : null}
        </div>
        {onToggleFavorite ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(offer.id);
            }}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/85 backdrop-blur transition-transform hover:scale-110"
            aria-label="Save offer"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-destructive text-destructive" : "text-foreground"}`} />
          </button>
        ) : null}
        {offer.discount_percent && offer.discount_percent > 0 ? (
          <div className="absolute bottom-3 right-3 rounded-full bg-success px-2.5 py-1 text-xs font-bold text-success-foreground">
            -{offer.discount_percent}%
          </div>
        ) : null}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {offer.providers?.logo_url ? (
            <img src={offer.providers.logo_url} alt="" className="h-5 w-5 rounded-full object-cover" />
          ) : null}
          <span className="truncate font-medium">{offer.providers?.name}</span>
          {offer.city ? (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {offer.city}</span>
            </>
          ) : null}
        </div>
        <h3 className="font-display text-lg font-semibold leading-tight">{offer.title}</h3>
        {offer.subtitle ? <p className="text-xs text-muted-foreground line-clamp-1">{offer.subtitle}</p> : null}
        <div className="flex items-end justify-between pt-1">
          <div>
            {offer.original_price_all && offer.original_price_all > offer.price_all ? (
              <p className="text-xs text-muted-foreground line-through">{formatPrice(offer.original_price_all)}</p>
            ) : null}
            <p className="font-display text-xl font-bold text-primary">{formatPrice(offer.price_all)}</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 text-xs font-medium">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              {offer.rating_avg ? offer.rating_avg.toFixed(1) : "New"}
              {offer.rating_count > 0 ? <span className="text-muted-foreground">({offer.rating_count})</span> : null}
            </div>
            {offer.remaining != null && offer.is_limited_time ? (
              <p className="mt-1 text-[10px] uppercase tracking-wider text-destructive">{offer.remaining} left</p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
