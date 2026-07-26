import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const LEGACY_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify"];

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
