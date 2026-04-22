"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Target, AlertTriangle, Users, DollarSign, Calendar, Star } from "lucide-react";

type Period = "7d" | "30d" | "90d" | "ytd";

const topReps = [
  { name: "Sarah Martinez", inspections: 42, closeRate: 78, revenue: 184500, avatar: "SM" },
  { name: "Marcus Johnson", inspections: 38, closeRate: 71, revenue: 156200, avatar: "MJ" },
  { name: "Diego Ramirez", inspections: 35, closeRate: 69, revenue: 142800, avatar: "DR" },
  { name: "Ashley Chen", inspections: 31, closeRate: 64, revenue: 127300, avatar: "AC" },
  { name: "Brian O'Connor", inspections: 29, closeRate: 62, revenue: 118900, avatar: "BO" },
];

const highRiskProperties = [
  { address: "4218 Magnolia Dr, Atlanta GA", score: 94, lastInspected: "3 days ago", issues: ["Missing shingles", "Flashing damage"] },
  { address: "892 Briar Creek Rd, Marietta GA", score: 89, lastInspected: "6 days ago", issues: ["Hail impact", "Granule loss"] },
  { address: "1776 Peachtree St NE, Atlanta GA", score: 87, lastInspected: "1 week ago", issues: ["Sagging", "Gutter damage"] },
  { address: "305 Lake Forest Ln, Dunwoody GA", score: 85, lastInspected: "4 days ago", issues: ["Curled shingles", "Moss growth"] },
];

const weatherAlerts = [
  { event: "Hail Event", location: "North Atlanta corridor", severity: "Severe", affected: 23, date: "Apr 19" },
  { event: "Wind Damage", location: "Sandy Springs area", severity: "Moderate", affected: 8, date: "Apr 15" },
];

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>("30d");

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold gold-text mb-1">Analytics</h1>
          <p className="text-gray-400">Rep performance, close rates, and high-risk property alerts</p>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "90d", "ytd"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                period === p ? "bg-[#D4AF37] text-black" : "bg-gray-900 text-gray-400 hover:bg-gray-800"
              }`}
            >
              {p === "ytd" ? "YTD" : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Inspections", value: 175, delta: "+12%", up: true, icon: Target },
          { label: "Close Rate", value: "69%", delta: "+4.2%", up: true, icon: TrendingUp },
          { label: "Revenue", value: "$729K", delta: "+18%", up: true, icon: DollarSign },
          { label: "Avg Response", value: "4.2h", delta: "-1.1h", up: true, icon: Calendar },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="glass-panel rounded-xl p-4 border-l-4 border-[#D4AF37]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">{k.label}</p>
                <Icon className="w-5 h-5 text-[#D4AF37] opacity-70" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{k.value}</p>
              <div className={`flex items-center gap-1 text-xs ${k.up ? "text-green-400" : "text-red-400"}`}>
                {k.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {k.delta} vs last period
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard + High-Risk */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#D4AF37]" />
              Top Reps
            </h2>
            <span className="text-xs text-gray-500">Ranked by revenue</span>
          </div>
          <div className="space-y-3">
            {topReps.map((rep, i) => (
              <div key={rep.name} className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/40 hover:bg-gray-900/60 transition">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-black ${i === 0 ? "bg-gradient-to-br from-[#D4AF37] to-[#F4E5C2]" : "bg-gray-700 text-white"}`}>
                  {i === 0 ? <Star className="w-4 h-4" /> : rep.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium text-white truncate">{rep.name}</p>
                    <p className="text-sm text-[#D4AF37] font-semibold">${(rep.revenue / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span>{rep.inspections} inspections</span>
                    <span>·</span>
                    <span>{rep.closeRate}% close rate</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              High-Risk Properties
            </h2>
            <span className="text-xs text-gray-500">Needs follow-up</span>
          </div>
          <div className="space-y-3">
            {highRiskProperties.map((p) => (
              <div key={p.address} className="p-3 rounded-lg bg-gray-900/40 border-l-2 border-red-500/50">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-medium text-white text-sm truncate">{p.address}</p>
                  <span className="risk-high px-2 py-0.5 rounded-full text-xs font-semibold border">{p.score}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  Last inspected {p.lastInspected}
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.issues.map((issue) => (
                    <span key={issue} className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20">
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weather Alerts */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          Storm Event Alerts
          <span className="text-xs text-gray-500 font-normal ml-auto">Tomorrow.io feed</span>
        </h2>
        <div className="space-y-3">
          {weatherAlerts.map((w) => (
            <div key={w.event + w.date} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/40 border border-yellow-500/20">
              <div>
                <p className="font-medium text-white">{w.event} — {w.location}</p>
                <p className="text-xs text-gray-400">{w.date} · {w.severity} severity</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#D4AF37]">{w.affected}</p>
                <p className="text-xs text-gray-500">properties flagged</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-600 mt-8 text-center">
        Demo mode — figures are representative. In production, data is pulled from <code className="text-[#D4AF37]">performance_metrics</code> + <code className="text-[#D4AF37]">weather_events</code> tables, scoped by subscriber role via RLS.
      </p>
    </div>
  );
}
