"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, FileText, Camera, AlertTriangle } from "lucide-react";

type Params = { id: string };

const mockClient = {
  id: "demo-1",
  first_name: "Jennifer",
  last_name: "Harrington",
  email: "j.harrington@example.com",
  phone: "+1 (404) 555-0182",
  property: {
    address: "4218 Magnolia Dr",
    city: "Atlanta",
    state: "GA",
    zip_code: "30309",
    roof_type: "Shingles (residential)",
    roof_age: 12,
    square_feet: 2850,
  },
  inspections: [
    { id: "i1", date: "Apr 18, 2026", rep: "Sarah Martinez", risk: 94, status: "Report sent" },
    { id: "i2", date: "Jan 4, 2026", rep: "Sarah Martinez", risk: 72, status: "Completed" },
  ],
  notes: "Back gate code 4218. Friendly golden retriever. Prefers texts over calls before 5pm.",
};

export default function ClientDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = use(params);
  const client = mockClient;
  const highRisk = client.inspections[0]?.risk >= 80;

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/crm" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] mb-6 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to CRM
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold gold-text mb-1">{client.first_name} {client.last_name}</h1>
            <p className="text-gray-400">Client ID: {id}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/inspection/new" className="btn-primary flex items-center gap-2">
              <Camera className="w-4 h-4" />
              New Inspection
            </Link>
          </div>
        </div>

        {highRisk && (
          <div className="glass-panel rounded-xl p-4 mb-6 border-l-4 border-red-500 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">High-risk property — immediate follow-up recommended</p>
              <p className="text-sm text-gray-400">Latest inspection scored {client.inspections[0].risk}/100. Storm events in the area may compound damage.</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="glass-panel rounded-xl p-5 md:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-4">Contact</h2>
            <div className="space-y-3">
              <a href={`tel:${client.phone}`} className="flex items-center gap-3 text-gray-300 hover:text-[#D4AF37] transition">
                <Phone className="w-4 h-4 text-[#D4AF37]" />
                {client.phone}
              </a>
              <a href={`mailto:${client.email}`} className="flex items-center gap-3 text-gray-300 hover:text-[#D4AF37] transition">
                <Mail className="w-4 h-4 text-[#D4AF37]" />
                {client.email}
              </a>
              <div className="flex items-start gap-3 text-gray-300">
                <MapPin className="w-4 h-4 text-[#D4AF37] mt-0.5" />
                <div>
                  {client.property.address}<br />
                  {client.property.city}, {client.property.state} {client.property.zip_code}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Property</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Roof type</dt>
                <dd className="text-white">{client.property.roof_type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Roof age</dt>
                <dd className="text-white">{client.property.roof_age} years</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Square footage</dt>
                <dd className="text-white">{client.property.square_feet.toLocaleString()} sq ft</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#D4AF37]" />
            Inspection History
          </h2>
          <div className="space-y-3">
            {client.inspections.map((insp) => (
              <Link key={insp.id} href="/inspection/report" className="block p-3 rounded-lg bg-gray-900/40 hover:bg-gray-900/60 transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-white font-medium">{insp.date}</p>
                      <p className="text-xs text-gray-500">Rep: {insp.rep} · {insp.status}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${insp.risk >= 80 ? "risk-high" : insp.risk >= 50 ? "risk-medium" : "risk-low"}`}>
                    Risk {insp.risk}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Notes</h2>
          <p className="text-gray-300 text-sm whitespace-pre-line">{client.notes}</p>
        </div>

        <p className="text-xs text-gray-600 text-center">
          Demo mode — data is representative. Real deployment pulls from <code className="text-[#D4AF37]">clients</code>, <code className="text-[#D4AF37]">properties</code>, and <code className="text-[#D4AF37]">inspections</code> tables via RLS-scoped joins.
        </p>
      </div>
    </div>
  );
}
