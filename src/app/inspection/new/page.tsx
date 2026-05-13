"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, Compass, Mic, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewInspection() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [voiceNote, setVoiceNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const guideSteps = [
    { title: "North Slope", description: "Stand facing north, capture entire slope" },
    { title: "South Slope", description: "Stand facing south, capture entire slope" },
    { title: "East Slope", description: "Stand facing east, capture entire slope" },
    { title: "West Slope", description: "Stand facing west, capture entire slope" },
    { title: "Chimney Flashing", description: "Close-up of chimney and flashing details" },
    { title: "Gutters", description: "Capture gutter condition and downspouts" },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const simulateCapture = () => {
    setCapturing(true);
    setTimeout(() => {
      setPhotos([...photos, `/api/placeholder/400/300`]);
      setCapturing(false);
      if (guideStep < guideSteps.length - 1) {
        setGuideStep(guideStep + 1);
      }
    }, 1500);
  };

  const handleAnalyze = () => {
    router.push("/inspection/analyze");
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-gray-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gold-text">New Inspection</h1>
            <p className="text-gray-400 text-sm">Step 1: Capture Roof Photos</p>
          </div>
          <Link href="/" className="p-2 bg-gray-900 rounded-full">
            <X className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Guided Capture Sequence */}
      <div className="px-4 py-6">
        <div className="glass-panel rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl" />
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center">
              <Compass className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Guided Capture</h2>
              <p className="text-gray-400 text-sm">Follow the prompts for perfect shots</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#D4AF37] font-semibold">Step {guideStep + 1} of {guideSteps.length}</span>
              <span className="text-xs text-gray-500">{Math.round((guideStep / guideSteps.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-[#D4AF37] to-[#F4E5C2] h-2 rounded-full transition-all duration-500"
                style={{ width: `${((guideStep + 1) / guideSteps.length) * 100}%` }}
              />
            </div>
            <h3 className="text-xl font-bold mb-1">{guideSteps[guideStep].title}</h3>
            <p className="text-gray-400">{guideSteps[guideStep].description}</p>
          </div>

          {/* Camera Interface */}
          <div className="relative aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden border-2 border-gray-800">
            {capturing ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-600">
                    <Camera className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-500">Camera preview</p>
                </div>
              </div>
            )}
            
            {/* Overlay Grid */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border border-white/20" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button 
              onClick={simulateCapture}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Capture
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary"
            >
              <Upload className="w-5 h-5" />
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              multiple 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Voice Notes */}
        <div className="glass-panel rounded-2xl p-4 mb-6">
          <button 
            onClick={() => setVoiceNote(!voiceNote)}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
              voiceNote ? "bg-[#D4AF37]/20 border border-[#D4AF37]" : "bg-gray-900 border border-gray-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                voiceNote ? "bg-[#D4AF37] text-black" : "bg-gray-800 text-gray-400"
              }`}>
                <Mic className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Voice Notes</h3>
                <p className="text-xs text-gray-400">Hands-free observations</p>
              </div>
            </div>
            {voiceNote && <span className="text-[#D4AF37] text-sm animate-pulse">Recording...</span>}
          </button>
          
          {voiceNote && (
            <div className="mt-3 p-3 bg-gray-900 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-[#D4AF37] rounded-full animate-pulse"
                      style={{ 
                        height: `${Math.random() * 20 + 10}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400 ml-2">00:12</span>
              </div>
              <p className="text-sm text-gray-300 mt-2 italic">
                &quot;Noticing significant granule loss on the north slope, approximately 15 years old...&quot;
              </p>
            </div>
          )}
        </div>

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Captured Photos ({photos.length})</h3>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-900">
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center text-xs text-gray-500">
                    Photo {index + 1}
                  </div>
                  <button 
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-[#D4AF37] text-black text-xs rounded font-semibold">
                      Cover
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Property Details */}
        <div className="glass-panel rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Property Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Property Address</label>
              <input 
                type="text" 
                placeholder="Enter full address"
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Roof Type</label>
                <select className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none">
                  <option>Shingles</option>
                  <option>TPO</option>
                  <option>EPDM</option>
                  <option>Metal</option>
                  <option>Flat</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Age (years)</label>
                <input 
                  type="number" 
                  placeholder="15"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Analyze Button */}
        <button 
          onClick={handleAnalyze}
          disabled={photos.length === 0}
          className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-5 h-5" />
          Analyze with AI
        </button>
      </div>
    </div>
  );
}