import { useState, useRef, useEffect } from "react";
import { authService } from "../../../services/auth.service";
import { ROLES } from "../../../utils/constants";
import { formStyles } from "../../../styles/formStyles";
import { useInputFocus } from "../../../hooks/useInputFocus";
import { getErrorMessage } from "../../../utils/errorHandler";

export default function LoginForm() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const errorPersistRef = useRef(null);
  const mountedRef = useRef(true);
  const { focusedField, handleFocus, handleBlur } = useInputFocus();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Restaurer l'erreur si elle disparaît (protection contre StrictMode)
  useEffect(() => {
    if (mountedRef.current && errorPersistRef.current && !errorMessage) {
      setErrorMessage(errorPersistRef.current);
    }
  }, [errorMessage]);

  // Vérification périodique pour maintenir l'erreur affichée
  useEffect(() => {
    if (!errorPersistRef.current) return;
    
    const interval = setInterval(() => {
      if (mountedRef.current && errorPersistRef.current && errorMessage !== errorPersistRef.current) {
        setErrorMessage(errorPersistRef.current);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [errorMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loginData = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      const response = await authService.login(loginData);
      
      // Succès : effacer l'erreur
      errorPersistRef.current = null;
      setErrorMessage(null);
      
      // Rôle : réponse login ou storage (auth.service a déjà enregistré auth_role)
      const roleFromResponse = (response?.role ?? "").toString().toUpperCase();
      const roleFromStorage = (typeof localStorage !== "undefined" ? (localStorage.getItem("auth_role") || "") : "").toUpperCase();
      const role = roleFromResponse || roleFromStorage;
      
      // Redirection par rôle vers les dashboards template EduGame ou dashboard existant
      if (role === ROLES.ADMIN) {
        window.location.href = "/admin/dashboard";
      } else if (role === ROLES.JOUEUR) {
        window.location.href = "/player/dashboard";
      } else if (role === ROLES.EDUCATEUR) {
        window.location.href = "/educator/dashboard";
      } else if (role === ROLES.PARENT) {
        window.location.href = "/parent/dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      const message = getErrorMessage(err, "Email ou mot de passe incorrect");
      
      // Stocker dans la ref ET le state
      errorPersistRef.current = message;
      setErrorMessage(message);
      
      // Forcer la mise à jour après le render
      requestAnimationFrame(() => {
        if (mountedRef.current && errorPersistRef.current) {
          setErrorMessage(errorPersistRef.current);
        }
      });
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const styles = formStyles;

  return (
    <>
      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        {/* Affichage de l'erreur */}
        {(errorPersistRef.current || errorMessage) && (
          <div 
            key={`error-${errorPersistRef.current || errorMessage}`}
            style={styles.error}
          >
            <span style={{ fontSize: "20px", flexShrink: 0 }}>⚠️</span>
            <span style={{ flex: 1 }}>{errorPersistRef.current || errorMessage}</span>
          </div>
        )}

        {/* Email */}
        <div style={styles.formGroup}>
          <label htmlFor="email" style={styles.label}>
            <span style={styles.labelIcon}>📧</span>
            <span>Email</span>
          </label>
          <div style={styles.inputWrapper}>
            <div style={{ ...styles.inputGlow, opacity: focusedField === 'email' ? 1 : 0 }} />
            <input
              type="text"
              id="email"
              name="email"
              placeholder="exemple@email.com"
              value={form.email}
              onChange={handleChange}
              onFocus={(e) => handleFocus('email', e)}
              onBlur={(e) => handleBlur('email', false, e)}
              style={styles.input}
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div style={styles.formGroup}>
          <label htmlFor="password" style={styles.label}>
            <span style={styles.labelIcon}>🔒</span>
            <span>Mot de passe</span>
          </label>
          <div style={styles.inputWrapper}>
            <div style={{ ...styles.inputGlow, opacity: focusedField === 'password' ? 1 : 0 }} />
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Ton mot de passe"
              value={form.password}
              onChange={handleChange}
              onFocus={(e) => handleFocus('password', e)}
              onBlur={(e) => handleBlur('password', false, e)}
              style={styles.input}
            />
          </div>
          
          {/* Lien mot de passe oublié */}
          <div style={styles.forgotPassword}>
            <a
              href="/forgot-password"
              style={styles.forgotPasswordLink}
              onMouseEnter={(e) => {
                e.target.style.color = "#4f46e5";
                e.target.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "#6366f1";
                e.target.style.textDecoration = "none";
              }}
            >
              Mot de passe oublié ? 🔑
            </a>
          </div>
        </div>

        {/* Bouton */}
        <button 
          type="submit" 
          disabled={loading} 
          style={{
            ...styles.button(loading),
            animation: loading ? "none" : "gradientMove 3s ease infinite",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = "translateY(-4px) scale(1.02)";
              e.target.style.boxShadow = "0 12px 32px rgba(99, 102, 241, 0.5), 0 0 60px rgba(251, 191, 36, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
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
              <span>Connexion en cours...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Se connecter</span>
              <div style={styles.buttonShine} />
            </>
          )}
        </button>
      </form>
    </>
  );
}
