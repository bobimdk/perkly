// Default cover image per category slug, used when a provider has no logo.
export const CATEGORY_IMAGE: Record<string, string> = {
  wellness: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&h=120&fit=crop",
  fitness:  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120&h=120&fit=crop",
  food:     "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=120&h=120&fit=crop",
  learning: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=120&h=120&fit=crop",
  travel:   "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=120&h=120&fit=crop",
  health:   "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=120&h=120&fit=crop",
  family:   "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=120&h=120&fit=crop",
  mobility: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=120&h=120&fit=crop",
  tech:     "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=120&h=120&fit=crop",
  beauty:   "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=120&h=120&fit=crop",
};

export const DEFAULT_BUSINESS_IMAGE =
  "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=120&h=120&fit=crop";

export function imageFor(checkIn: { provider_logo?: string | null; category_slug?: string | null }) {
  return checkIn.provider_logo
    || (checkIn.category_slug ? CATEGORY_IMAGE[checkIn.category_slug] : undefined)
    || DEFAULT_BUSINESS_IMAGE;
}
