"use client";

import { useState } from "react";
import { Camera, FileText, Users, TrendingUp, Plus, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("today");

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Pexels Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <Image
          src="https://images.pexels.com/photos/11912130/pexels-photo-11912130.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          alt="A picturesque red tiled roof featuring chimneys and skylight windows against a blue sky — hero imagery by Mathias Reding on Pexels."
          fill
          className="object-cover opacity-40"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-8">
          <h1 className="text-3xl md:text-5xl font-bold gold-text mb-2">
            RevoRoof AI
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-xl">
            Turn every field rep into an instant roofing expert
          </p>
          <div className="mt-6 flex gap-4">
            <Link href="/inspection/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Inspection
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 md:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-xl p-4 border-l-4 border-[#D4AF37]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Today&apos;s Inspections</p>
                <p className="text-2xl font-bold text-white">8</p>
              </div>
              <Camera className="w-8 h-8 text-[#D4AF37] opacity-80" />
            </div>
          </div>
          <div className="glass-panel rounded-xl p-4 border-l-4 border-[#00D9FF]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Reports Sent</p>
                <p className="text-2xl font-bold text-white">12</p>
              </div>
              <FileText className="w-8 h-8 text-[#00D9FF] opacity-80" />
            </div>
          </div>
          <div className="glass-panel rounded-xl p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Leads</p>
                <p className="text-2xl font-bold text-white">24</p>
              </div>
              <Users className="w-8 h-8 text-purple-500 opacity-80" />
            </div>
          </div>
          <div className="glass-panel rounded-xl p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Close Rate</p>
                <p className="text-2xl font-bold text-white">68%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="px-4 md:px-8 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Inspections</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab("today")}
              className={`px-3 py-1 rounded-full text-sm ${activeTab === "today" ? "bg-[#D4AF37] text-black" : "bg-gray-800 text-gray-400"}`}
            >
              Today
            </button>
            <button 
              onClick={() => setActiveTab("week")}
              className={`px-3 py-1 rounded-full text-sm ${activeTab === "week" ? "bg-[#D4AF37] text-black" : "bg-gray-800 text-gray-400"}`}
            >
              This Week
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { id: 1, address: "1245 Highland Ave, Austin, TX", status: "High Risk", time: "2 hours ago", risk: "high" },
            { id: 2, address: "8924 Oak Drive, Austin, TX", status: "Medium Risk", time: "4 hours ago", risk: "medium" },
            { id: 3, address: "456 Pine Street, Austin, TX", status: "Low Risk", time: "6 hours ago", risk: "low" },
          ].map((inspection) => (
            <Link 
              key={inspection.id}
              href={`/inspection/report?id=${inspection.id}`}
              className="block glass-panel rounded-xl p-4 hover:bg-gray-800/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-[#D4AF37] transition-colors">
                      {inspection.address}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-3 h-3" />
                      {inspection.time}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  inspection.risk === "high" ? "risk-high" : 
                  inspection.risk === "medium" ? "risk-medium" : "risk-low"
                }`}>
                  {inspection.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 md:px-8 mt-8 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/inspection/new" className="glass-panel rounded-xl p-6 text-center hover:bg-gray-800/50 transition-all group">
            <Camera className="w-8 h-8 text-[#D4AF37] mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">New Inspection</span>
          </Link>
          <Link href="/crm" className="glass-panel rounded-xl p-6 text-center hover:bg-gray-800/50 transition-all group">
            <Users className="w-8 h-8 text-[#00D9FF] mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">View Leads</span>
          </Link>
          <Link href="/history" className="glass-panel rounded-xl p-6 text-center hover:bg-gray-800/50 transition-all group">
            <FileText className="w-8 h-8 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">History</span>
          </Link>
          <Link href="/admin" className="glass-panel rounded-xl p-6 text-center hover:bg-gray-800/50 transition-all group">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Analytics</span>
          </Link>
        </div>
      </div>
    </div>
  );
}