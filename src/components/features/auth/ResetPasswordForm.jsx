import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const { focusedField, handleFocus, handleBlur } = useInputFocus();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const validateForm = () => {
    const newErrors = {};

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    if (!validateForm()) {
      setError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    const token = searchParams.get("token");
    if (!token) {
      setError("Token de réinitialisation manquant");
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
    <>
      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        {/* Message d'information */}
        <div style={styles.infoBox}>
          <span>🔒</span>
          <span>Choisis un nouveau mot de passe sécurisé (minimum 6 caractères).</span>
        </div>

        {success && (
          <div style={styles.success}>
            <span style={{ fontSize: "20px" }}>✅</span>
            <span>
              Mot de passe réinitialisé avec succès ! Tu seras redirigé vers la page de connexion...
            </span>
          </div>
        )}

        {error && (
          <div style={styles.error}>
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Nouveau mot de passe */}
        <div style={styles.formGroup}>
          <label htmlFor="newPassword" style={styles.label}>
            <span style={styles.labelIcon}>🔒</span>
            <span>Nouveau mot de passe</span>
          </label>
          <div style={styles.inputWrapper}>
            <div style={{ ...styles.inputGlow, opacity: focusedField === 'newPassword' ? 1 : 0 }} />
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              placeholder="Minimum 6 caractères"
              value={form.newPassword}
              onChange={handleChange}
              onFocus={(e) => handleFocus('newPassword', e)}
              onBlur={(e) => handleBlur('newPassword', !!errors.newPassword, e)}
              style={{
                ...styles.input,
                ...(errors.newPassword ? styles.inputError : {}),
              }}
              disabled={success}
            />
          </div>
          {errors.newPassword && <span style={styles.errorText}>⚠️ {errors.newPassword}</span>}
        </div>

        {/* Confirmation mot de passe */}
        <div style={styles.formGroup}>
          <label htmlFor="confirmPassword" style={styles.label}>
            <span style={styles.labelIcon}>🔐</span>
            <span>Confirmer le mot de passe</span>
          </label>
          <div style={styles.inputWrapper}>
            <div style={{ ...styles.inputGlow, opacity: focusedField === 'confirmPassword' ? 1 : 0 }} />
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Répète le mot de passe"
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
          {errors.confirmPassword && <span style={styles.errorText}>⚠️ {errors.confirmPassword}</span>}
        </div>

        {/* Bouton */}
        <button 
          type="submit" 
          disabled={loading || success} 
          style={{
            ...styles.button(loading || success),
            animation: loading ? "none" : "gradientMove 3s ease infinite",
          }}
          onMouseEnter={(e) => {
            if (!loading && !success) {
              e.target.style.transform = "translateY(-4px) scale(1.02)";
              e.target.style.boxShadow = "0 12px 32px rgba(99, 102, 241, 0.5), 0 0 60px rgba(251, 191, 36, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && !success) {
              e.target.style.transform = "translateY(0) scale(1)";
              e.target.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.4), 0 0 40px rgba(251, 191, 36, 0.3)";
            }
          }}
        >
          {loading ? (
            <>
              <span style={{
                display: "inline-block",
                width: "20px",
                height: "20px",
                border: "3px solid rgba(255, 255, 255, 0.3)",
                borderTop: "3px solid white",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}></span>
              <span>Réinitialisation en cours...</span>
            </>
          ) : success ? (
            <>
              <span>✅</span>
              <span>Mot de passe réinitialisé !</span>
            </>
          ) : (
            <>
              <span>🔒</span>
              <span>Réinitialiser le mot de passe</span>
              <div style={styles.buttonShine} />
            </>
          )}
        </button>
      </form>
    </>
  );
}
