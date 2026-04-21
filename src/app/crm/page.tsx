"use client";

import { useState } from "react";
import { Search, Plus, Phone, Mail, MapPin, Calendar } from "lucide-react";
import Link from "next/link";

export default function CRM() {
  const [searchQuery, setSearchQuery] = useState("");

  const clients = [
    {
      id: 1,
      name: "John Smith",
      address: "1245 Highland Ave, Austin, TX",
      phone: "+1 (555) 123-4567",
      email: "john@example.com",
      lastInspection: "2024-01-15",
      status: "active",
      riskLevel: "high",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      address: "8924 Oak Drive, Austin, TX",
      phone: "+1 (555) 234-5678",
      email: "sarah@example.com",
      lastInspection: "2024-01-10",
      status: "follow-up",
      riskLevel: "medium",
    },
    {
      id: 3,
      name: "Mike Williams",
      address: "456 Pine Street, Austin, TX",
      phone: "+1 (555) 345-6789",
      email: "mike@example.com",
      lastInspection: "2024-01-08",
      status: "closed",
      riskLevel: "low",
    },
  ];

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold gold-text">CRM</h1>
          <Link href="/crm/new" className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Client
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500"
          />
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="space-y-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/crm/${client.id}`}
              className="block glass-panel rounded-xl p-4 hover:bg-gray-800/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{client.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    <MapPin className="w-3 h-3" />
                    {client.address}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.riskLevel === "high"
                      ? "risk-high"
                      : client.riskLevel === "medium"
                      ? "risk-medium"
                      : "risk-low"
                  }`}
                >
                  {client.riskLevel.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Phone className="w-3 h-3" />
                  {client.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="w-3 h-3" />
                  {client.email}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  Last inspection: {client.lastInspection}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    client.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : client.status === "follow-up"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {client.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}