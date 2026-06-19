import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

// Default Leaflet marker icons (CDN)
const ICON = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const PIRAMIDA: [number, number] = [41.3236, 19.8197];

export function LocationPickerDialog({
  open,
  onOpenChange,
  initialLat,
  initialLng,
  initialAddress,
  onPicked,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string | null;
  onPicked: (loc: { lat: number; lng: number; address: string }) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(() => ({
    lat: initialLat ?? PIRAMIDA[0],
    lng: initialLng ?? PIRAMIDA[1],
  }));
  const [address, setAddress] = useState(initialAddress ?? "");
  const [reverseBusy, setReverseBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      if (!containerRef.current || mapRef.current) return;
      const start: [number, number] = [coords.lat, coords.lng];
      const map = L.map(containerRef.current).setView(start, 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker(start, { icon: ICON, draggable: true }).addTo(map);
      markerRef.current = marker;
      mapRef.current = map;

      const setFrom = (lat: number, lng: number) => {
        setCoords({ lat, lng });
        reverseLookup(lat, lng);
      };

      marker.on("dragend", () => {
        const ll = marker.getLatLng();
        setFrom(ll.lat, ll.lng);
      });
      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        setFrom(e.latlng.lat, e.latlng.lng);
      });
    }, 50);

    return () => {
      window.clearTimeout(t);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reverseLookup = async (lat: number, lng: number) => {
    setReverseBusy(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "sq,en" } },
      );
      const json = await res.json();
      if (json?.display_name) setAddress(json.display_name as string);
    } catch {
      // Silent - user can type it
    } finally {
      setReverseBusy(false);
    }
  };

  const confirm = () => {
    if (!address.trim()) {
      toast.error("Shkruani ose zgjidhni një adresë");
      return;
    }
    onPicked({ lat: coords.lat, lng: coords.lng, address: address.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Zgjidhni vendndodhjen në hartë
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Klikoni kudo në hartë për të vendosur shenjën, ose zvarriteni atë te vendndodhja e saktë e biznesit tuaj.
        </p>
        <div
          ref={containerRef}
          className="h-[420px] w-full overflow-hidden rounded-xl border border-border"
          style={{ position: "relative" }}
        />
        <div className="grid gap-3 sm:grid-cols-[1fr_140px_140px]">
          <div className="space-y-1.5">
            <Label>Adresa</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adresa e biznesit"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Gjerësia (Lat)</Label>
            <Input value={coords.lat.toFixed(6)} readOnly />
          </div>
          <div className="space-y-1.5">
            <Label>Gjatësia (Lng)</Label>
            <Input value={coords.lng.toFixed(6)} readOnly />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anulo
          </Button>
          <Button onClick={confirm} disabled={reverseBusy}>
            {reverseBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Konfirmo vendndodhjen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
