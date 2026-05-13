"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, User, Home } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    address: "", city: "", state: "GA", zip_code: "",
    roof_type: "shingles", notes: "",
  });

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      router.push("/crm");
    }, 900);
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/crm" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] mb-6 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to CRM
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold gold-text mb-1">New Client</h1>
          <p className="text-gray-400">Add a homeowner or commercial contact and their property</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#D4AF37]" />
              Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">First name *</label>
                <input required value={form.first_name} onChange={(e) => update("first_name", e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#D4AF37] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Last name *</label>
                <input required value={form.last_name} onChange={(e) => update("last_name", e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#D4AF37] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="client@example.com" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#D4AF37] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+1 (555) 123-4567" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#D4AF37] focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-[#D4AF37]" />
              Property
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Address *</label>
                <input required value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="4218 Magnolia Dr" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#D4AF37] focus:outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">City *</label>
                  <input required value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Atlanta" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#D4AF37] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">State *</label>
                  <input required value={form.state} onChange={(e) => update("state", e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#D4AF37] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">ZIP *</label>
                  <input required value={form.zip_code} onChange={(e) => update("zip_code", e.target.value)} placeholder="30309" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#D4AF37] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Roof type</label>
                <select value={form.roof_type} onChange={(e) => update("roof_type", e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none">
                  <option value="shingles">Shingles (residential)</option>
                  <option value="tpo">TPO (commercial)</option>
                  <option value="epdm">EPDM (commercial)</option>
                  <option value="metal">Metal</option>
                  <option value="flat">Flat</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} placeholder="Access notes, gate codes, dog warning, etc." className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#D4AF37] focus:outline-none resize-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/crm" className="btn-secondary flex-1 text-center">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
              <Save className="w-5 h-5" />
              {saving ? "Saving..." : "Save Client"}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-600 mt-8 text-center">
          Demo mode — form does not persist. In production, POSTs to <code className="text-[#D4AF37]">/api/clients</code> and writes <code className="text-[#D4AF37]">clients</code> + <code className="text-[#D4AF37]">properties</code> rows via RLS-scoped Supabase mutation.
        </p>
      </div>
    </div>
  );
}
