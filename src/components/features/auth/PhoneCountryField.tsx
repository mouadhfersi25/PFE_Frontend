import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { COUNTRY_PHONE_INFO, getDialCode, getFlagEmoji, getPhoneLength } from "../../../utils/countryDialCodes";

const COUNTRY_NAMES = Object.keys(COUNTRY_PHONE_INFO).sort((a, b) => a.localeCompare(b));

type Props = {
  /** Numéro local (chiffres uniquement, sans l'indicatif). */
  value: string;
  onValueChange: (value: string) => void;
  /** Pays sélectionné (nom, ex. "Tunisia"). */
  countryName: string;
  onCountryChange: (countryName: string) => void;
  error?: string | null;
  placeholder?: string;
};

/**
 * Champ téléphone avec un petit sélecteur "drapeau" intégré : cliquer sur le
 * drapeau ouvre une liste déroulante de pays (drapeau + indicatif) ; le choix
 * préfixe automatiquement le numéro avec l'indicatif correspondant
 * (ex. Tunisie -> +216) et pilote la suite du processus (pays par défaut pour
 * l'onboarding du joueur).
 */
export default function PhoneCountryField({
  value,
  onValueChange,
  countryName,
  onCountryChange,
  error,
  placeholder = "Téléphone (8 chiffres)",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const dialCode = getDialCode(countryName);
  const flag = getFlagEmoji(countryName);
  const phoneLength = getPhoneLength(countryName);

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRY_NAMES;
    return COUNTRY_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [search]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          borderRadius: "16px",
          border: `1.5px solid ${error ? "#f87171" : "#dde3ee"}`,
          backgroundColor: error ? "#fef2f2" : "#ffffff",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Choisir un pays"
          aria-expanded={open}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "0 10px",
            border: "none",
            borderRight: "1.5px solid #e5e9f2",
            background: "transparent",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "18px", lineHeight: 1 }}>{flag}</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>
            {dialCode || "+"}
          </span>
          <ChevronDown size={14} color="#94a3b8" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          maxLength={phoneLength}
          placeholder={placeholder}
          aria-label="Téléphone"
          value={value}
          onChange={(e) => onValueChange(e.target.value.replace(/[^0-9]/g, ""))}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "15px 18px",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: "15px",
            fontFamily: "inherit",
            color: "#0f172a",
          }}
        />
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 30,
            top: "calc(100% + 6px)",
            left: 0,
            width: "280px",
            maxHeight: "260px",
            overflowY: "auto",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12)",
          }}
        >
          <div style={{ position: "sticky", top: 0, background: "#ffffff", padding: "8px", borderBottom: "1px solid #f1f5f9" }}>
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un pays..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "8px 10px",
                fontSize: "13px",
                borderRadius: "10px",
                border: "1px solid #dde3ee",
                outline: "none",
              }}
            />
          </div>
          {filteredCountries.length === 0 ? (
            <p style={{ padding: "12px", fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>
              Aucun pays trouvé
            </p>
          ) : (
            filteredCountries.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onCountryChange(name);
                  setOpen(false);
                  setSearch("");
                }}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  border: "none",
                  background: name === countryName ? "#eff6ff" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (name !== countryName) e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  if (name !== countryName) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: "16px", lineHeight: 1 }}>{getFlagEmoji(name)}</span>
                <span style={{ flex: 1, fontSize: "13px", color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {name}
                </span>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{getDialCode(name)}</span>
              </button>
            ))
          )}
        </div>
      )}

      {error && (
        <span style={{ color: "#b91c1c", fontSize: "12px", fontWeight: 500, display: "block", marginTop: "6px" }}>
          {error}
        </span>
      )}
    </div>
  );
}
