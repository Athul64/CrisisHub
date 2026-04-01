"use client";

import React from "react";
import {
  AlertTriangle,
  Clock,
  MapPin,
  Flame,
  ShieldAlert,
  HeartPulse,
  Wrench,
  Zap,
  Truck,
  CircleAlert,
  MessageSquare,
  CheckCircle2,
  UserCheck,
  Navigation,
  Eye,
  CircleCheckBig,
  Send,
} from "lucide-react";
import { CrisisAlert } from "@/types";

interface AlertFeedProps {
  alerts: CrisisAlert[];
  onRespond?: (alertId: string) => void;
}

const threatColors: Record<string, { border: string; bg: string }> = {
  Critical: { border: "rgba(239, 68, 68, 0.5)", bg: "rgba(239, 68, 68, 0.06)" },
  High: { border: "rgba(249, 115, 22, 0.5)", bg: "rgba(249, 115, 22, 0.06)" },
  Medium: { border: "rgba(234, 179, 8, 0.5)", bg: "rgba(234, 179, 8, 0.06)" },
  Low: { border: "rgba(34, 197, 94, 0.5)", bg: "rgba(34, 197, 94, 0.06)" },
};

const threatBadgeColors: Record<string, string> = {
  Critical: "bg-red-600 text-white",
  High: "bg-orange-600 text-white",
  Medium: "bg-yellow-600 text-black",
  Low: "bg-green-600 text-white",
};

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  acknowledged: {
    label: "Acknowledged",
    icon: Eye,
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
  },
  dispatched: {
    label: "Units Dispatched",
    icon: Truck,
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
  },
  en_route: {
    label: "En Route",
    icon: Navigation,
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.12)",
  },
  on_scene: {
    label: "On Scene",
    icon: UserCheck,
    color: "#f97316",
    bg: "rgba(249, 115, 22, 0.12)",
  },
  resolved: {
    label: "Resolved",
    icon: CircleCheckBig,
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.12)",
  },
};

function getIncidentIcon(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes("fire"))
    return <Flame className="w-5 h-5 text-orange-400" />;
  if (lower.includes("medical") || lower.includes("health"))
    return <HeartPulse className="w-5 h-5 text-red-400" />;
  if (lower.includes("intruder") || lower.includes("security"))
    return <ShieldAlert className="w-5 h-5 text-red-500" />;
  if (lower.includes("electrical") || lower.includes("power"))
    return <Zap className="w-5 h-5 text-yellow-300" />;
  if (lower.includes("facility") || lower.includes("water"))
    return <Wrench className="w-5 h-5 text-blue-400" />;
  if (lower.includes("hazmat") || lower.includes("chemical"))
    return <CircleAlert className="w-5 h-5 text-purple-400" />;
  return <AlertTriangle className="w-5 h-5 text-orange-400" />;
}

export default function AlertFeed({ alerts, onRespond }: AlertFeedProps) {
  if (alerts.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20"
        style={{ color: "var(--text-muted)" }}
      >
        <ShieldAlert className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">No active alerts</p>
        <p className="text-sm">All clear — campus is secure</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {alerts.map((alert, index) => {
        const isCritical =
          alert.geminiAnalysis.threat_level === "Critical" ||
          alert.geminiAnalysis.threat_level === "High";

        const severity = alert.geminiAnalysis.estimated_severity_score;
        const colors =
          threatColors[alert.geminiAnalysis.threat_level] || {
            border: "var(--card-border)",
            bg: "var(--surface)",
          };

        const hasResponse = !!alert.responderResponse;
        const responseStatus = alert.responderResponse?.status;
        const statusInfo = responseStatus ? statusConfig[responseStatus] : null;

        return (
          <div
            key={alert.id}
            className="rounded-xl p-5 transition-all duration-300"
            style={{
              background: colors.bg,
              border: `2px solid ${colors.border}`,
              animation: `slide-in 0.4s ease-out ${index * 0.1}s both${
                isCritical && !hasResponse
                  ? ", critical-blink 1.5s ease-in-out infinite"
                  : ""
              }`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getIncidentIcon(alert.geminiAnalysis.incident_type)}
                <span
                  className="font-bold text-sm uppercase tracking-wide"
                  style={{ color: "var(--text-primary)" }}
                >
                  {alert.geminiAnalysis.incident_type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasResponse && statusInfo && (
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: statusInfo.bg,
                      color: statusInfo.color,
                      border: `1px solid ${statusInfo.color}30`,
                    }}
                  >
                    <statusInfo.icon className="w-3 h-3" />
                    {statusInfo.label}
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    threatBadgeColors[alert.geminiAnalysis.threat_level] ||
                    "bg-gray-600 text-white"
                  }`}
                >
                  {alert.geminiAnalysis.threat_level}
                </span>
              </div>
            </div>

            {/* Severity Bar */}
            {severity && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Severity
                  </span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {severity}/10
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--surface)" }}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      severity >= 8
                        ? "bg-red-500"
                        : severity >= 5
                        ? "bg-orange-500"
                        : "bg-yellow-500"
                    }`}
                    style={{ width: `${severity * 10}%` }}
                  />
                </div>
              </div>
            )}

            {/* Image preview */}
            {alert.imageBase64 && (
              <div
                className="mb-3 rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--card-border)" }}
              >
                <img
                  src={alert.imageBase64}
                  alt="Incident evidence"
                  className="w-full h-32 object-cover"
                />
              </div>
            )}

            {/* Meta */}
            <div className="space-y-2 mb-3">
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>{alert.timestamp}</span>
              </div>
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{alert.location}</span>
              </div>
            </div>

            {/* Description */}
            <p
              className="text-sm mb-3 italic"
              style={{ color: "var(--text-secondary)" }}
            >
              &ldquo;{alert.description}&rdquo;
            </p>

            {/* Recommended Units */}
            {alert.geminiAnalysis.recommended_units &&
              alert.geminiAnalysis.recommended_units.length > 0 && (
                <div className="mb-3">
                  <p
                    className="text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Truck className="w-3 h-3" />
                    Dispatch
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {alert.geminiAnalysis.recommended_units.map((unit) => (
                      <span
                        key={unit}
                        className="text-[10px] px-2 py-1 rounded-md font-medium"
                        style={{
                          background: "rgba(37, 99, 235, 0.1)",
                          color: "#60a5fa",
                          border: "1px solid rgba(37, 99, 235, 0.2)",
                        }}
                      >
                        {unit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Security Brief */}
            <div
              className="rounded-lg p-3 mb-3"
              style={{
                background: "rgba(0, 0, 0, 0.1)",
                border: "1px solid var(--card-border)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Security Brief
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-primary)" }}
              >
                {alert.geminiAnalysis.brief_for_security}
              </p>
            </div>

            {/* Responder Response (if exists) */}
            {hasResponse && alert.responderResponse && (
              <div
                className="rounded-lg p-3 mb-3"
                style={{
                  background: "rgba(34, 197, 94, 0.06)",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                  animation: "fade-in 0.4s ease-out",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <p className="text-xs font-bold text-green-400 uppercase tracking-wider">
                    Responder Reply
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <UserCheck className="w-3 h-3" />
                    <span className="font-medium">{alert.responderResponse.responderName}</span>
                    <span>•</span>
                    <span>{alert.responderResponse.respondedAt}</span>
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {alert.responderResponse.message}
                  </p>
                  {alert.responderResponse.actionTaken && (
                    <div
                      className="rounded-md p-2 mt-1"
                      style={{
                        background: "rgba(59, 130, 246, 0.06)",
                        border: "1px solid rgba(59, 130, 246, 0.15)",
                      }}
                    >
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">
                        Action Plan
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {alert.responderResponse.actionTaken}
                      </p>
                    </div>
                  )}
                  {alert.responderResponse.estimatedArrival && (
                    <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <Clock className="w-3 h-3" />
                      ETA: {alert.responderResponse.estimatedArrival}
                    </p>
                  )}
                  {alert.responderResponse.additionalNotes && (
                    <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                      Note: {alert.responderResponse.additionalNotes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Respond Button */}
            {onRespond && (
              <button
                onClick={() => onRespond(alert.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
                style={{
                  background: hasResponse
                    ? "rgba(34, 197, 94, 0.08)"
                    : "rgba(59, 130, 246, 0.1)",
                  border: `1.5px solid ${
                    hasResponse
                      ? "rgba(34, 197, 94, 0.25)"
                      : "rgba(59, 130, 246, 0.3)"
                  }`,
                  color: hasResponse ? "#22c55e" : "#3b82f6",
                }}
              >
                {hasResponse ? (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Update Response
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Respond to Student
                  </>
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
