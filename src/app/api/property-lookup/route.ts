// Property-lookup endpoint — POST { lat, lng } → property record.
//
// Tier 1: ATTOM API (real data when ATTOM_API_KEY is set in revo_admin_settings)
// Tier 2: Realistic placeholder with reverse-geocoded address via Nominatim
//         + deterministic-but-plausible owner / year built / sqft / value.
//
// Every response gets `_placeholder` and `_source`. Every call writes an audit
// row so Paul can see whether real ATTOM fired or the demo fallback did.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSetting, audit } from '@/lib/revo/admin-settings';

interface PropertyRecord {
  address: string;
  city: string;
  state: string;
  zip: string;
  owner_name: string;
  year_built: number;
  square_feet: number;
  estimated_value: number;
  tax_plot_id: string;
  _placeholder: boolean;
  _source: 'attom' | 'placeholder' | 'manual';
}

function seededRandom(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string; state: string; zip: string }> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'RevoRoofingAI/1.0 (https://revoroofing.agentmidas.co)', Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const data = await res.json();
    const a = (data?.address ?? {}) as Record<string, string>;
    const street = a.house_number && a.road ? `${a.house_number} ${a.road}` : (a.road || '');
    return {
      address: street,
      city: a.city || a.town || a.village || a.hamlet || '',
      state: (a['ISO3166-2-lvl4'] || '').split('-')[1] || a.state || '',
      zip: a.postcode || '',
    };
  } catch {
    return { address: '', city: '', state: '', zip: '' };
  }
}

const SAMPLE_OWNER_FIRSTS = ['Robert', 'Maria', 'James', 'Linda', 'David', 'Patricia', 'Michael', 'Jennifer', 'Daniel', 'Sandra', 'Tom', 'Karen', 'Marcus', 'Angela'];
const SAMPLE_OWNER_LASTS = ['Reyes', 'Cooper', 'Walsh', 'Bennett', 'Holloway', 'Park', 'Sandoval', 'Reyes', 'Whitfield', 'Garrett', 'Bowman', 'Maldonado'];

function placeholderFor(lat: number, lng: number, geo: { address: string; city: string; state: string; zip: string }): PropertyRecord {
  const seed = Math.abs(Math.round(lat * 1e6) ^ Math.round(lng * 1e6)) || 1;
  const rnd = seededRandom(seed);
  const owner = `${SAMPLE_OWNER_FIRSTS[Math.floor(rnd() * SAMPLE_OWNER_FIRSTS.length)]} ${SAMPLE_OWNER_LASTS[Math.floor(rnd() * SAMPLE_OWNER_LASTS.length)]}`;
  const year_built = 1985 + Math.floor(rnd() * 30); // 1985-2014
  const square_feet = 1500 + Math.floor(rnd() * 2001); // 1500-3500
  const estimated_value = 250000 + Math.floor(rnd() * 400001); // 250k-650k
  const plotId = `R-${seed.toString(16).slice(-8).toUpperCase()}`;
  return {
    address: geo.address || 'Property at captured coordinates',
    city: geo.city || 'Unknown',
    state: geo.state || '',
    zip: geo.zip || '',
    owner_name: owner,
    year_built,
    square_feet,
    estimated_value,
    tax_plot_id: plotId,
    _placeholder: true,
    _source: 'placeholder',
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat + lng required' }, { status: 400 });
  }

  const attomKey = await getSetting('ATTOM_API_KEY');
  const geo = await reverseGeocode(lat, lng);

  // Tier 1 — real ATTOM. Best-effort; fall back to placeholder on any error.
  if (attomKey) {
    try {
      const url = new URL('https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail');
      url.searchParams.set('latitude', String(lat));
      url.searchParams.set('longitude', String(lng));
      const res = await fetch(url.toString(), {
        headers: { apikey: attomKey, Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const prop = data?.property?.[0];
        if (prop) {
          const record: PropertyRecord = {
            address: [prop.address?.line1, prop.address?.line2].filter(Boolean).join(' ') || geo.address,
            city: prop.address?.locality || geo.city,
            state: prop.address?.countrySubd || geo.state,
            zip: prop.address?.postal1 || geo.zip,
            owner_name: prop.owner?.name || '',
            year_built: prop.summary?.yearbuilt || 0,
            square_feet: prop.building?.size?.bldgsize || prop.building?.size?.universalsize || 0,
            estimated_value: prop.assessment?.market?.mktTtlValue || prop.assessment?.assessed?.assdttlvalue || 0,
            tax_plot_id: prop.identifier?.attomId || '',
            _placeholder: false,
            _source: 'attom',
          };
          await audit(user.id, 'property.lookup', `${lat},${lng}`, { key_present: true, _source: 'attom' });
          return NextResponse.json(record);
        }
      }
    } catch (err) {
      console.error('[property-lookup] ATTOM failed', err);
    }
  }

  // Tier 2 — placeholder
  await audit(user.id, 'property.lookup', `${lat},${lng}`, { key_present: !!attomKey, _source: 'placeholder' });
  return NextResponse.json(placeholderFor(lat, lng, geo));
}
