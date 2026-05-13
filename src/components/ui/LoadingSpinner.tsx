"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = "md", text, fullScreen = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
    : "flex flex-col items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <Loader2 className={`${sizeClasses[size]} text-[#D4AF37] animate-spin`} />
      {text && <p className="mt-4 text-gray-400 text-sm">{text}</p>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-panel rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-gray-800 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-800 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-800 rounded w-2/3" />
    </div>
  );
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}