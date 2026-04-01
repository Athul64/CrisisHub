"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Navigation, Search, X, Loader2 } from "lucide-react";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  locations: string[];
}

export default function LocationInput({
  value,
  onChange,
  locations,
}: LocationInputProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter locations based on query
  const filtered = query.trim()
    ? locations.filter((loc) =>
        loc.toLowerCase().includes(query.toLowerCase())
      )
    : locations;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll(
        ".location-dropdown-item"
      );
      items[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const highlightMatch = (text: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="highlight">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const selectLocation = useCallback(
    (loc: string) => {
      setQuery(loc);
      onChange(loc);
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          selectLocation(filtered[activeIndex]);
        } else if (filtered.length > 0) {
          selectLocation(filtered[0]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    setActiveIndex(-1);
    // If the typed value matches an existing location exactly, set it
    const exact = locations.find(
      (l) => l.toLowerCase() === val.toLowerCase()
    );
    if (exact) {
      onChange(exact);
    } else {
      // Allow custom typed locations
      onChange(val);
    }
  };

  const clearInput = () => {
    setQuery("");
    onChange("");
    setIsOpen(true);
    inputRef.current?.focus();
  };

  // GPS geolocation – detect nearest campus area
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setGpsStatus("Geolocation not supported");
      setTimeout(() => setGpsStatus(null), 3000);
      return;
    }

    setIsLocating(true);
    setGpsStatus("Detecting location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Map GPS to nearest campus location (simplified demo mapping)
        // In production, this would use actual campus building coordinates
        const index = Math.floor(
          (Math.abs(latitude * 1000 + longitude * 1000) % locations.length)
        );
        const detectedLocation = locations[index];
        selectLocation(detectedLocation);
        setGpsStatus(`📍 Detected: ${detectedLocation}`);
        setIsLocating(false);
        setTimeout(() => setGpsStatus(null), 4000);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsStatus("Location access denied by user");
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsStatus("Location info unavailable");
            break;
          case error.TIMEOUT:
            setGpsStatus("Location request timed out");
            break;
          default:
            setGpsStatus("Unable to detect location");
        }
        setTimeout(() => setGpsStatus(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
        <MapPin className="w-4 h-4 inline mr-1.5 -mt-0.5" />
        Your Location
      </label>

      <div className="flex gap-2">
        {/* Searchable input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
          <input
            ref={inputRef}
            id="location-input"
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search or type your location..."
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            className="w-full rounded-xl px-4 py-3 pl-10 pr-10 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            style={{
              background: "var(--input-bg)",
              border: "2px solid var(--input-border)",
              color: "var(--text-primary)",
            }}
          />
          {query && (
            <button
              onClick={clearInput}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-red-500/20 transition-colors cursor-pointer"
              aria-label="Clear location"
            >
              <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </button>
          )}

          {/* Dropdown */}
          {isOpen && filtered.length > 0 && (
            <div
              ref={dropdownRef}
              className="location-dropdown"
              role="listbox"
            >
              {filtered.map((loc, i) => (
                <div
                  key={loc}
                  className={`location-dropdown-item ${
                    i === activeIndex ? "active" : ""
                  }`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onClick={() => selectLocation(loc)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "#dc2626" }} />
                  <span>{highlightMatch(loc)}</span>
                </div>
              ))}
            </div>
          )}

          {/* No results hint */}
          {isOpen && query.trim() && filtered.length === 0 && (
            <div className="location-dropdown">
              <div className="location-dropdown-item" style={{ color: "var(--text-muted)", cursor: "default" }}>
                <Search className="w-3.5 h-3.5 shrink-0" />
                <span>Using custom location: &quot;{query}&quot;</span>
              </div>
            </div>
          )}
        </div>

        {/* GPS Button */}
        <button
          onClick={detectLocation}
          disabled={isLocating}
          className={`shrink-0 p-3 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center ${
            isLocating ? "locating" : ""
          }`}
          style={{
            background: isLocating
              ? "rgba(34, 197, 94, 0.15)"
              : "var(--surface)",
            border: `2px solid ${
              isLocating ? "rgba(34, 197, 94, 0.5)" : "var(--input-border)"
            }`,
            color: isLocating ? "#22c55e" : "var(--text-secondary)",
          }}
          title="Detect my location via GPS"
          aria-label="Use GPS to detect location"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* GPS Status */}
      {gpsStatus && (
        <p
          className="text-xs mt-1.5 flex items-center gap-1"
          style={{
            color: gpsStatus.includes("Detected")
              ? "#22c55e"
              : gpsStatus.includes("Detecting")
              ? "var(--text-muted)"
              : "#ef4444",
            animation: "fade-in 0.3s ease-out",
          }}
        >
          {gpsStatus.includes("Detecting") && (
            <Loader2 className="w-3 h-3 animate-spin" />
          )}
          {gpsStatus}
        </p>
      )}
    </div>
  );
}
