'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, MapPin, Loader2 } from 'lucide-react';

const JOB_TYPES = [
  { value: 'inspection', label: 'Inspection only' },
  { value: 'repair', label: 'Repair' },
  { value: 'full_replacement', label: 'Full replacement' },
  { value: 'storm_damage', label: 'Storm-damage claim' },
];

const PROPERTY_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'multifamily', label: 'Multi-family' },
];

interface Customer {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  address: string | null;
}

export default function NewEstimate() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [form, setForm] = useState({
    job_type: 'inspection',
    description: '',
    estimated_cost: '',
    scheduled_date: '',
  });
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    property_type: 'residential',
  });
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/customers').then((r) => r.json()).then((d) => setCustomers(d.customers || []));
  }, []);

  const lookupGPS = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported on this device');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data.address) {
            setNewCustomer((c) => ({
              ...c,
              address: data.address.house_number && data.address.road
                ? `${data.address.house_number} ${data.address.road}`
                : data.address.road || '',
              city: data.address.city || data.address.town || data.address.village || '',
              state: data.address.state_code || data.address.state || '',
              zip: data.address.postcode || '',
            }));
          }
        } catch {
          setError('Address lookup failed — please enter manually');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError('Location permission denied — please enter address manually');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      let customerIdToUse = customerId;
      // Create a new customer first if needed
      if (mode === 'new') {
        if (!newCustomer.name) {
          setError('Customer name required');
          setLoading(false);
          return;
        }
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCustomer),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to create customer');
          setLoading(false);
          return;
        }
        customerIdToUse = data.customer.id;
      }
      if (!customerIdToUse) {
        setError('Select a customer');
        setLoading(false);
        return;
      }

      const jobRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerIdToUse,
          ...form,
          estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
        }),
      });
      const jobData = await jobRes.json();
      if (!jobRes.ok) {
        setError(jobData.error || 'Failed to create estimate');
        setLoading(false);
        return;
      }
      router.push('/estimator/estimates');
    } catch {
      setError('Network error — try again');
      setLoading(false);
    }
  };

  return (
    <main className="p-6 md:p-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <div className="text-[#D4A24C] uppercase tracking-widest text-xs font-semibold mb-1">New estimate</div>
        <h1 className="font-display text-3xl md:text-4xl">Build a quote</h1>
        <p className="text-[#E5E9F2]/60 text-sm mt-1">
          Start with the customer, then add job details. GPS lookup auto-fills the address from your phone&apos;s location.
        </p>
      </header>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>
      )}

      {/* Customer selector */}
      <section className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6 mb-6">
        <h2 className="font-display text-lg mb-1">1. Customer</h2>
        <div className="flex gap-3 mb-5 text-sm">
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`px-3 py-1.5 rounded-full ${mode === 'existing' ? 'bg-[#D4A24C] text-[#0A0F1F]' : 'bg-black/30 text-[#E5E9F2]/70 border border-[#E5E9F2]/10'}`}
          >
            Existing customer
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`px-3 py-1.5 rounded-full ${mode === 'new' ? 'bg-[#D4A24C] text-[#0A0F1F]' : 'bg-black/30 text-[#E5E9F2]/70 border border-[#E5E9F2]/10'}`}
          >
            + New customer
          </button>
        </div>

        {mode === 'existing' ? (
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none"
          >
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {[c.city, c.state].filter(Boolean).join(', ') || 'no location'}
              </option>
            ))}
          </select>
        ) : (
          <div className="space-y-3">
            <input
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              placeholder="Customer name"
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="tel"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="Phone"
                className="px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none"
              />
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="Email"
                className="px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={lookupGPS}
              disabled={locating}
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-[#D4A24C]/40 text-[#D4A24C] hover:bg-[#D4A24C]/10 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {locating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Locating you…
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" /> Use my current GPS location to fill the address
                </>
              )}
            </button>
            <input
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              placeholder="Street address"
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none"
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                value={newCustomer.city}
                onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                placeholder="City"
                className="px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none"
              />
              <input
                value={newCustomer.state}
                onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                placeholder="State"
                className="px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none"
              />
              <input
                value={newCustomer.zip}
                onChange={(e) => setNewCustomer({ ...newCustomer, zip: e.target.value })}
                placeholder="ZIP"
                className="px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none"
              />
            </div>
            <select
              value={newCustomer.property_type}
              onChange={(e) => setNewCustomer({ ...newCustomer, property_type: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none"
            >
              {PROPERTY_TYPES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* Job details */}
      <section className="bg-[#0F1729] border border-[#E5E9F2]/10 rounded-xl p-6 mb-6">
        <h2 className="font-display text-lg mb-5">2. Job details</h2>
        <div className="space-y-4">
          <select
            value={form.job_type}
            onChange={(e) => setForm({ ...form, job_type: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none"
          >
            {JOB_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description of work, materials, conditions"
            rows={4}
            className="w-full px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none resize-none"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="number"
              value={form.estimated_cost}
              onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
              placeholder="Estimated cost ($)"
              className="px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none"
            />
            <input
              type="date"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className="px-4 py-3 rounded-lg bg-black/30 border border-[#E5E9F2]/10 text-white focus:border-[#D4A24C] focus:outline-none"
            />
          </div>
        </div>
      </section>

      <button
        onClick={submit}
        disabled={loading}
        className="w-full py-3.5 rounded-lg bg-gradient-to-r from-[#D4A24C] to-[#E5B366] text-[#0A0F1F] font-semibold disabled:opacity-50 hover:opacity-90 transition flex items-center justify-center gap-2"
      >
        <Calculator className="w-4 h-4" />
        {loading ? 'Creating estimate…' : 'Create estimate'}
      </button>
    </main>
  );
}
