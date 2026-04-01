"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Radio,
  Plus,
  Trash2,
  Activity,
  AlertTriangle,
  Clock,
  Bell,
  Volume2,
  VolumeX,
  MapPin,
  Filter,
  Search,
  BarChart3,
  Download,
  RefreshCw,
} from "lucide-react";
import AlertFeed from "@/components/AlertFeed";
import ResponderPanel from "@/components/ResponderPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/components/ToastProvider";
import { CrisisAlert, GeminiResponse, ResponderResponse } from "@/types";

const MOCK_RESPONSES: Array<{
  description: string;
  location: string;
  analysis: GeminiResponse;
}> = [
  {
    description: "Smoke coming from the chemistry lab on the second floor",
    location: "Block B, Floor 2 — Chemistry Lab",
    analysis: {
      threat_level: "Critical",
      incident_type: "Fire",
      immediate_action_for_user:
        "Evacuate the building immediately using the nearest stairwell. Do not use elevators.",
      brief_for_security:
        "Possible fire in Block B Chemistry Lab, Floor 2. Smoke reported. Initiate fire protocol: evacuate Block B, dispatch fire response unit, alert local fire department.",
      estimated_severity_score: 9,
      recommended_units: ["Fire Department", "Campus Security", "Ambulance"],
    },
  },
  {
    description: "Student collapsed in the cafeteria, not responding",
    location: "Block D — Cafeteria",
    analysis: {
      threat_level: "High",
      incident_type: "Medical",
      immediate_action_for_user:
        "Do not move the person. Check for breathing and call for help. Stay with them until medical responders arrive.",
      brief_for_security:
        "Medical emergency in Block D Cafeteria. Unresponsive student reported. Dispatch campus medical team immediately. Consider ambulance preemptively.",
      estimated_severity_score: 8,
      recommended_units: ["Ambulance", "Campus Security", "Campus Medical Team"],
    },
  },
  {
    description:
      "Suspicious person seen near the hostel entrance with a weapon",
    location: "Hostel Block 1",
    analysis: {
      threat_level: "Critical",
      incident_type: "Intruder / Security Threat",
      immediate_action_for_user:
        "Lock your door immediately, move away from windows, and remain silent. Do not confront the individual.",
      brief_for_security:
        "Armed intruder alert at Hostel Block 1 entrance. Activate lockdown protocol. Deploy armed security. Coordinate with local law enforcement for rapid response.",
      estimated_severity_score: 10,
      recommended_units: ["Police", "Campus Security", "Ambulance"],
    },
  },
  {
    description: "Water pipe burst flooding the ground floor library",
    location: "Block C, Floor 1 — Library",
    analysis: {
      threat_level: "Medium",
      incident_type: "Facility - Water Damage",
      immediate_action_for_user:
        "Leave the library through the main exit. Avoid areas with standing water to prevent electric shock risk.",
      brief_for_security:
        "Water main break in Block C Library, ground floor. Flooding in progress. Cut water supply to Block C. Deploy maintenance and facilities team. Check electrical panels.",
      estimated_severity_score: 5,
      recommended_units: ["Facilities/Maintenance", "Campus Security"],
    },
  },
  {
    description:
      "Strange chemical smell coming from the ventilation system in faculty offices",
    location: "Block A, Floor 3 — Faculty Offices",
    analysis: {
      threat_level: "High",
      incident_type: "Hazmat / Chemical",
      immediate_action_for_user:
        "Leave the area immediately and move to open air. Cover your nose and mouth with a cloth if possible.",
      brief_for_security:
        "Chemical odor via HVAC in Block A Floor 3. Possible gas leak or chemical spill. Evacuate Block A upper floors. Shut down ventilation. Deploy hazmat assessment team.",
      estimated_severity_score: 8,
      recommended_units: [
        "Hazmat Team",
        "Fire Department",
        "Campus Security",
        "Ambulance",
      ],
    },
  },
  {
    description:
      "Sparking electrical panel in the parking area, smell of burning wire",
    location: "Parking Area",
    analysis: {
      threat_level: "High",
      incident_type: "Electrical / Power",
      immediate_action_for_user:
        "Stay away from the electrical panel and any metal surfaces. Move vehicles away from the area if safe to do so.",
      brief_for_security:
        "Electrical fire hazard at Parking Area. Sparking panel reported. Cut power to parking zone. Deploy electrical maintenance and fire unit on standby. Clear vehicles from vicinity.",
      estimated_severity_score: 7,
      recommended_units: [
        "Fire Department",
        "Facilities/Maintenance",
        "Campus Security",
      ],
    },
  },
];

type FilterType = "all" | "Critical" | "High" | "Medium" | "Low";

export default function SecurityDashboard() {
  const [alerts, setAlerts] = useState<CrisisAlert[]>([]);
  const [mockIndex, setMockIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [filterLevel, setFilterLevel] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [respondingAlertId, setRespondingAlertId] = useState<string | null>(null);
  const { addToast } = useToast();

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load alerts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("crisisAlerts");
    if (stored) {
      try {
        setAlerts(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  // Poll localStorage for new student-submitted alerts
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      const stored = localStorage.getItem("crisisAlerts");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAlerts((prev) => {
            if (parsed.length !== prev.length) {
              if (soundEnabled && parsed.length > prev.length) {
                playAlertSound();
                addToast({
                  type: "warning",
                  title: "New Alert Incoming",
                  message: `${parsed.length - prev.length} new alert(s) received.`,
                });
              }
              return parsed;
            }
            return prev;
          });
        } catch {
          // ignore
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [soundEnabled, autoRefresh, addToast]);

  const playAlertSound = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "square";
      gain.gain.value = 0.15;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio not supported
    }
  };

  const simulateAlert = useCallback(() => {
    const mock = MOCK_RESPONSES[mockIndex % MOCK_RESPONSES.length];
    const newAlert: CrisisAlert = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      location: mock.location,
      description: mock.description,
      geminiAnalysis: mock.analysis,
    };

    if (soundEnabled) playAlertSound();

    setAlerts((prev) => {
      const updated = [newAlert, ...prev];
      localStorage.setItem("crisisAlerts", JSON.stringify(updated));
      return updated;
    });
    setMockIndex((i) => i + 1);

    addToast({
      type: "warning",
      title: `Simulated: ${mock.analysis.incident_type}`,
      message: `${mock.analysis.threat_level} threat at ${mock.location}`,
    });
  }, [mockIndex, soundEnabled, addToast]);

  const clearAlerts = () => {
    setAlerts([]);
    localStorage.removeItem("crisisAlerts");
    addToast({
      type: "info",
      title: "Alerts Cleared",
      message: "All alerts have been removed.",
    });
  };

  const exportAlerts = () => {
    const data = JSON.stringify(alerts, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crisishub-alerts-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({
      type: "success",
      title: "Alerts Exported",
      message: "JSON file has been downloaded.",
    });
  };

  const handleRespond = (alertId: string, response: ResponderResponse) => {
    setAlerts((prev) => {
      const updated = prev.map((a) =>
        a.id === alertId ? { ...a, responderResponse: response } : a
      );
      localStorage.setItem("crisisAlerts", JSON.stringify(updated));
      return updated;
    });
    setRespondingAlertId(null);
    addToast({
      type: "success",
      title: "Response Sent",
      message: "Your response has been recorded and sent to the student.",
    });
  };

  const respondingAlert = alerts.find((a) => a.id === respondingAlertId) || null;

  // Filtering
  const filteredAlerts = alerts.filter((a) => {
    const matchesLevel =
      filterLevel === "all" || a.geminiAnalysis.threat_level === filterLevel;
    const matchesSearch =
      !searchQuery.trim() ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.geminiAnalysis.incident_type
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const criticalCount = alerts.filter(
    (a) =>
      a.geminiAnalysis.threat_level === "Critical" ||
      a.geminiAnalysis.threat_level === "High"
  ).length;

  const mediumCount = alerts.filter(
    (a) => a.geminiAnalysis.threat_level === "Medium"
  ).length;

  const lowCount = alerts.filter(
    (a) => a.geminiAnalysis.threat_level === "Low"
  ).length;

  const uniqueLocations = [...new Set(alerts.map((a) => a.location))];

  const filterOptions: { label: string; value: FilterType; color: string }[] = [
    { label: "All", value: "all", color: "var(--text-secondary)" },
    { label: "Critical", value: "Critical", color: "#ef4444" },
    { label: "High", value: "High", color: "#f97316" },
    { label: "Medium", value: "Medium", color: "#eab308" },
    { label: "Low", value: "Low", color: "#22c55e" },
  ];

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        background: "var(--background)",
        color: "var(--text-primary)",
      }}
    >
      {/* Top Bar */}
      <header
        className="sticky top-0 z-50 glass"
        style={{
          borderBottom: "1px solid var(--card-border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wide flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                CrisisHub
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-widest"
                  style={{
                    background: "var(--surface)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  Security Console
                </span>
              </h1>
              <p
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Responder Dashboard • Adi Shankara Institute
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Auto-refresh toggle */}
            <button
              onClick={() => {
                setAutoRefresh(!autoRefresh);
                addToast({
                  type: "info",
                  title: autoRefresh ? "Auto-refresh Off" : "Auto-refresh On",
                  duration: 2000,
                });
              }}
              className="p-2 rounded-xl transition-colors cursor-pointer"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--card-border)",
                color: autoRefresh ? "#22c55e" : "var(--text-muted)",
              }}
              title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            >
              <RefreshCw
                className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`}
                style={{
                  animationDuration: autoRefresh ? "3s" : undefined,
                }}
              />
            </button>

            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl transition-colors cursor-pointer"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--card-border)",
                color: soundEnabled ? "#22c55e" : "var(--text-muted)",
              }}
              title={soundEnabled ? "Mute alerts" : "Unmute alerts"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Live indicator */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--card-border)",
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-green-400 font-medium">LIVE</span>
            </div>

            <a
              href="/"
              className="text-xs transition-colors hidden md:block"
              style={{ color: "var(--text-muted)" }}
            >
              ← Student View
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            {
              icon: Activity,
              value: alerts.length,
              label: "Total Alerts",
              iconColor: "#3b82f6",
              iconBg: "rgba(59, 130, 246, 0.1)",
            },
            {
              icon: AlertTriangle,
              value: criticalCount,
              label: "Critical / High",
              iconColor: "#ef4444",
              iconBg: "rgba(239, 68, 68, 0.1)",
              valueColor: "#ef4444",
            },
            {
              icon: Bell,
              value: mediumCount,
              label: "Medium",
              iconColor: "#eab308",
              iconBg: "rgba(234, 179, 8, 0.1)",
              valueColor: "#eab308",
            },
            {
              icon: Radio,
              value: lowCount || "Online",
              label: lowCount ? "Low" : "System Status",
              iconColor: "#22c55e",
              iconBg: "rgba(34, 197, 94, 0.1)",
              valueColor: "#22c55e",
            },
            {
              icon: Clock,
              value: currentTime,
              label: "Current Time",
              iconColor: "#a855f7",
              iconBg: "rgba(168, 85, 247, 0.1)",
              isTime: true,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="glass-card p-4 flex items-center gap-3"
              style={{ animation: `fade-in 0.4s ease-out ${i * 0.05}s both` }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: stat.iconBg }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.iconColor }} />
              </div>
              <div>
                <p
                  className={`font-bold ${
                    (stat as { isTime?: boolean }).isTime ? "text-lg font-mono" : "text-2xl"
                  }`}
                  style={{ color: (stat as { valueColor?: string }).valueColor || "var(--text-primary)" }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-[11px] uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Affected Locations Summary */}
        {uniqueLocations.length > 0 && (
          <div
            className="mb-6 glass-card p-4"
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <MapPin className="w-3.5 h-3.5" />
              Affected Locations ({uniqueLocations.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {uniqueLocations.map((loc) => (
                <span
                  key={loc}
                  className="text-xs px-2.5 py-1 rounded-lg"
                  style={{
                    background: "rgba(220, 38, 38, 0.08)",
                    color: "#ef4444",
                    border: "1px solid rgba(220, 38, 38, 0.15)",
                  }}
                >
                  📍 {loc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              id="dashboard-search"
              type="text"
              placeholder="Search alerts by description, location, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
              style={{
                background: "var(--input-bg)",
                border: "1.5px solid var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterLevel(opt.value)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer"
                style={{
                  background:
                    filterLevel === opt.value
                      ? opt.value === "all"
                        ? "var(--surface)"
                        : `${opt.color}20`
                      : "transparent",
                  border: `1.5px solid ${
                    filterLevel === opt.value
                      ? opt.color
                      : "var(--card-border)"
                  }`,
                  color:
                    filterLevel === opt.value
                      ? opt.color
                      : "var(--text-muted)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Incoming Alerts
            </h2>
            {filteredAlerts.length !== alerts.length && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--surface)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--card-border)",
                }}
              >
                {filteredAlerts.length} of {alerts.length}
              </span>
            )}
            {criticalCount > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {criticalCount} urgent
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              id="simulate-alert-btn"
              onClick={simulateAlert}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-red-900/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Simulate Alert
            </button>

            {alerts.length > 0 && (
              <>
                <button
                  onClick={exportAlerts}
                  className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--card-border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>

                <button
                  id="clear-alerts-btn"
                  onClick={clearAlerts}
                  className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--card-border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>

        {/* Alert Feed */}
        <AlertFeed alerts={filteredAlerts} onRespond={(id) => setRespondingAlertId(id)} />
      </main>

      {/* Footer */}
      <footer
        className="text-center py-6 mt-8"
        style={{ borderTop: "1px solid var(--card-border)" }}
      >
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          CrisisHub Security Dashboard — Built for GDG &ldquo;Build with
          AI&rdquo; Hackathon @ Adi Shankara Institute • Powered by Gemini AI
        </p>
      </footer>

      {/* Responder Panel Modal */}
      {respondingAlert && (
        <ResponderPanel
          alert={respondingAlert}
          onRespond={handleRespond}
          onClose={() => setRespondingAlertId(null)}
        />
      )}
    </div>
  );
}
