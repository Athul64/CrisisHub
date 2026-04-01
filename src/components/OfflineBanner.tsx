"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className="offline-banner fixed top-0 left-0 right-0 z-[10000] text-center py-2 px-4 text-xs font-semibold flex items-center justify-center gap-2"
      style={{
        background: isOnline
          ? "linear-gradient(90deg, #059669, #10b981)"
          : "linear-gradient(90deg, #dc2626, #ef4444)",
        color: "white",
      }}
      role="alert"
    >
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5" />
          Connection restored! You&apos;re back online.
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          You&apos;re offline. Some features may be unavailable.
        </>
      )}
    </div>
  );
}
