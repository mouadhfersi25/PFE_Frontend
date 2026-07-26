import { useState, useCallback } from "react";

/**
 * Hook pour gérer le focus des inputs avec styles dynamiques
 */
export function useInputFocus() {
  const [focusedField, setFocusedField] = useState(null);

  const handleFocus = useCallback((fieldName, e) => {
    setFocusedField(fieldName);
    const target = e.target;
    target.style.outline = "none";
    target.style.borderColor = "#fbbf24";
    target.style.boxShadow = `
      0 0 0 4px rgba(251, 191, 36, 0.2),
      0 0 30px rgba(251, 191, 36, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.5)
    `;
    target.style.transform = "translateY(-2px) scale(1.01)";
    target.style.backgroundColor = "#ffffff";
  }, []);

  const handleBlur = useCallback((fieldName, hasError, e) => {
    setFocusedField(null);
    const target = e.target;
    setTimeout(() => {
      target.style.borderColor = hasError ? "#ef4444" : "rgba(255, 255, 255, 0.2)";
      target.style.boxShadow = hasError 
        ? "0 0 0 4px rgba(239, 68, 68, 0.2), 0 0 20px rgba(239, 68, 68, 0.3)"
        : "0 4px 6px rgba(0, 0, 0, 0.1)";
      target.style.transform = "translateY(0) scale(1)";
      target.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
    }, 0);
  }, []);

  return { focusedField, handleFocus, handleBlur };
}
