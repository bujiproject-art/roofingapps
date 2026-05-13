"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut, Info } from "lucide-react";

export interface DamageDetection {
  id: number;
  type: string;
  severity: "low" | "medium" | "high";
  x: number;
  y: number;
  width: number;
  height: number;
  description?: string;
}

interface DamageOverlayProps {
  detections: DamageDetection[];
  imageUrl?: string;
  onDetectionClick?: (detection: DamageDetection) => void;
}

export function DamageOverlay({ detections, imageUrl, onDetectionClick }: DamageOverlayProps) {
  const [scale, setScale] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const severityColors = {
    low: "border-green-500 bg-green-500/20 shadow-green-500/20",
    medium: "border-yellow-500 bg-yellow-500/20 shadow-yellow-500/20",
    high: "border-red-500 bg-red-500/30 shadow-red-500/30 animate-pulse",
  };

  const severityLabels = {
    low: "Low",
    medium: "Medium",
    high: "High",
  };

  const handleDetectionClick = (detection: DamageDetection) => {
    setSelectedId(detection.id === selectedId ? null : detection.id);
    onDetectionClick?.(detection);
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden group">
      {/* Image or Placeholder */}
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="Roof inspection" 
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: `scale(${scale})` }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-600 bg-gray-800">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📷</span>
            </div>
            <p className="text-sm">Roof photo preview</p>
          </div>
        </div>
      )}

      {/* Damage annotations */}
      {detections.map((detection) => (
        <div
          key={detection.id}
          className={`absolute cursor-pointer transition-all duration-300 ${severityColors[detection.severity]} border-2 rounded-lg backdrop-blur-sm`}
          style={{
            left: `${detection.x}%`,
            top: `${detection.y}%`,
            width: `${detection.width}%`,
            height: `${detection.height}%`,
            transform: selectedId === detection.id ? 'scale(1.1)' : 'scale(1)',
            zIndex: selectedId === detection.id ? 10 : 1,
          }}
          onClick={() => handleDetectionClick(detection)}
        >
          <div className={`absolute -top-6 left-0 bg-black/90 px-2 py-1 rounded text-xs text-white whitespace-nowrap border ${detection.severity === 'high' ? 'border-red-500' : detection.severity === 'medium' ? 'border-yellow-500' : 'border-green-500'}`}>
            {detection.type} ({severityLabels[detection.severity]})
          </div>
          
          {selectedId === detection.id && detection.description && (
            <div className="absolute top-full left-0 mt-2 bg-black/90 p-3 rounded-lg border border-gray-700 w-48 z-20">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" />
                <p className="text-xs text-gray-300">{detection.description}</p>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setScale(Math.max(0.5, scale - 0.25))}
          className="p-2 bg-black/80 rounded-lg hover:bg-black text-white"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setScale(Math.min(3, scale + 0.25))}
          className="p-2 bg-black/80 rounded-lg hover:bg-black text-white"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex gap-2 bg-black/80 backdrop-blur-md p-2 rounded-lg">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-gray-300">High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-xs text-gray-300">Med</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-gray-300">Low</span>
        </div>
      </div>
    </div>
  );
}