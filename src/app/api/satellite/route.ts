// Server-side satellite-imagery proxy.
//
// Geocodes an address via Nominatim (free, no key), then returns Esri World
// Imagery tile URLs for client-side rendering plus a single-tile satellite PNG
// for direct <img> embedding. Esri allows free non-commercial use with
// attribution.
//
// Why proxy instead of direct client → tile server: same reasons as
// /api/geocode (User-Agent enforcement, provider swap, abuse prevention).
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Web-Mercator deg→tile helpers (z/x/y XYZ scheme)
function deg2tile(lat: number, lon: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  const n = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) * (n / 2));
  return { x, y };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const address = url.searchParams.get('address');
  const latParam = url.searchParams.get('lat');
  const lonParam = url.searchParams.get('lon');
  const zoom = Math.min(Math.max(Number(url.searchParams.get('zoom') || 19), 1), 19);

  let lat: number | null = null;
  let lon: number | null = null;

  if (latParam && lonParam) {
    lat = Number(latParam);
    lon = Number(lonParam);
  } else if (address) {
    // Forward geocode the address
    try {
      const nomUrl = new URL('https://nominatim.openstreetmap.org/search');
      nomUrl.searchParams.set('q', address);
      nomUrl.searchParams.set('format', 'json');
      nomUrl.searchParams.set('limit', '1');
      const res = await fetch(nomUrl.toString(), {
        headers: {
          'User-Agent': 'RevoRoofingAI/1.0 (https://revoroofing.agentmidas.co)',
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
      if (!res.ok) return NextResponse.json({ error: `Geocoder ${res.status}` }, { status: 502 });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        lat = Number(data[0].lat);
        lon = Number(data[0].lon);
      }
    } catch (err) {
      console.error('[satellite] geocode error', err);
    }
  }

  if (lat === null || lon === null || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'Could not resolve coordinates' }, { status: 404 });
  }

  // Esri World Imagery tile (free, attribution required)
  const { x, y } = deg2tile(lat, lon, zoom);
  const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;

  // Embedded leaflet-ready payload
  return NextResponse.json({
    lat,
    lon,
    zoom,
    tile: { x, y, z: zoom, url: tileUrl },
    // 3x3 grid of tile URLs for stitched view at higher quality
    grid: [-1, 0, 1].flatMap((dy) =>
      [-1, 0, 1].map((dx) => ({
        dx,
        dy,
        url: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y + dy}/${x + dx}`,
      })),
    ),
    attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, USDA FSA, USGS, AeroGRID, IGN',
  });
}
