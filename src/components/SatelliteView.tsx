'use client';
import { useEffect, useState } from 'react';
import { Loader2, Satellite, AlertCircle } from 'lucide-react';

interface SatelliteResponse {
  lat: number;
  lon: number;
  zoom: number;
  grid: { dx: number; dy: number; url: string }[];
  attribution: string;
}

interface Props {
  /** Either pass a full address string OR explicit lat/lon. */
  address?: string;
  lat?: number;
  lon?: number;
  /** Default zoom = 19 (rooftop-level). Range 1-19. */
  zoom?: number;
  className?: string;
}

/**
 * Renders a 3×3 stitched satellite-image grid of any address using free
 * Esri World Imagery tiles via /api/satellite. Falls back to a friendly
 * "couldn't resolve" message when the address can't be geocoded.
 */
export function SatelliteView({ address, lat, lon, zoom = 19, className }: Props) {
  const [data, setData] = useState<SatelliteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (address) params.set('address', address);
    if (typeof lat === 'number') params.set('lat', String(lat));
    if (typeof lon === 'number') params.set('lon', String(lon));
    params.set('zoom', String(zoom));

    setLoading(true);
    setError(null);
    fetch(`/api/satellite?${params.toString()}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
        setData(body as SatelliteResponse);
      })
      .catch((err) => setError(err.message || 'Satellite unavailable'))
      .finally(() => setLoading(false));
  }, [address, lat, lon, zoom]);

  if (loading) {
    return (
      <div className={`relative aspect-square bg-black/40 rounded-xl border border-[#E5E9F2]/10 flex items-center justify-center ${className || ''}`}>
        <div className="flex items-center gap-2 text-[#E5E9F2]/50 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading satellite…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`relative aspect-square bg-black/40 rounded-xl border border-[#E5E9F2]/10 flex items-center justify-center ${className || ''}`}>
        <div className="text-center px-6">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[#E5E9F2]/30" />
          <div className="text-sm text-[#E5E9F2]/50">
            {error || 'Could not load satellite imagery'}
          </div>
        </div>
      </div>
    );
  }

  // 3×3 grid stitched together — sorts dy ascending (top→bottom), dx ascending (left→right)
  const tiles = [...data.grid].sort((a, b) => a.dy - b.dy || a.dx - b.dx);

  return (
    <div className={`relative aspect-square overflow-hidden rounded-xl border border-[#E5E9F2]/10 ${className || ''}`}>
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
        {tiles.map((t) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={`${t.dx}_${t.dy}`}
            src={t.url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ))}
      </div>

      {/* Center crosshair pin */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[#D4A24C] shadow-[0_0_20px_rgba(212,162,76,0.6)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#D4A24C] rounded-full" />
        </div>
      </div>

      {/* Label badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-md border border-[#E5E9F2]/10">
        <Satellite className="w-3 h-3 text-[#D4A24C]" />
        <span className="text-[10px] uppercase tracking-widest text-[#E5E9F2]/80">
          Satellite — zoom {data.zoom}
        </span>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-1 right-1.5 text-[8px] text-white/60 bg-black/40 px-1.5 rounded">
        {data.attribution.split('—')[0].trim()}
      </div>
    </div>
  );
}
