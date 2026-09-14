import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { authService } from "../../../services/auth.service";
import { validatePassword } from "../../../utils/validators";
import { formStyles } from "../../../styles/formStyles";
import { useInputFocus } from "../../../hooks/useInputFocus";
import { getErrorMessage } from "../../../utils/errorHandler";

export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const { handleFocus, handleBlur } = useInputFocus();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.newPassword) {
      newErrors.newPassword = "Le nouveau mot de passe est requis";
    } else if (!validatePassword(form.newPassword)) {
      newErrors.newPassword = "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "La confirmation du mot de passe est requise";
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    if (!validateForm()) {
      setError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    const token = searchParams.get("token");
    if (!token) {
      setError("Jeton de réinitialisation manquant");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword({
        token: token.trim(),
        newPassword: form.newPassword,
      });

      setSuccess(true);

      // Rediriger vers login après 3 secondes
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      const errorMessage = getErrorMessage(err, "Erreur lors de la réinitialisation");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = formStyles;

  return (
    <form onSubmit={handleSubmit} style={styles.form} noValidate>
      <div style={styles.infoBox}>
        Choisis un nouveau mot de passe sécurisé (minimum 6 caractères).
      </div>

      {success && (
        <div style={styles.success}>
          Mot de passe réinitialisé ! Tu vas être redirigé vers la page de connexion…
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.formGroup}>
        <div style={styles.inputWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            id="newPassword"
            name="newPassword"
            placeholder="Minimum 6 caractères"
            aria-label="Nouveau mot de passe"
            value={form.newPassword}
            onChange={handleChange}
            onFocus={(e) => handleFocus('newPassword', e)}
            onBlur={(e) => handleBlur('newPassword', !!errors.newPassword, e)}
            style={{
              ...styles.input,
              paddingRight: "48px",
              ...(errors.newPassword ? styles.inputError : {}),
            }}
            disabled={success}
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
        {errors.newPassword && <span style={styles.errorText}>{errors.newPassword}</span>}
      </div>

      <div style={styles.formGroup}>
        <div style={styles.inputWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Répète le mot de passe"
            aria-label="Confirmer le mot de passe"
            value={form.confirmPassword}
            onChange={handleChange}
            onFocus={(e) => handleFocus('confirmPassword', e)}
            onBlur={(e) => handleBlur('confirmPassword', !!errors.confirmPassword, e)}
            style={{
              ...styles.input,
              ...(errors.confirmPassword ? styles.inputError : {}),
            }}
            disabled={success}
          />
        </div>
        {errors.confirmPassword && <span style={styles.errorText}>{errors.confirmPassword}</span>}
      </div>

      <button
        type="submit"
        disabled={loading || success}
        style={styles.button(loading || success)}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (!loading && !success) {
            e.currentTarget.style.background = "#1d4ed8";
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (!loading && !success) {
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
            <span>Réinitialisation…</span>
          </>
        ) : success ? (
          <span>Mot de passe réinitialisé</span>
        ) : (
          <span>Réinitialiser le mot de passe</span>
        )}
      </button>
    </form>
  );
}
