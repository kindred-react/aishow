"use client";
import { useState, useCallback, useEffect } from "react";

const EDIT_PASSWORD = "1111";
const SESSION_KEY = "aishow_edit_mode";

export function useEditMode() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  // Restore edit mode from sessionStorage on mount
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setIsEditMode(true);
    }
  }, []);

  const requestEdit = useCallback(() => {
    if (isEditMode) {
      setIsEditMode(false);
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    setInput("");
    setError(false);
    setShowPrompt(true);
  }, [isEditMode]);

  const submitPassword = useCallback(() => {
    if (input === EDIT_PASSWORD) {
      setIsEditMode(true);
      sessionStorage.setItem(SESSION_KEY, "1");
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
  };
}
