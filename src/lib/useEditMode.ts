"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { EDIT_PASSWORD, SESSION_EDIT_KEY } from "@/data/constants";

export function useEditMode() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  // External callback called before exiting edit mode; return false to cancel exit
  const onBeforeExitRef = useRef<(() => Promise<boolean>) | null>(null);
  const registerOnBeforeExit = useCallback((fn: () => Promise<boolean>) => {
    onBeforeExitRef.current = fn;
  }, []);

  // Restore edit mode from sessionStorage on mount
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (sessionStorage.getItem(SESSION_EDIT_KEY) === "1") setIsEditMode(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const requestEdit = useCallback(async () => {
    if (isEditMode) {
      // Ask external handler if we can exit (e.g. save/discard prompt)
      if (onBeforeExitRef.current) {
        const canExit = await onBeforeExitRef.current();
        if (!canExit) return;
      }
      setIsEditMode(false);
      sessionStorage.removeItem(SESSION_EDIT_KEY);
      return;
    }
    setInput("");
    setError(false);
    setShowPrompt(true);
  }, [isEditMode]);

  const submitPassword = useCallback(() => {
    if (input === EDIT_PASSWORD) {
      setIsEditMode(true);
      sessionStorage.setItem(SESSION_EDIT_KEY, "1");
      setShowPrompt(false);
      setError(false);
    } else {
      setError(true);
      setInput("");
    }
  }, [input]);

  const cancelPrompt = useCallback(() => {
    setShowPrompt(false);
    setError(false);
    setInput("");
  }, []);

  return {
    isEditMode,
    showPrompt,
    input,
    setInput,
    error,
    requestEdit,
    submitPassword,
    cancelPrompt,
    registerOnBeforeExit,
  };
}
