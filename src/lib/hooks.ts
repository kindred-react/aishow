/**
 * hooks.ts — Shared React hooks and utilities
 */
import { useEffect, useRef } from "react";

/**
 * Focuses the returned ref after mount, using requestAnimationFrame
 * to wait for the DOM to be painted before focusing.
 * Replaces the `setTimeout(() => ref.focus(), 60)` pattern.
 */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => ref.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);
  return ref;
}

/**
 * Generates a unique ID with an optional prefix.
 * Replaces inline genId functions scattered across components.
 */
export function genId(prefix = "item"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
