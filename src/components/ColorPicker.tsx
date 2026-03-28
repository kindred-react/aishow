"use client";
import { useState, useRef, useEffect, useCallback } from "react";

// ── Preset swatches ────────────────────────────────────────────────────────
export interface ColorPreset {
  color: string;
  accent?: string; // optional bg accent (e.g. rgba overlay)
  label?: string;
}

export const THEME_PRESETS: ColorPreset[] = [
  { color: "var(--c-neon)",    accent: "rgba(99,243,255,0.12)",   label: "Neon" },
  { color: "var(--c-cyan)",    accent: "rgba(102,201,255,0.12)",  label: "Cyan" },
  { color: "var(--c-lime)",    accent: "rgba(176,255,112,0.12)",  label: "Lime" },
  { color: "var(--c-violet)",  accent: "rgba(158,141,255,0.12)",  label: "Violet" },
  { color: "var(--c-orange)",  accent: "rgba(255,180,84,0.12)",   label: "Orange" },
  { color: "var(--c-pink)",    accent: "rgba(255,128,191,0.12)",  label: "Pink" },
  { color: "#60d890",          accent: "rgba(96,216,144,0.12)",   label: "Mint" },
  { color: "#a080f0",          accent: "rgba(160,128,240,0.12)",  label: "Lavender" },
  { color: "#f06060",          accent: "rgba(240,96,96,0.12)",    label: "Red" },
  { color: "#f0c040",          accent: "rgba(240,192,64,0.12)",   label: "Gold" },
  { color: "#40c0d0",          accent: "rgba(64,192,208,0.12)",   label: "Teal" },
  { color: "#e080a0",          accent: "rgba(224,128,160,0.12)",  label: "Rose" },
];

// resolve CSS variable to hex for use in <input type="color">
function resolveColor(color: string): string {
  if (color.startsWith("var(")) {
    if (typeof window === "undefined") return "#63f3ff";
    const varName = color.slice(4, -1).trim();
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || "#63f3ff";
  }
  return color;
}

// derive accent from hex color
function accentFromHex(hex: string): string {
  return hex + "1f"; // ~12% opacity
}

interface ColorPickerProps {
  value: string;                    // current color (CSS var or hex)
  onChange: (color: string, accent?: string) => void;
  presets?: ColorPreset[];          // override default presets
  withAccent?: boolean;             // if true, onChange also receives accent
  label?: string;                   // optional label
}

export function ColorPicker({
  value,
  onChange,
  presets = THEME_PRESETS,
  withAccent = false,
  label,
}: ColorPickerProps) {
  const [showWheel, setShowWheel] = useState(false);
  const [inputHex, setInputHex] = useState(() => resolveColor(value));
  const pickerRef = useRef<HTMLDivElement>(null);
  const nativeRef = useRef<HTMLInputElement>(null);

  // Sync inputHex when value changes externally
  useEffect(() => {
    setInputHex(resolveColor(value));
  }, [value]);

  // Close popup on outside click
  useEffect(() => {
    if (!showWheel) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowWheel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showWheel]);

  const handlePreset = useCallback((preset: ColorPreset) => {
    onChange(preset.color, withAccent ? (preset.accent ?? accentFromHex(resolveColor(preset.color))) : undefined);
    setInputHex(resolveColor(preset.color));
    setShowWheel(false);
  }, [onChange, withAccent]);

  const handleNativeChange = useCallback((hex: string) => {
    setInputHex(hex);
    onChange(hex, withAccent ? accentFromHex(hex) : undefined);
  }, [onChange, withAccent]);

  const resolvedValue = resolveColor(value);

  return (
    <div className="cp-root" ref={pickerRef}>
      {label && <label className="note-label">{label}</label>}

      <div className="cp-bar">
        {/* Preset swatches row */}
        <div className="cp-presets">
          {presets.map((p) => {
            const resolved = resolveColor(p.color);
            const isActive = resolvedValue === resolved || value === p.color;
            return (
              <button
                key={p.color}
                type="button"
                className={`cp-swatch ${isActive ? "active" : ""}`}
                style={{ background: p.color }}
                title={p.label ?? p.color}
                onClick={() => handlePreset(p)}
              />
            );
          })}
        </div>

        {/* Custom color button */}
        <button
          type="button"
          className={`cp-custom-btn ${showWheel ? "open" : ""}`}
          style={{ background: value }}
          title="Custom color"
          onClick={() => { setShowWheel(v => !v); setTimeout(() => nativeRef.current?.click(), 50); }}
        >
          <span className="cp-custom-icon">✦</span>
        </button>
      </div>

      {/* Native color input (hidden, triggered by button) */}
      <input
        ref={nativeRef}
        type="color"
        className="cp-native-input"
        value={inputHex}
        onChange={e => handleNativeChange(e.target.value)}
      />
    </div>
  );
}
