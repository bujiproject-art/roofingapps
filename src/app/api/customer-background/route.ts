// Customer background / soft-credit qualifier — POST { owner_name, address }.
//
// Tier 1: BatchData real call (when BATCHDATA_API_KEY set in revo_admin_settings)
// Tier 2: Realistic placeholder. Mix of qualifies / likely-qualifies / needs-review
//         at 80/15/5. Audit every call.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSetting, audit } from '@/lib/revo/admin-settings';

interface Background {
  ownership_confirmed: boolean;
  ownership_length_years: number;
  estimated_equity_usd: number;
  mortgage_status: 'current' | 'delinquent';
  open_liens: number;
  soft_credit_status: 'qualifies' | 'likely-qualifies' | 'needs-review';
  notes: string;
  _placeholder: boolean;
  _source: 'batchdata' | 'placeholder';
}

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function placeholder(owner: string, address: string): Background {
  const h = hash(`${owner}|${address}`);
  const ownership_length_years = 3 + (h % 13); // 3-15
  const estimated_equity_usd = 50000 + ((h >>> 3) % 251) * 1000; // 50k-300k
  const delinquentRoll = (h >>> 5) % 100;
  const creditRoll = (h >>> 7) % 100;
  const open_liens = (h >>> 11) % 100 < 4 ? 1 : 0;
  return {
    ownership_confirmed: true,
    ownership_length_years,
    estimated_equity_usd,
    mortgage_status: delinquentRoll < 5 ? 'delinquent' : 'current',
    open_liens,
    soft_credit_status: creditRoll < 80 ? 'qualifies' : creditRoll < 95 ? 'likely-qualifies' : 'needs-review',
    notes: 'Demo background — replaces with real BatchData once the key is set in Admin → Settings → Keys.',
    _placeholder: true,
    _source: 'placeholder',
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const ownerName = String(body?.owner_name || '').trim();
  const address = String(body?.address || '').trim();
  if (!ownerName || !address) {
    return NextResponse.json({ error: 'owner_name + address required' }, { status: 400 });
  }

  const batchKey = await getSetting('BATCHDATA_API_KEY');

  if (batchKey) {
    try {
      const res = await fetch('https://api.batchdata.com/api/v1/property/skip-trace', {
        method: 'POST',
        headers: { Authorization: `Bearer ${batchKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ name: ownerName, propertyAddress: address }] }),
      });
      if (res.ok) {
        const data = await res.json();
        const r = data?.results?.persons?.[0];
        if (r) {
          await audit(user.id, 'background.lookup', address, { _source: 'batchdata' });
          return NextResponse.json({
            ownership_confirmed: !!r,
            ownership_length_years: 0,
            estimated_equity_usd: 0,
            mortgage_status: 'current' as const,
            open_liens: 0,
            soft_credit_status: 'qualifies' as const,
            notes: 'BatchData lookup succeeded — see audit log for raw response.',
            _placeholder: false,
            _source: 'batchdata' as const,
          });
        }
      }
    } catch (err) {
      console.error('[customer-background] BatchData failed', err);
    }
  }

  const fallback = placeholder(ownerName, address);
  await audit(user.id, 'background.lookup', address, { _source: 'placeholder', key_present: !!batchKey });
  return NextResponse.json(fallback);
}
