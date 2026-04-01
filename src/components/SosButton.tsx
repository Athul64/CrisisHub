"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface SosButtonProps {
  onClick: () => void;
}

export default function SosButton({ onClick }: SosButtonProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <button
        id="sos-button"
        onClick={onClick}
        className="relative w-44 h-44 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-800 text-white font-extrabold text-xl tracking-wider flex flex-col items-center justify-center gap-2 cursor-pointer border-4 border-red-400/50 transition-transform duration-200 hover:scale-105 active:scale-95"
        style={{
          animation: "sos-pulse 2s ease-in-out infinite",
        }}
        aria-label="Report Emergency"
      >
        {/* Animated ring */}
        <span
          className="absolute inset-0 rounded-full border-4 border-red-500"
          style={{
            animation: "sos-ring 2s ease-out infinite",
          }}
        />
        <AlertTriangle className="w-10 h-10 drop-shadow-lg" />
        <span className="text-2xl font-black drop-shadow-lg">SOS</span>
        <span className="text-xs font-medium opacity-80 tracking-widest">
          REPORT CRISIS
        </span>
      </button>
      <p className="text-sm text-gray-400 max-w-xs text-center">
        Tap to report an emergency. Your location and report will be sent
        instantly to campus security.
      </p>
    </div>
  );
}
