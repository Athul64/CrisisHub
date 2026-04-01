"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  Flame,
  HeartPulse,
  ShieldAlert,
  Zap,
  Wrench,
  CheckCircle2,
  MessageSquare,
  UserCheck,
} from "lucide-react";
import { CrisisAlert } from "@/types";

function getIconForType(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes("fire")) return <Flame className="w-4 h-4 text-orange-400" />;
  if (lower.includes("medical")) return <HeartPulse className="w-4 h-4 text-red-400" />;
  if (lower.includes("intruder") || lower.includes("security"))
    return <ShieldAlert className="w-4 h-4 text-red-500" />;
  if (lower.includes("electrical") || lower.includes("power"))
    return <Zap className="w-4 h-4 text-yellow-300" />;
  if (lower.includes("facility") || lower.includes("water"))
    return <Wrench className="w-4 h-4 text-blue-400" />;
  return <AlertTriangle className="w-4 h-4 text-orange-400" />;
}

const threatDotColors: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22c55e",
};

export default function ReportHistory() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reports, setReports] = useState<CrisisAlert[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("crisisAlerts");
    if (stored) {
      try {
        setReports(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  // Re-check when the panel is expanded
  useEffect(() => {
    if (isExpanded) {
      const stored = localStorage.getItem("crisisAlerts");
      if (stored) {
        try {
          setReports(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    }
  }, [isExpanded]);

  // Poll for updates (so students see responses)
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem("crisisAlerts");
      if (stored) {
        try {
          setReports(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("crisisAlerts");
    setReports([]);
  };

  if (reports.length === 0) return null;

  return (
    <div
      className="w-full rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--card-border)",
      }}
    >
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
        style={{ color: "var(--text-secondary)" }}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4" />
          <span className="text-sm font-semibold">
            Past Reports ({reports.length})
          </span>
          {reports.some((r) => r.responderResponse) && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{
                background: "rgba(34, 197, 94, 0.12)",
                color: "#22c55e",
                border: "1px solid rgba(34, 197, 94, 0.2)",
              }}
            >
              New Replies
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          className="px-4 pb-4 space-y-2"
          style={{ animation: "slide-down 0.2s ease-out" }}
        >
          {reports.slice(0, 5).map((report) => (
            <div key={report.id} className="history-card">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {getIconForType(report.geminiAnalysis.incident_type)}
                  <span
                    className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {report.geminiAnalysis.incident_type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {report.responderResponse && (
                    <span
                      className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: "rgba(34, 197, 94, 0.12)",
                        color: "#22c55e",
                        border: "1px solid rgba(34, 197, 94, 0.2)",
                      }}
                    >
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Replied
                    </span>
                  )}
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        threatDotColors[report.geminiAnalysis.threat_level] ||
                        "#6b7280",
                    }}
                  />
                  <span
                    className="text-[10px] font-semibold uppercase"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {report.geminiAnalysis.threat_level}
                  </span>
                </div>
              </div>
              <p
                className="text-xs mb-1 line-clamp-2"
                style={{ color: "var(--text-secondary)" }}
              >
                {report.description}
              </p>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {report.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {report.timestamp}
                </span>
              </div>

              {/* Responder Response for Student */}
              {report.responderResponse && (
                <div
                  className="mt-2 rounded-lg p-2.5"
                  style={{
                    background: "rgba(34, 197, 94, 0.06)",
                    border: "1px solid rgba(34, 197, 94, 0.15)",
                    animation: "fade-in 0.3s ease-out",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageSquare className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
                      Security Response
                    </span>
                  </div>
                  <p
                    className="text-xs leading-relaxed mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {report.responderResponse.message}
                  </p>
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-2.5 h-2.5" />
                      {report.responderResponse.responderName}
                    </span>
                    {report.responderResponse.estimatedArrival && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        ETA: {report.responderResponse.estimatedArrival}
                      </span>
                    )}
                  </div>
                  {report.responderResponse.actionTaken && (
                    <p
                      className="text-[10px] mt-1 italic"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Action: {report.responderResponse.actionTaken}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {reports.length > 5 && (
            <p
              className="text-xs text-center py-1"
              style={{ color: "var(--text-muted)" }}
            >
              + {reports.length - 5} more reports
            </p>
          )}

          <button
            onClick={clearHistory}
            className="w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg transition-colors cursor-pointer"
            style={{
              color: "var(--text-muted)",
              background: "var(--surface-hover, rgba(0,0,0,0.05))",
            }}
          >
            <Trash2 className="w-3 h-3" />
            Clear History
          </button>
        </div>
      )}
    </div>
  );
}
