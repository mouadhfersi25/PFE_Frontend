import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const LEGACY_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify"];

/**
 * Ajoute body.page-legacy sur Home et pages Auth pour appliquer l'ancien CSS.
 * Sur les autres routes (dashboards), pas de classe = CSS template Tailwind uniquement.
 */
export default function BodyClassSync() {
  const location = useLocation();

  useEffect(() => {
    const isLegacy = LEGACY_PATHS.includes(location.pathname);
    if (isLegacy) {
      document.body.classList.add("page-legacy");
    } else {
      document.body.classList.remove("page-legacy");
    }
    return () => document.body.classList.remove("page-legacy");
  }, [location.pathname]);

  return null;
}
