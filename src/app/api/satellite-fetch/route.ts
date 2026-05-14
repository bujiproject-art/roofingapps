// Satellite tile fetch — POST { lat, lng, zoom? } → { image_url, _source, _placeholder }.
//
// Tier order:
//   1. EAGLEVIEW_API_KEY → EagleView (stub — real integration pending product confirmation)
//   2. NEARMAP_API_KEY   → Nearmap (stub — same)
//   3. GOOGLE_MAPS_API_KEY → Google Static Maps satellite tile at requested zoom
//   4. None → free Esri World Imagery tile (no auth, attribution required)
//
// Tiers 1 & 2 are stubs that return the Google URL when their key is set, so a
// future dispatch can swap them in without changing callers. Tier 3 builds a
// signed-style URL Google's docs accept. Tier 4 mirrors /api/satellite's tile.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSetting, audit } from '@/lib/revo/admin-settings';

function deg2tile(lat: number, lon: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  const n = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) * (n / 2));
  return { x, y };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const zoom = Math.min(Math.max(Number(body?.zoom || 19), 14), 19);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat + lng required' }, { status: 400 });
  }

  const [eagle, nearmap, google] = await Promise.all([
    getSetting('EAGLEVIEW_API_KEY'),
    getSetting('NEARMAP_API_KEY'),
    getSetting('GOOGLE_MAPS_API_KEY'),
  ]);

  // Tier 3 — Google Static Maps (real when key set)
  if (google) {
    const url = new URL('https://maps.googleapis.com/maps/api/staticmap');
    url.searchParams.set('center', `${lat},${lng}`);
    url.searchParams.set('zoom', String(zoom));
    url.searchParams.set('size', '640x640');
    url.searchParams.set('maptype', 'satellite');
    url.searchParams.set('scale', '2');
    url.searchParams.set('key', google);
    const source: 'eagleview' | 'nearmap' | 'google' = eagle ? 'eagleview' : nearmap ? 'nearmap' : 'google';
    await audit(user.id, 'satellite.fetch', `${lat},${lng}`, { _source: source, zoom });
    return NextResponse.json({
      image_url: url.toString(),
      lat,
      lng,
      zoom,
      _source: source,
      _placeholder: source !== 'google', // EagleView/Nearmap are stubbed via Google
      attribution: 'Imagery © Google',
    });
  }

  // Tier 4 — Esri free fallback (no key required)
  const { x, y } = deg2tile(lat, lng, zoom);
  const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
  await audit(user.id, 'satellite.fetch', `${lat},${lng}`, { _source: 'esri', zoom });
  return NextResponse.json({
    image_url: tileUrl,
    lat,
    lng,
    zoom,
    _source: 'esri',
    _placeholder: true,
    attribution: 'Tiles © Esri — Source: Maxar, Earthstar Geographics, USDA FSA, USGS',
  });
}
