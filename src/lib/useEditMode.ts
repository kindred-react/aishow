"use client";
import { useState, useCallback } from "react";

const EDIT_PASSWORD = "1111";

export function useEditMode() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const requestEdit = useCallback(() => {
    if (isEditMode) {
      setIsEditMode(false);
      return;
    }
    setInput("");
    setError(false);
    setShowPrompt(true);
  }, [isEditMode]);

  const submitPassword = useCallback(() => {
    if (input === EDIT_PASSWORD) {
      setIsEditMode(true);
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
