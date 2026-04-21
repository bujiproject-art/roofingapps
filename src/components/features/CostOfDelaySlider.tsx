"use client";

import { useState } from "react";
import { TrendingUp, AlertTriangle, Clock } from "lucide-react";

interface CostOfDelaySliderProps {
  currentCost: number;
  futureCost: number;
  monthsToFailure?: number;
}

export function CostOfDelaySlider({ 
  currentCost = 500, 
  futureCost = 4500, 
  monthsToFailure = 12 
}: CostOfDelaySliderProps) {
  const [months, setMonths] = useState(0);
  const maxMonths = monthsToFailure;
  
  // Calculate interpolated cost
  const progress = months / maxMonths;
  const interpolatedCost = Math.round(currentCost + (futureCost - currentCost) * Math.pow(progress, 1.5));
  const savings = futureCost - interpolatedCost;
  const isCritical = progress > 0.7;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-[#D4AF37]/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Cost of Delay Calculator</h3>
          <p className="text-sm text-gray-400">See how costs escalate over time</p>
        </div>
      </div>

      <div className="relative mb-8">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Today</span>
          <span>{maxMonths} Months</span>
        </div>
        
        <input
          type="range"
          min="0"
          max={maxMonths}
          value={months}
          onChange={(e) => setMonths(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
          style={{
            background: `linear-gradient(to right, #D4AF37 ${(months/maxMonths)*100}%, #1a1a1a ${(months/maxMonths)*100}%)`
          }}
        />
        
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Fix Now</span>
          <span>Minor Repairs</span>
          <span>Full Replacement</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`rounded-xl p-4 border ${isCritical ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-900 border-gray-800'}`}>
          <div className="text-sm text-gray-400 mb-1">Cost if Delayed</div>
          <div className={`text-2xl font-bold ${isCritical ? 'text-red-400' : 'text-white'}`}>
            ${interpolatedCost.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            in {months} month{months !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-[#D4AF37]/10 rounded-xl p-4 border border-[#D4AF37]/30">
          <div className="text-sm text-gray-400 mb-1">Fix Now</div>
          <div className="text-2xl font-bold text-[#D4AF37]">
            ${currentCost.toLocaleString()}
          </div>
          <div className="text-xs text-[#D4AF37]/70 mt-1">
            Immediate action
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCritical ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
          {isCritical ? (
            <AlertTriangle className={`w-5 h-5 ${isCritical ? 'text-red-400' : 'text-green-400'}`} />
          ) : (
            <TrendingUp className="w-5 h-5 text-green-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-white">
            {isCritical 
              ? "Critical: Immediate Action Required" 
              : `Save $${savings.toLocaleString()} by acting now`}
          </div>
          <p className="text-sm text-gray-400">
            {isCritical
              ? "Damage will compound rapidly. Full replacement likely within 3 months."
              : "Every month of delay increases repair complexity and cost."}
          </p>
        </div>
      </div>
    </div>
  );
}