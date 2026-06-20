import logo from "@/assets/perkly-logo.png.asset.json";

export function BrandLogo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <img
      src={logo.url}
      alt="Perkly"
      className={`${className} rounded-lg object-cover`}
      draggable={false}
    />
  );
}
