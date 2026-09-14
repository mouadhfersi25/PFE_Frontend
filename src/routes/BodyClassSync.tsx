import { useLocation } from "react-router-dom";
import { useEffect } from "react";

// "/login", "/register", "/forgot-password" et "/reset-password" ne sont plus
// ici : ces quatre pages sont passées à AuthLayout (balisage Tailwind pur),
// et le reset ci-dessous (body.page-legacy a, h1, ...) écrasait ses classes
// utilitaires (padding, couleur, dégradé du titre) via une spécificité CSS
// plus élevée.
const LEGACY_PATHS = ["/", "/home", "/verify"];

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
