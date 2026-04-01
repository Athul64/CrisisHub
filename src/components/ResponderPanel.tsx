"use client";

import React, { useState } from "react";
import {
  Send,
  Shield,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  X,
  ChevronDown,
  MessageSquare,
  UserCheck,
  Navigation,
  Eye,
  CircleCheckBig,
} from "lucide-react";
import { CrisisAlert, ResponderResponse } from "@/types";

interface ResponderPanelProps {
  alert: CrisisAlert;
  onRespond: (alertId: string, response: ResponderResponse) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: {
  value: ResponderResponse["status"];
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  {
    value: "acknowledged",
    label: "Acknowledged",
    icon: Eye,
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
  },
  {
    value: "dispatched",
    label: "Units Dispatched",
    icon: Truck,
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
  },
  {
    value: "en_route",
    label: "En Route",
    icon: Navigation,
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.12)",
  },
  {
    value: "on_scene",
    label: "On Scene",
    icon: UserCheck,
    color: "#f97316",
    bg: "rgba(249, 115, 22, 0.12)",
  },
  {
    value: "resolved",
    label: "Resolved",
    icon: CircleCheckBig,
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.12)",
  },
];

const QUICK_MESSAGES: { label: string; message: string; action: string }[] = [
  {
    label: "🚨 Immediate Response",
    message:
      "Your emergency report has been received and is being treated as a high priority. A security team has been dispatched to your location immediately. Please stay calm and remain in a safe position until help arrives.",
    action:
      "Security team dispatched. Area being secured. Emergency protocols activated.",
  },
  {
    label: "🏥 Medical Response",
    message:
      "We have received your medical emergency report. A medical response team and ambulance have been dispatched to your location. Please do not move the affected person unless they are in immediate danger. Keep the area clear for medical personnel.",
    action:
      "Medical team and ambulance dispatched. First-aid protocols initiated. Hospital notified for potential transfer.",
  },
  {
    label: "🔥 Fire Response",
    message:
      "Fire emergency acknowledged. The campus fire response team and local fire department have been alerted. Please evacuate the building immediately using the nearest stairwell — do NOT use elevators. Proceed to the designated assembly point.",
    action:
      "Fire department alerted. Building evacuation initiated. Adjacent buildings being cleared as a precaution.",
  },
  {
    label: "🔒 Lockdown Protocol",
    message:
      "SECURITY ALERT: A lockdown protocol has been initiated for your area. Please remain indoors, lock all doors, stay away from windows, and keep your phone on silent. Security personnel are actively responding. Do NOT attempt to leave until an all-clear is issued.",
    action:
      "Campus lockdown initiated. Armed security and police dispatched. All building access points being secured. Communication channels activated.",
  },
  {
    label: "🔧 Facility Response",
    message:
      "Your facility issue report has been received. Our maintenance team has been notified and is on their way. If there is any immediate danger (electrical, water near power sources), please move to a safe distance and alert others nearby.",
    action:
      "Maintenance team dispatched. Utility shutoff being coordinated. Area inspection scheduled.",
  },
  {
    label: "✅ Situation Resolved",
    message:
      "The situation at your reported location has been assessed and resolved by our response team. The area is now safe. If you experience any further concerns, please do not hesitate to submit another report. Your safety is our priority.",
    action:
      "Incident resolved. Area cleared and deemed safe. Incident report filed for records.",
  },
];

export default function ResponderPanel({
  alert,
  onRespond,
  onClose,
}: ResponderPanelProps) {
  const [status, setStatus] = useState<ResponderResponse["status"]>(
    alert.responderResponse?.status || "acknowledged"
  );
  const [message, setMessage] = useState(
    alert.responderResponse?.message || ""
  );
  const [actionTaken, setActionTaken] = useState(
    alert.responderResponse?.actionTaken || ""
  );
  const [estimatedArrival, setEstimatedArrival] = useState(
    alert.responderResponse?.estimatedArrival || ""
  );
  const [additionalNotes, setAdditionalNotes] = useState(
    alert.responderResponse?.additionalNotes || ""
  );
  const [responderName, setResponderName] = useState(
    alert.responderResponse?.responderName || ""
  );
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const handleQuickMessage = (qm: (typeof QUICK_MESSAGES)[number]) => {
    setMessage(qm.message);
    setActionTaken(qm.action);
    setShowQuickMessages(false);
  };

  const handleSubmit = () => {
    if (!message.trim() || !responderName.trim()) return;

    setSending(true);

    // Simulate a short delay like a real dispatch system
    setTimeout(() => {
      const response: ResponderResponse = {
        responderId: `RESP-${Date.now()}`,
        responderName: responderName.trim(),
        status,
        message: message.trim(),
        actionTaken: actionTaken.trim(),
        estimatedArrival: estimatedArrival.trim() || undefined,
        additionalNotes: additionalNotes.trim() || undefined,
        respondedAt: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      onRespond(alert.id, response);
      setSending(false);
    }, 800);
  };

  const isValid = message.trim() && responderName.trim();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ animation: "fade-in 0.2s ease-out" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
          animation: "scale-in 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-5 rounded-t-2xl"
          style={{
            background: "var(--card-bg)",
            borderBottom: "1px solid var(--card-border)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(59, 130, 246, 0.12)",
              }}
            >
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2
                className="text-base font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Compose Response
              </h2>
              <p
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                Alert #{alert.id.slice(-6)} • {alert.geminiAnalysis.incident_type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors cursor-pointer"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--card-border)",
            }}
          >
            <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Alert Summary */}
        <div className="px-5 pt-4">
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--card-border)",
            }}
          >
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      alert.geminiAnalysis.threat_level === "Critical"
                        ? "bg-red-600 text-white"
                        : alert.geminiAnalysis.threat_level === "High"
                        ? "bg-orange-600 text-white"
                        : alert.geminiAnalysis.threat_level === "Medium"
                        ? "bg-yellow-600 text-black"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {alert.geminiAnalysis.threat_level}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {alert.geminiAnalysis.incident_type}
                  </span>
                </div>
                <p
                  className="text-sm italic mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  &ldquo;{alert.description}&rdquo;
                </p>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {alert.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {alert.timestamp}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Responder Name */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <UserCheck className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              Responder Name *
            </label>
            <input
              type="text"
              value={responderName}
              onChange={(e) => setResponderName(e.target.value)}
              placeholder="e.g. Officer Kumar, Security Desk"
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              style={{
                background: "var(--input-bg)",
                border: "1.5px solid var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Response Status */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Response Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all cursor-pointer"
                  style={{
                    background:
                      status === opt.value ? opt.bg : "var(--surface)",
                    border: `1.5px solid ${
                      status === opt.value ? opt.color : "var(--card-border)"
                    }`,
                    color:
                      status === opt.value ? opt.color : "var(--text-muted)",
                  }}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Message Templates */}
          <div>
            <button
              onClick={() => setShowQuickMessages(!showQuickMessages)}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  showQuickMessages ? "rotate-180" : ""
                }`}
              />
              Quick Response Templates
            </button>
            {showQuickMessages && (
              <div
                className="grid grid-cols-2 gap-2"
                style={{ animation: "slide-down 0.2s ease-out" }}
              >
                {QUICK_MESSAGES.map((qm) => (
                  <button
                    key={qm.label}
                    onClick={() => handleQuickMessage(qm)}
                    className="text-left text-xs p-3 rounded-xl transition-all cursor-pointer"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--card-border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span className="font-semibold block mb-0.5">{qm.label}</span>
                    <span className="line-clamp-2 opacity-70">{qm.message.slice(0, 80)}...</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message to Student */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <MessageSquare className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              Message to Student / Reporter *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide a clear, professional response addressing the reported issue and describing the actions being taken..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
              style={{
                background: "var(--input-bg)",
                border: "1.5px solid var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Action Taken */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              Action Taken / Plan
            </label>
            <textarea
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="Describe the actions taken or the response plan..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
              style={{
                background: "var(--input-bg)",
                border: "1.5px solid var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Row: ETA + Additional Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                <Clock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Estimated Arrival
              </label>
              <input
                type="text"
                value={estimatedArrival}
                onChange={(e) => setEstimatedArrival(e.target.value)}
                placeholder="e.g. 3-5 minutes"
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                style={{
                  background: "var(--input-bg)",
                  border: "1.5px solid var(--input-border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Additional Notes
              </label>
              <input
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Notify Dean, block access..."
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                style={{
                  background: "var(--input-bg)",
                  border: "1.5px solid var(--input-border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || sending}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: sending
                ? "#22c55e"
                : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              boxShadow: !sending
                ? "0 8px 24px rgba(37, 99, 235, 0.3)"
                : "0 8px 24px rgba(34, 197, 94, 0.3)",
            }}
          >
            {sending ? (
              <>
                <CheckCircle2 className="w-4 h-4 animate-pulse" />
                Sending Response...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Response to Student
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
