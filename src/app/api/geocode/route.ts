// Server-side reverse geocoding proxy.
//
// Uses OpenStreetMap Nominatim — free, no API key required, with a 1 req/sec
// rate limit and a required User-Agent. We proxy here (not direct from the
// browser) so:
//   1. The User-Agent is set correctly (Nominatim rejects browsers).
//   2. We can swap providers (Mapbox, Google) without changing client code.
//
// Returns a shape compatible with the form's address autofill consumer.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // Require authenticated user — keeps the route from being a public abuse target
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  if (!lat || !lon) return NextResponse.json({ error: 'lat + lon required' }, { status: 400 });

  // Validate numeric range
  const latN = Number(lat);
  const lonN = Number(lon);
  if (!Number.isFinite(latN) || latN < -90 || latN > 90)
    return NextResponse.json({ error: 'invalid lat' }, { status: 400 });
  if (!Number.isFinite(lonN) || lonN < -180 || lonN > 180)
    return NextResponse.json({ error: 'invalid lon' }, { status: 400 });

  try {
    const nomUrl = new URL('https://nominatim.openstreetmap.org/reverse');
    nomUrl.searchParams.set('lat', String(latN));
    nomUrl.searchParams.set('lon', String(lonN));
    nomUrl.searchParams.set('format', 'json');
    nomUrl.searchParams.set('addressdetails', '1');

    const res = await fetch(nomUrl.toString(), {
      headers: {
        'User-Agent': 'RevoRoofingAI/1.0 (https://revoroofing.agentmidas.co)',
        Accept: 'application/json',
      },
      // Don't cache — locations change frequently
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Geocoder ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    // Map Nominatim's `address` object to the simpler shape our form expects
    const a = (data?.address ?? {}) as Record<string, string>;
    return NextResponse.json({
      address: {
        house_number: a.house_number || null,
        road: a.road || a.pedestrian || null,
        city: a.city || a.town || a.village || a.hamlet || null,
        state: a.state || null,
        state_code: a['ISO3166-2-lvl4']?.split('-')[1] || null,
        postcode: a.postcode || null,
        country: a.country || null,
        display_name: data.display_name || null,
      },
      lat: latN,
      lon: lonN,
    });
  } catch (err) {
    console.error('[geocode]', err);
    return NextResponse.json({ error: 'Geocoder unavailable' }, { status: 502 });
  }
}
