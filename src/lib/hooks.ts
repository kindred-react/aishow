/**
 * hooks.ts — Shared React hooks and utilities
 */
import { useEffect, useRef, useState } from "react";

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

export function useHydratedLocalStorageState<T>(
  key: string,
  initialValue: T,
  options?: {
    validate?: (value: string) => T;
    delayMs?: number;
  },
) {
  const { validate, delayMs = 80 } = options ?? {};
  const [value, setValue] = useState<T>(initialValue);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(key);

    if (stored !== null) {
      const nextValue = validate ? validate(stored) : (stored as T);
      /* eslint-disable react-hooks/set-state-in-effect */
      setValue(nextValue);
      /* eslint-enable react-hooks/set-state-in-effect */
    }

    const timer = setTimeout(() => setIsMounted(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, initialValue, key, validate]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(key, String(value));
  }, [isMounted, key, value]);

  return [value, setValue, isMounted] as const;
}

/**
 * Generates a unique ID with an optional prefix.
 * Replaces inline genId functions scattered across components.
 */
export function genId(prefix = "item"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
