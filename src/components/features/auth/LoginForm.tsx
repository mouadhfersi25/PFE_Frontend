import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { authService } from "../../../services/auth.service";
import { ROLES } from "../../../utils/constants";
import { formStyles } from "../../../styles/formStyles";
import { useInputFocus } from "../../../hooks/useInputFocus";
import { getErrorMessage } from "../../../utils/errorHandler";
import { validateEmail, validatePassword } from "../../../utils/validators";
import storage from "../../../utils/storage";
import SocialAuthRow from "./SocialAuthRow";

export default function LoginForm() {
  const location = useLocation();
  const registrationMessage = (location.state as { message?: string } | null)?.message ?? null;
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [keepLogin, setKeepLogin] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const errorPersistRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const { handleFocus, handleBlur } = useInputFocus();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (mountedRef.current && errorPersistRef.current && !errorMessage) {
      setErrorMessage(errorPersistRef.current);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (!errorPersistRef.current) return;
    const interval = setInterval(() => {
      if (mountedRef.current && errorPersistRef.current && errorMessage !== errorPersistRef.current) {
        setErrorMessage(errorPersistRef.current);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [errorMessage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.email.trim()) {
      errors.email = "L'e-mail est requis";
    } else if (!validateEmail(form.email)) {
      errors.email = "Format d'e-mail invalide";
    }
    if (!form.password) {
      errors.password = "Le mot de passe est requis";
    } else if (!validatePassword(form.password)) {
      errors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    errorPersistRef.current = null;
    setErrorMessage(null);

    if (!validateForm()) {
      const firstError =
        fieldErrors.email ||
        fieldErrors.password ||
        "Veuillez corriger les erreurs dans le formulaire";
      errorPersistRef.current = firstError;
      setErrorMessage(firstError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(
        {
          email: form.email.trim().toLowerCase(),
          password: form.password,
        },
        keepLogin
      );

      errorPersistRef.current = null;
      setErrorMessage(null);

      const roleFromResponse = (response?.role ?? "").toString().toUpperCase();
      const roleFromStorage = (storage.get("auth_role") || "").toUpperCase();
      const role = roleFromResponse || roleFromStorage;

      // Redirection immédiate — le dashboard gère l'onboarding via /me
      let target = "/login";
      if (role === ROLES.ADMIN) target = "/admin/dashboard";
      else if (role === ROLES.EDUCATEUR) target = "/educator/dashboard";
      else if (role === ROLES.PARENT) target = "/parent/dashboard";
      else if (role === ROLES.SPONSOR) target = "/sponsor/dashboard";
      else if (role === ROLES.JOUEUR) target = "/player/dashboard";
      window.location.replace(target);
      return;
    } catch (err) {
      const message = getErrorMessage(err, "E-mail ou mot de passe incorrect");
      errorPersistRef.current = message;
      setErrorMessage(message);
      requestAnimationFrame(() => {
        if (mountedRef.current && errorPersistRef.current) {
          setErrorMessage(errorPersistRef.current);
        }
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const styles = formStyles;

  return (
    <form onSubmit={handleSubmit} style={styles.form} noValidate>
      {registrationMessage && (
        <div style={styles.success}>{registrationMessage}</div>
      )}
      {(errorPersistRef.current || errorMessage) && (
        <div key={`error-${errorPersistRef.current || errorMessage}`} style={styles.error}>
          {errorPersistRef.current || errorMessage}
        </div>
      )}

      <div style={styles.formGroup}>
        <div style={styles.inputWrapper}>
          <input
            type="text"
            id="email"
            name="email"
            placeholder="Entrez votre adresse e-mail"
            aria-label="E-mail"
            value={form.email}
            onChange={handleChange}
            onFocus={(e) => handleFocus("email", e)}
            onBlur={(e) => {
              const hasError = !form.email.trim() || !validateEmail(form.email);
              handleBlur("email", hasError, e);
              setFieldErrors((prev) => ({
                ...prev,
                email: !form.email.trim()
                  ? "L'e-mail est requis"
                  : !validateEmail(form.email)
                    ? "Format d'e-mail invalide"
                    : null,
              }));
            }}
            style={{
              ...styles.input,
              ...(fieldErrors.email ? styles.inputError : {}),
            }}
          />
        </div>
        {fieldErrors.email && <span style={styles.errorText}>{fieldErrors.email}</span>}
      </div>

      <div style={styles.formGroup}>
        <div style={styles.inputWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            placeholder="Mot de passe"
            aria-label="Mot de passe"
            value={form.password}
            onChange={handleChange}
            onFocus={(e) => handleFocus("password", e)}
            onBlur={(e) => {
              const hasError = !form.password || !validatePassword(form.password);
              handleBlur("password", hasError, e);
              setFieldErrors((prev) => ({
                ...prev,
                password: !form.password
                  ? "Le mot de passe est requis"
                  : !validatePassword(form.password)
                    ? "Le mot de passe doit contenir au moins 6 caractères"
                    : null,
              }));
            }}
            style={{
              ...styles.input,
              paddingRight: "48px",
              ...(fieldErrors.password ? styles.inputError : {}),
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {fieldErrors.password && <span style={styles.errorText}>{fieldErrors.password}</span>}

        <div className="flex items-center justify-between mt-0.5">
          <label className="flex items-center gap-2 text-sm text-slate-600 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={keepLogin}
              onChange={(e) => setKeepLogin(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            Rester connecté
          </label>
          <a
            href="/forgot-password"
            style={styles.forgotPasswordLink}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.color = "#2563eb";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.color = "#64748b";
            }}
          >
            Mot de passe oublié ?
          </a>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={styles.button(loading)}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (!loading) {
            e.currentTarget.style.background = "#1d4ed8";
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (!loading) {
            e.currentTarget.style.background = "#2563eb";
            e.currentTarget.style.transform = "translateY(0)";
          }
        }}
      >
        {loading ? (
          <>
            <span
              style={{
                display: "inline-block",
                width: "18px",
                height: "18px",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderTop: "2px solid white",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <span>Connexion…</span>
          </>
        ) : (
          <span>Se connecter</span>
        )}
      </button>

      <SocialAuthRow />
    </form>
  );
}
