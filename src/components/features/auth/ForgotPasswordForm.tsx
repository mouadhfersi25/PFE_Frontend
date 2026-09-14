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
  const { handleFocus, handleBlur } = useInputFocus();

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
      setEmailError("L'e-mail est requis");
      return false;
    }
    if (!validateEmail(email)) {
      setEmailError("Format d'e-mail invalide");
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
    <form onSubmit={handleSubmit} style={styles.form} noValidate>
      <div style={styles.infoBox}>
        Entre ton adresse e-mail et nous t&apos;enverrons un lien pour réinitialiser ton mot de passe.
      </div>

      {success && (
        <div style={styles.success}>
          E-mail envoyé ! Vérifie ta boîte de réception (et les spams) pour le lien de réinitialisation.
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.formGroup}>
        <div style={styles.inputWrapper}>
          <input
            type="text"
            id="email"
            name="email"
            placeholder="exemple@email.com"
            aria-label="E-mail"
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
        {emailError && <span style={styles.errorText}>{emailError}</span>}
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
            <span>Envoi…</span>
          </>
        ) : success ? (
          <span>E-mail envoyé</span>
        ) : (
          <span>Envoyer le lien de réinitialisation</span>
        )}
      </button>
    </form>
  );
}
