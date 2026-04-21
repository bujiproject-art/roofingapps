"use client";

import { useState } from "react";
import { Calendar, Filter, FileText, MapPin } from "lucide-react";
import Link from "next/link";
import { RiskScoreBadge } from "@/components/ui/RiskScoreBadge";

export default function History() {
  const [filterStatus, setFilterStatus] = useState("all");

  const inspections = [
    {
      id: "INS-2024-001",
      address: "1245 Highland Ave, Austin, TX",
      date: "2024-01-15",
      riskLevel: "high" as const,
      status: "report_sent",
      clientName: "John Smith",
    },
    {
      id: "INS-2024-002",
      address: "8924 Oak Drive, Austin, TX",
      date: "2024-01-10",
      riskLevel: "medium" as const,
      status: "analyzed",
      clientName: "Sarah Johnson",
    },
    {
      id: "INS-2024-003",
      address: "456 Pine Street, Austin, TX",
      date: "2024-01-08",
      riskLevel: "low" as const,
      status: "closed",
      clientName: "Mike Williams",
    },
  ];

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <h1 className="text-2xl font-bold gold-text mb-4">Inspection History</h1>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {["all", "draft", "analyzed", "report_sent", "closed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                filterStatus === status
                  ? "bg-[#D4AF37] text-black"
                  : "bg-gray-900 text-gray-400"
              }`}
            >
              {status.replace("_", " ").toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="space-y-3">
          {inspections.map((inspection) => (
            <Link
              key={inspection.id}
              href={`/inspection/report?id=${inspection.id}`}
              className="block glass-panel rounded-xl p-4 hover:bg-gray-800/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">{inspection.id}</div>
                  <h3 className="font-bold">{inspection.clientName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    <MapPin className="w-3 h-3" />
                    {inspection.address}
                  </div>
                </div>
                <RiskScoreBadge level={inspection.riskLevel} />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {inspection.date}
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs text-gray-400">{inspection.status.replace("_", " ")}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}