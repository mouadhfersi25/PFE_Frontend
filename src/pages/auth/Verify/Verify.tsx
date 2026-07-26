import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../../../services/auth.service";

const Verify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const hasRunRef = useRef(false);

  useEffect(() => {
    // En dev (React.StrictMode), useEffect peut être exécuté 2 fois.
    // On bloque le 2e appel pour éviter une double vérification.
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Token de vérification manquant");
        return;
      }

      try {
        // Décoder et nettoyer le token
        const decodedToken = decodeURIComponent(token).trim();
        
        if (!decodedToken) {
          setStatus("error");
          setMessage("Token de vérification manquant");
          return;
        }
        
        const response = await authService.verify(decodedToken);
        setStatus("success");
        setMessage(response.message || "Compte activé avec succès !");
        
        // Rediriger vers login après 3 secondes
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error) {
        setStatus("error");
        let errorMessage = "Erreur lors de la vérification";
        
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;
          
          // Le backend retourne { "error": "message" } pour les erreurs
          if (status === 400) {
            errorMessage = data.error || data.message || "Token invalide ou expiré";
          } else if (status === 404) {
            errorMessage = data.error || data.message || "Token de vérification introuvable";
          } else {
            errorMessage = data.error || data.message || `Erreur ${status}`;
          }
          
          console.error("Erreur de vérification:", error.response.data); // Debug
        } else if (error.request) {
          errorMessage = "Impossible de contacter le serveur. Vérifiez votre connexion.";
        } else {
          errorMessage = error.message || errorMessage;
        }
        
        setMessage(errorMessage);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
      backgroundSize: "400% 400%",
      animation: "gradientShift 15s ease infinite",
    },
    card: {
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      borderRadius: "32px",
      padding: "48px",
      maxWidth: "500px",
      width: "100%",
      textAlign: "center",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
      border: "1px solid rgba(255, 255, 255, 0.5)",
    },
    icon: {
      fontSize: "64px",
      marginBottom: "24px",
      display: "block",
    },
    title: {
      fontSize: "32px",
      fontWeight: "800",
      marginBottom: "16px",
      color: "#1a1a2e",
    },
    message: {
      fontSize: "18px",
      color: "#4b5563",
      marginBottom: "32px",
      lineHeight: "1.6",
    },
    successTitle: {
      color: "#10b981",
    },
    errorTitle: {
      color: "#ef4444",
    },
    button: {
      padding: "14px 28px",
      borderRadius: "12px",
      border: "none",
      background: "linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)",
      color: "white",
      fontSize: "16px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    loader: {
      display: "inline-block",
      width: "40px",
      height: "40px",
      border: "4px solid rgba(99, 102, 241, 0.2)",
      borderTop: "4px solid #6366f1",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
  };

  return (
    <>
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={styles.container}>
        <div style={styles.card}>
          {status === "loading" && (
            <>
              <div style={styles.loader}></div>
              <h1 style={styles.title}>Vérification en cours...</h1>
              <p style={styles.message}>Veuillez patienter pendant que nous activons votre compte.</p>
            </>
          )}

          {status === "success" && (
            <>
              <span style={styles.icon}>✅</span>
              <h1 style={{ ...styles.title, ...styles.successTitle }}>Compte activé !</h1>
              <p style={styles.message}>
                {message || "Votre compte a été activé avec succès. Vous allez être redirigé vers la page de connexion..."}
              </p>
              <button
                style={styles.button}
                onClick={() => navigate("/login")}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 15px rgba(99, 102, 241, 0.4)";
                }}
              >
                Aller à la connexion 🚀
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <span style={styles.icon}>❌</span>
              <h1 style={{ ...styles.title, ...styles.errorTitle }}>Erreur de vérification</h1>
              <p style={styles.message}>
                {message || "Le lien de vérification est invalide ou a expiré."}
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  style={styles.button}
                  onClick={() => navigate("/register")}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(99, 102, 241, 0.4)";
                  }}
                >
                  S'inscrire à nouveau
                </button>
                <button
                  style={{
                    ...styles.button,
                    background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                  }}
                  onClick={() => navigate("/login")}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(107, 114, 128, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(107, 114, 128, 0.4)";
                  }}
                >
                  Aller à la connexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Verify;
