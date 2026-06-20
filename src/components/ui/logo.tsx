import logoAsset from "@/assets/perkly-logo.png.asset.json";

const SIZES = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
  xl: "h-14 w-14",
};

export function Logo({ size = "md", alt = "Perkly" }: { size?: keyof typeof SIZES; alt?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt={alt}
      className={`${SIZES[size]} rounded-lg object-cover shadow-sm`}
    />
  );
}
