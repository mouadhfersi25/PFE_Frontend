import { useState, useCallback } from "react";

export function useInputFocus() {
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleFocus = useCallback((fieldName: string, e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFocusedField(fieldName);
    const target = e.target;
    target.style.outline = "none";
    target.style.borderColor = "#38bdf8";
    target.style.boxShadow = "0 0 0 3px rgba(56, 189, 248, 0.2)";
    target.style.backgroundColor = "#ffffff";
  }, []);

  const handleBlur = useCallback((_fieldName: string, hasError: boolean, e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFocusedField(null);
    const target = e.target;
    setTimeout(() => {
      target.style.borderColor = hasError ? "#f87171" : "#dde3ee";
      target.style.boxShadow = hasError
        ? "0 0 0 3px rgba(248, 113, 113, 0.15)"
        : "0 1px 2px rgba(15, 23, 42, 0.04)";
      target.style.backgroundColor = hasError ? "#fef2f2" : "#ffffff";
    }, 0);
  }, []);

  return { focusedField, handleFocus, handleBlur };
}
