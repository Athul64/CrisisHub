"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  MapPin,
  FileText,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Radio,
  Mic,
  MicOff,
  Phone,
  Flame,
  HeartPulse,
  ShieldAlert,
  Wrench,
  Zap,
  AlertTriangle,
  Clock,
  Truck,
  Share2,
  Copy,
  Timer,
  Sparkles,
} from "lucide-react";
import SosButton from "@/components/SosButton";
import CameraUploader from "@/components/CameraUploader";
import LocationInput from "@/components/LocationInput";
import ThemeToggle from "@/components/ThemeToggle";
import ReportHistory from "@/components/ReportHistory";
import { useToast } from "@/components/ToastProvider";
import { GeminiResponse } from "@/types";

const CAMPUS_LOCATIONS = [
  "Block A, Floor 1 — Main Entrance",
  "Block A, Floor 2 — Computer Lab",
  "Block A, Floor 3 — Faculty Offices",
  "Block B, Floor 1 — Chemistry Lab",
  "Block B, Floor 2 — Physics Lab",
  "Block B, Floor 3 — Lecture Halls",
  "Block C, Floor 1 — Library",
  "Block C, Floor 2 — Study Rooms",
  "Block D — Cafeteria",
  "Block D — Auditorium",
  "Hostel Block 1",
  "Hostel Block 2",
  "Sports Complex",
  "Parking Area",
  "Campus Garden / Open Ground",
];

const QUICK_CRISIS_TYPES = [
  { label: "🔥 Fire", text: "Fire emergency", icon: Flame },
  { label: "🏥 Medical", text: "Medical emergency - someone needs help", icon: HeartPulse },
  { label: "🚨 Intruder", text: "Suspicious/threatening person spotted", icon: ShieldAlert },
  { label: "💧 Flooding", text: "Water flooding / pipe burst", icon: Wrench },
  { label: "⚡ Electrical", text: "Electrical hazard / power issue", icon: Zap },
  { label: "☣️ Chemical", text: "Chemical spill or toxic fumes", icon: AlertTriangle },
];

const EMERGENCY_CONTACTS = [
  { name: "Campus Security", number: "1800-XXX-0001", icon: Shield },
  { name: "Ambulance", number: "108", icon: Truck },
  { name: "Fire Station", number: "101", icon: Flame },
  { name: "Police", number: "100", icon: ShieldAlert },
];

type ViewState = "idle" | "form" | "loading" | "result";

export default function StudentSOSPage() {
  const [view, setView] = useState<ViewState>("idle");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState<GeminiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const etaRef = useRef<NodeJS.Timeout | null>(null);
  const { addToast } = useToast();

  // Track character count
  useEffect(() => {
    setCharCount(description.length);
  }, [description]);

  // Voice input setup
  const startVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast({
        type: "warning",
        title: "Voice Not Supported",
        message: "Try using Google Chrome for voice input.",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setDescription(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      addToast({
        type: "error",
        title: "Voice Input Error",
        message: "Could not capture audio. Please try again.",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);

    // Haptic feedback on supported devices
    if (navigator.vibrate) navigator.vibrate(50);

    addToast({
      type: "info",
      title: "Listening...",
      message: "Speak clearly to describe the emergency.",
      duration: 3000,
    });
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // Timer for loading state
  useEffect(() => {
    if (view === "loading") {
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime((t) => t + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view]);

  // ETA countdown for result view
  useEffect(() => {
    if (view === "result" && result) {
      // Simulate ETA based on severity
      const baseEta =
        result.threat_level === "Critical"
          ? 120
          : result.threat_level === "High"
          ? 180
          : result.threat_level === "Medium"
          ? 300
          : 420;
      setEtaSeconds(baseEta);

      etaRef.current = setInterval(() => {
        setEtaSeconds((prev) => {
          if (prev <= 1) {
            if (etaRef.current) clearInterval(etaRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (etaRef.current) clearInterval(etaRef.current);
    };
  }, [view, result]);

  const formatEta = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      addToast({
        type: "warning",
        title: "Description Required",
        message: "Please describe the emergency before submitting.",
      });
      return;
    }

    if (!location.trim()) {
      addToast({
        type: "warning",
        title: "Location Required",
        message: "Please specify your location.",
      });
      return;
    }

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    setView("loading");
    setError(null);

    try {
      const res = await fetch("/api/crisis-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          location,
          imageBase64: imageBase64 || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to analyze crisis");

      const data: GeminiResponse = await res.json();
      setResult(data);
      setView("result");

      // Store in localStorage so the dashboard can pick it up
      const existing = JSON.parse(
        localStorage.getItem("crisisAlerts") || "[]"
      );
      existing.unshift({
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        location,
        description,
        imageBase64: imageBase64 || undefined,
        geminiAnalysis: data,
      });
      localStorage.setItem("crisisAlerts", JSON.stringify(existing));

      addToast({
        type: "success",
        title: "Report Sent Successfully",
        message: "Campus security has been alerted.",
      });

      // Haptic for success
      if (navigator.vibrate) navigator.vibrate(200);
    } catch (err) {
      console.error(err);
      setError("Failed to reach emergency services. Please try again.");
      setView("form");

      addToast({
        type: "error",
        title: "Submission Failed",
        message: "Could not reach the server. Please try again.",
      });
    }
  };

  const resetForm = () => {
    setView("idle");
    setDescription("");
    setLocation(CAMPUS_LOCATIONS[0]);
    setImageBase64(null);
    setResult(null);
    setError(null);
    setShowContacts(false);
  };

  const shareReport = async () => {
    if (!result) return;
    const text = `🚨 CrisisHub Emergency Report\n\nType: ${result.incident_type}\nThreat Level: ${result.threat_level}\nLocation: ${location}\nSeverity: ${result.estimated_severity_score}/10\n\nSafety Instructions: ${result.immediate_action_for_user}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "CrisisHub Emergency Report", text });
        addToast({ type: "success", title: "Report Shared" });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      addToast({
        type: "success",
        title: "Copied to Clipboard",
        message: "Report details copied successfully.",
      });
    }
  };

  const getIncidentIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("fire")) return <Flame className="w-5 h-5" />;
    if (lower.includes("medical")) return <HeartPulse className="w-5 h-5" />;
    if (lower.includes("intruder") || lower.includes("security"))
      return <ShieldAlert className="w-5 h-5" />;
    if (lower.includes("electrical") || lower.includes("power"))
      return <Zap className="w-5 h-5" />;
    if (lower.includes("facility") || lower.includes("water"))
      return <Wrench className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        background:
          "linear-gradient(to bottom, var(--gradient-start), var(--gradient-mid), var(--gradient-end))",
        color: "var(--text-primary)",
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 glass"
        style={{
          borderBottom: "1px solid var(--card-border)",
        }}
      >
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide" style={{ color: "var(--text-primary)" }}>
                CrisisHub
              </h1>
              <p
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Campus Emergency SOS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setShowContacts(!showContacts)}
              className="p-2 rounded-xl transition-colors cursor-pointer"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--card-border)",
              }}
              aria-label="Emergency contacts"
            >
              <Phone className="w-4 h-4 text-green-400" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs text-green-400 font-medium">LIVE</span>
            </div>
          </div>
        </div>

        {/* Emergency Contacts Dropdown */}
        {showContacts && (
          <div
            className="max-w-lg mx-auto px-4 pb-3"
            style={{ animation: "slide-in 0.2s ease-out" }}
          >
            <div
              className="rounded-xl p-3 grid grid-cols-2 gap-2"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--card-border)",
              }}
            >
              {EMERGENCY_CONTACTS.map((c) => (
                <a
                  key={c.name}
                  href={`tel:${c.number}`}
                  className="flex items-center gap-2 p-2.5 rounded-lg transition-colors"
                  style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  <c.icon className="w-4 h-4 text-red-400 shrink-0" />
                  <div className="min-w-0">
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {c.name}
                    </p>
                    <p className="text-[10px] text-green-400 font-mono">
                      {c.number}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full">
        {/* IDLE VIEW — SOS Button */}
        {view === "idle" && (
          <div
            className="flex-1 flex flex-col items-center justify-center gap-8 w-full"
            style={{ animation: "fade-in 0.6s ease-out" }}
          >
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest mb-4"
                style={{
                  background: "var(--accent-glow)",
                  color: "#dc2626",
                  border: "1px solid rgba(220, 38, 38, 0.2)",
                }}
              >
                <Sparkles className="w-3 h-3" />
                AI-Powered Response
              </div>
              <h2
                className="text-3xl font-black mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Emergency?
              </h2>
              <p
                className="text-sm max-w-xs mx-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                Press the SOS button to report a campus crisis. AI-powered
                analysis will dispatch help immediately.
              </p>
            </div>

            <SosButton onClick={() => setView("form")} />

            {/* Report History */}
            <div className="w-full mt-4">
              <ReportHistory />
            </div>

            {/* Dashboard link */}
            <a
              href="/dashboard"
              className="mt-2 flex items-center gap-2 text-xs transition-colors group"
              style={{ color: "var(--text-muted)" }}
            >
              <Radio className="w-3.5 h-3.5 group-hover:text-red-400 transition-colors" />
              Security Dashboard →
            </a>
          </div>
        )}

        {/* FORM VIEW */}
        {view === "form" && (
          <div
            className="w-full space-y-5"
            style={{ animation: "fade-in 0.4s ease-out" }}
          >
            <button
              onClick={resetForm}
              className="flex items-center gap-1.5 text-sm transition-colors cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-center">
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Report Emergency
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Provide details so responders can act fast
              </p>
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Quick Crisis Type buttons */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                <Zap className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Quick Select Crisis Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_CRISIS_TYPES.map((crisis) => (
                  <button
                    key={crisis.label}
                    onClick={() => {
                      setDescription(crisis.text);
                      if (navigator.vibrate) navigator.vibrate(30);
                    }}
                    className="text-xs py-2.5 px-2 rounded-xl transition-all duration-200 cursor-pointer text-center"
                    style={{
                      background:
                        description === crisis.text
                          ? "rgba(220, 38, 38, 0.15)"
                          : "var(--surface)",
                      border: `1.5px solid ${
                        description === crisis.text
                          ? "rgba(220, 38, 38, 0.5)"
                          : "var(--card-border)"
                      }`,
                      color:
                        description === crisis.text
                          ? "#dc2626"
                          : "var(--text-secondary)",
                      transform:
                        description === crisis.text
                          ? "scale(0.97)"
                          : "scale(1)",
                    }}
                  >
                    {crisis.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <CameraUploader
              onImageCapture={(b64) => setImageBase64(b64 || null)}
              currentImage={imageBase64}
            />

            {/* Description with Voice */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="block text-sm font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <FileText className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  What&apos;s happening?
                </label>
                <span
                  className="text-[10px] font-mono"
                  style={{
                    color:
                      charCount > 500
                        ? "#ef4444"
                        : charCount > 300
                        ? "#f59e0b"
                        : "var(--text-muted)",
                  }}
                >
                  {charCount}/500
                </span>
              </div>
              <div className="relative">
                <textarea
                  id="crisis-description"
                  value={description}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setDescription(e.target.value);
                    }
                  }}
                  placeholder="Describe the emergency situation in detail..."
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 pr-14 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all resize-none text-sm"
                  style={{
                    background: "var(--input-bg)",
                    border: "2px solid var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                  maxLength={500}
                />
                <button
                  onClick={isListening ? stopVoiceInput : startVoiceInput}
                  className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all cursor-pointer ${
                    isListening ? "animate-pulse" : ""
                  }`}
                  style={{
                    background: isListening
                      ? "#dc2626"
                      : "var(--surface)",
                    color: isListening
                      ? "white"
                      : "var(--text-muted)",
                    border: `1px solid ${
                      isListening
                        ? "transparent"
                        : "var(--card-border)"
                    }`,
                  }}
                  aria-label={
                    isListening ? "Stop recording" : "Start voice input"
                  }
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>
              {isListening && (
                <p className="text-xs text-red-400 mt-1 animate-pulse flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Listening... Speak now
                </p>
              )}
            </div>

            {/* Location Input */}
            <LocationInput
              value={location}
              onChange={setLocation}
              locations={CAMPUS_LOCATIONS}
            />

            {/* Submit */}
            <button
              id="submit-crisis"
              onClick={handleSubmit}
              disabled={!description.trim()}
              className="w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-red-900/30 hover:shadow-red-900/50 cursor-pointer flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              Send Emergency Report
            </button>
          </div>
        )}

        {/* LOADING VIEW */}
        {view === "loading" && (
          <div
            className="flex-1 flex flex-col items-center justify-center gap-6"
            style={{ animation: "fade-in 0.3s ease-out" }}
          >
            <div className="relative">
              <div
                className="w-24 h-24 rounded-full"
                style={{
                  border: "4px solid rgba(220, 38, 38, 0.3)",
                  borderTopColor: "#dc2626",
                  animation: "spin-slow 1s linear infinite",
                }}
              />
              <Loader2
                className="absolute inset-0 m-auto w-8 h-8 text-red-400"
                style={{
                  animation: "spin-slow 1.5s linear infinite reverse",
                }}
              />
            </div>
            <div className="text-center">
              <h3
                className="text-lg font-bold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Analyzing Situation...
              </h3>
              <p
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                AI is assessing the threat level and coordinating response
              </p>
              <div
                className="flex items-center justify-center gap-1.5 mt-3 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{elapsedTime}s elapsed</span>
              </div>
            </div>

            {/* Processing steps */}
            <div className="w-full max-w-xs space-y-2 mt-2">
              {[
                { label: "Receiving report", done: elapsedTime >= 0 },
                { label: "AI analyzing threat", done: elapsedTime >= 1 },
                { label: "Classifying incident", done: elapsedTime >= 2 },
                { label: "Generating response plan", done: elapsedTime >= 3 },
                { label: "Dispatching units", done: elapsedTime >= 4 },
              ].map((step) => (
                <div
                  key={step.label}
                  className={`flex items-center gap-2 text-xs transition-all duration-500 ${
                    step.done ? "text-green-400" : ""
                  }`}
                  style={{ color: step.done ? "#22c55e" : "var(--text-muted)" }}
                >
                  {step.done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <div
                      className="w-3.5 h-3.5 rounded-full border shrink-0"
                      style={{ borderColor: "var(--card-border)" }}
                    />
                  )}
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULT VIEW */}
        {view === "result" && result && (
          <div
            className="w-full space-y-4"
            style={{ animation: "fade-in 0.4s ease-out" }}
          >
            <div className="text-center">
              <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-3" />
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Report Received & Analyzed
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Campus security has been alerted with AI analysis
              </p>
            </div>

            {/* ETA Countdown */}
            {etaSeconds > 0 && (
              <div
                className="glass-card p-4 text-center"
                style={{ animation: "scale-in 0.4s ease-out 0.2s both" }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Timer className="w-4 h-4 text-blue-400" />
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Estimated Response Time
                  </span>
                </div>
                <p className="text-3xl font-black font-mono text-blue-400">
                  {formatEta(etaSeconds)}
                </p>
                <p
                  className="text-[10px] mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Responders are on their way
                </p>
              </div>
            )}

            {/* Safety Instructions (most prominent) */}
            <div
              className="rounded-2xl p-5"
              style={{
                background:
                  "linear-gradient(135deg, rgba(220, 38, 38, 0.15), rgba(234, 88, 12, 0.08))",
                border: "2px solid rgba(220, 38, 38, 0.3)",
              }}
            >
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">
                ⚠️ Your Safety Instructions
              </p>
              <p
                className="text-base leading-relaxed font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {result.immediate_action_for_user}
              </p>
            </div>

            {/* Analysis Summary */}
            <div
              className="glass-card p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Threat Level
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    result.threat_level === "Critical"
                      ? "bg-red-600 text-white"
                      : result.threat_level === "High"
                      ? "bg-orange-600 text-white"
                      : result.threat_level === "Medium"
                      ? "bg-yellow-600 text-black"
                      : "bg-green-600 text-white"
                  }`}
                >
                  {result.threat_level}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Incident Type
                </span>
                <span
                  className="text-sm font-semibold flex items-center gap-1.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  {getIncidentIcon(result.incident_type)}
                  {result.incident_type}
                </span>
              </div>
              {result.estimated_severity_score && (
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Severity
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-24 h-2 rounded-full overflow-hidden"
                      style={{ background: "var(--surface)" }}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          result.estimated_severity_score >= 8
                            ? "bg-red-500"
                            : result.estimated_severity_score >= 5
                            ? "bg-orange-500"
                            : "bg-yellow-500"
                        }`}
                        style={{
                          width: `${result.estimated_severity_score * 10}%`,
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {result.estimated_severity_score}/10
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Location
                </span>
                <span
                  className="text-xs flex items-center gap-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <MapPin className="w-3 h-3" />
                  {location}
                </span>
              </div>
            </div>

            {/* Dispatched Units */}
            {result.recommended_units && result.recommended_units.length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(37, 99, 235, 0.08)",
                  border: "1px solid rgba(37, 99, 235, 0.2)",
                }}
              >
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2.5">
                  🚨 Units Being Dispatched
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.recommended_units.map((unit) => (
                    <span
                      key={unit}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{
                        background: "rgba(37, 99, 235, 0.12)",
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

            {/* Emergency Contacts */}
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--card-border)",
              }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2.5"
                style={{ color: "var(--text-muted)" }}
              >
                📞 Emergency Contacts
              </p>
              <div className="grid grid-cols-2 gap-2">
                {EMERGENCY_CONTACTS.map((c) => (
                  <a
                    key={c.name}
                    href={`tel:${c.number}`}
                    className="flex items-center gap-2 p-2 rounded-lg transition-all text-xs"
                    style={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    <c.icon className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <div>
                      <p
                        className="font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {c.name}
                      </p>
                      <p className="text-green-400 font-mono text-[10px]">
                        {c.number}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={shareReport}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--card-border)",
                  color: "var(--text-primary)",
                }}
              >
                {"share" in navigator ? (
                  <Share2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {"share" in navigator
                  ? "Share Report"
                  : "Copy Report"}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all cursor-pointer"
              >
                Report Another
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="text-center py-4"
        style={{ borderTop: "1px solid var(--card-border)" }}
      >
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          CrisisHub — Built for GDG &ldquo;Build with AI&rdquo; Hackathon •
          Powered by Gemini AI
        </p>
      </footer>
    </div>
  );
}
