import { useState } from "react";
import { authService } from "../../../services/auth.service";
import { validateEmail } from "../../../utils/validators";
import { formStyles } from "../../../styles/formStyles";
import { useInputFocus } from "../../../hooks/useInputFocus";
import { getErrorMessage } from "../../../utils/errorHandler";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { focusedField, handleFocus, handleBlur } = useInputFocus();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) {
      setEmailError(null);
    }
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const validateEmailField = () => {
    if (!email.trim()) {
      setEmailError("L'email est requis");
      return false;
    }
    if (!validateEmail(email)) {
      setEmailError("Format d'email invalide");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateEmailField()) {
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setSuccess(true);
      setEmail("");
    } catch (err) {
      const errorMessage = getErrorMessage(err, "Erreur lors de l'envoi de l'email");
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
          <span>💡</span>
          <span>Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.</span>
        </div>

        {success && (
          <div style={styles.success}>
            <span style={{ fontSize: "20px" }}>✅</span>
            <span>
              Email envoyé avec succès ! Vérifiez votre boîte de réception (et les spams) pour le lien de réinitialisation.
            </span>
          </div>
        )}

        {error && (
          <div style={styles.error}>
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Email */}
        <div style={styles.formGroup}>
          <label htmlFor="email" style={styles.label}>
            <span style={styles.labelIcon}>📧</span>
            <span>Adresse email</span>
          </label>
          <div style={styles.inputWrapper}>
            <div style={{ ...styles.inputGlow, opacity: focusedField ? 1 : 0 }} />
            <input
              type="text"
              id="email"
              name="email"
              placeholder="exemple@email.com"
              value={email}
              onChange={handleChange}
              onFocus={(e) => handleFocus('email', e)}
              onBlur={(e) => {
                handleBlur('email', !!emailError, e);
                validateEmailField();
              }}
              style={{
                ...styles.input,
                ...(emailError ? styles.inputError : {}),
              }}
              disabled={success}
            />
          </div>
          {emailError && <span style={styles.errorText}>⚠️ {emailError}</span>}
        </div>

        {/* Bouton */}
        <button 
          type="submit" 
          disabled={loading || success} 
          style={{
            ...styles.button(loading || success),
            animation: loading ? "none" : "gradientMove 3s ease infinite",
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (!loading && !success) {
              e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(99, 102, 241, 0.5), 0 0 60px rgba(251, 191, 36, 0.4)";
            }
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (!loading && !success) {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.4), 0 0 40px rgba(251, 191, 36, 0.3)";
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
              <span>Envoi en cours...</span>
            </>
          ) : success ? (
            <>
              <span>✅</span>
              <span>Email envoyé !</span>
            </>
          ) : (
            <>
              <span>📨</span>
              <span>Envoyer le lien de réinitialisation</span>
              <div style={styles.buttonShine} />
            </>
          )}
        </button>
      </form>
    </>
  );
}
