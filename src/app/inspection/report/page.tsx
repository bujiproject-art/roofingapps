"use client";

import { useState } from "react";
import { ArrowLeft, Download, Send, Eye, Share2, FileText } from "lucide-react";
import Link from "next/link";
import { RiskScoreBadge } from "@/components/ui/RiskScoreBadge";

export default function InspectionReport() {
  const [presentMode, setPresentMode] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);

  const reportData = {
    id: "INS-2024-001",
    address: "1245 Highland Ave, Austin, TX 78704",
    inspectionDate: "January 15, 2024",
    riskScore: 82,
    riskLevel: "high" as const,
    estimatedRepairCost: 4500,
    estimatedReplacementCost: 18500,
    findings: [
      { type: "Missing Shingles", count: 12, severity: "high" },
      { type: "Granule Loss", severity: "medium", coverage: "35%" },
      { type: "Cracked Flashing", severity: "high", location: "Chimney" },
      { type: "Gutter Damage", severity: "low", location: "North Side" },
    ],
  };

  if (presentMode) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <button
          onClick={() => setPresentMode(false)}
          className="absolute top-4 right-4 px-4 py-2 bg-gray-900 rounded-lg text-sm"
        >
          Exit Present Mode
        </button>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold gold-text mb-4">Roof Inspection Report</h1>
            <p className="text-2xl text-gray-400">{reportData.address}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="glass-panel rounded-2xl p-8 text-center">
              <div className="text-6xl font-bold text-red-500 mb-4">{reportData.riskScore}</div>
              <div className="text-2xl text-gray-400">Risk Score</div>
              <RiskScoreBadge level={reportData.riskLevel} />
            </div>

            <div className="glass-panel rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4">Cost Analysis</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-gray-400">Repair Now</div>
                  <div className="text-3xl font-bold text-green-400">
                    ${reportData.estimatedRepairCost.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Replace Later</div>
                  <div className="text-3xl font-bold text-red-400">
                    ${reportData.estimatedReplacementCost.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h3 className="text-3xl font-bold mb-6">Key Findings</h3>
            <div className="space-y-4">
              {reportData.findings.map((finding, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <div>
                    <div className="text-xl font-semibold">{finding.type}</div>
                    <div className="text-gray-400">
                      {"count" in finding && `Count: ${finding.count}`}
                      {"coverage" in finding && `Coverage: ${finding.coverage}`}
                      {"location" in finding && `Location: ${finding.location}`}
                    </div>
                  </div>
                  <RiskScoreBadge level={finding.severity as "low" | "medium" | "high"} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/inspection/analyze" className="p-2 bg-gray-900 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold gold-text">Inspection Report</h1>
              <p className="text-gray-400 text-xs">{reportData.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPresentMode(true)}
              className="btn-secondary text-sm py-2 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Present
            </button>
            <button className="btn-primary text-sm py-2 flex items-center gap-2">
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-4xl mx-auto">
        <div className="glass-panel rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{reportData.address}</h2>
              <p className="text-gray-400">{reportData.inspectionDate}</p>
            </div>
            <RiskScoreBadge level={reportData.riskLevel} score={reportData.riskScore} />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="text-gray-400 text-sm mb-1">Repair Cost</div>
              <div className="text-2xl font-bold text-green-400">
                ${reportData.estimatedRepairCost.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="text-gray-400 text-sm mb-1">Replacement Cost</div>
              <div className="text-2xl font-bold text-red-400">
                ${reportData.estimatedReplacementCost.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Findings Summary</h3>
          <div className="space-y-3">
            {reportData.findings.map((finding, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div>
                  <div className="font-semibold">{finding.type}</div>
                  <div className="text-sm text-gray-400">
                    {"count" in finding && `Count: ${finding.count}`}
                    {"coverage" in finding && `Coverage: ${finding.coverage}`}
                    {"location" in finding && `Location: ${finding.location}`}
                  </div>
                </div>
                <RiskScoreBadge level={finding.severity as "low" | "medium" | "high"} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Recommendations</h3>
          <div className="space-y-3">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="font-semibold text-red-400 mb-1">Immediate Action Required</div>
              <p className="text-sm text-gray-300">
                Missing shingles and cracked flashing pose immediate water intrusion risk. 
                Recommend repair within 7-14 days to prevent interior damage.
              </p>
            </div>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="font-semibold text-yellow-400 mb-1">Monitor Closely</div>
              <p className="text-sm text-gray-300">
                Granule loss indicates aging. Schedule follow-up inspection in 6 months.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setSendModalOpen(true)}
            className="flex-1 btn-primary py-4 flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            Send Report
          </button>
          <button className="btn-secondary py-4 flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5" />
            Share
          </button>
        </div>
      </div>

      {sendModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Send Report</h3>
              <button onClick={() => setSendModalOpen(false)} className="text-gray-400">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Client Email</label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Client Phone</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white"
                />
              </div>

              <div className="flex gap-3">
                <button className="flex-1 btn-primary py-3">
                  Send via Email
                </button>
                <button className="flex-1 btn-secondary py-3">
                  Send via SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}