import { useState, useEffect } from "react";
import LoginForm from "../../../components/features/auth/LoginForm";
import "../../../assets/styles/index.css";

const Login = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const styles = {
    pageContainer: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
      backgroundSize: "400% 400%",
      animation: "gradientShift 15s ease infinite",
    },
    animatedBackground: {
      position: "absolute",
      width: "100%",
      height: "100%",
      top: 0,
      left: 0,
      zIndex: 0,
      pointerEvents: "none",
    },
    mouseFollower: {
      position: "absolute",
      width: "600px",
      height: "600px",
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)",
      left: `${mousePosition.x - 300}px`,
      top: `${mousePosition.y - 300}px`,
      transition: "all 0.3s ease-out",
      pointerEvents: "none",
      zIndex: 1,
    },
    floatingShapes: {
      position: "absolute",
      width: "100%",
      height: "100%",
      top: 0,
      left: 0,
      zIndex: 1,
      pointerEvents: "none",
    },
    container: {
      maxWidth: "600px",
      width: "100%",
      position: "relative",
      zIndex: 2,
    },
    card: {
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: "32px",
      padding: "48px",
      boxShadow: `
        0 8px 32px rgba(0, 0, 0, 0.15),
        0 0 0 1px rgba(255, 255, 255, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.5)
      `,
      border: "1px solid rgba(255, 255, 255, 0.5)",
      position: "relative",
      overflow: "hidden",
    },
    cardGlow: {
      position: "absolute",
      top: "-50%",
      left: "-50%",
      width: "200%",
      height: "200%",
      background: "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)",
      animation: "rotate 20s linear infinite",
      pointerEvents: "none",
    },
    header: {
      textAlign: "center",
      marginBottom: "40px",
      position: "relative",
      zIndex: 1,
    },
    logoContainer: {
      display: "flex",
      justifyContent: "center",
      gap: "12px",
      marginBottom: "20px",
      fontSize: "64px",
      animation: "bounce 2s ease-in-out infinite",
    },
    logo: {
      display: "inline-block",
      animation: "float 3s ease-in-out infinite",
    },
    logoDelay: {
      display: "inline-block",
      animation: "float 3s ease-in-out infinite 0.5s",
    },
    title: {
      fontSize: "42px",
      fontWeight: "800",
      background: "linear-gradient(135deg, #6366f1 0%, #ec4899 30%, #f59e0b 60%, #06b6d4 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      marginBottom: "16px",
      lineHeight: "1.2",
      textShadow: "0 0 30px rgba(99, 102, 241, 0.3)",
      animation: "shimmer 3s ease-in-out infinite",
    },
    subtitle: {
      fontSize: "18px",
      color: "#4b5563",
      lineHeight: "1.6",
      fontWeight: "500",
    },
    highlight: {
      color: "#6366f1",
      fontWeight: "700",
    },
    link: {
      textAlign: "center",
      marginTop: "32px",
      fontSize: "15px",
      color: "#4b5563",
      fontWeight: "500",
    },
    linkText: {
      color: "#6366f1",
      textDecoration: "none",
      fontWeight: "700",
      transition: "all 0.3s ease",
      display: "inline-block",
      position: "relative",
    },
  };

  // Générer des formes flottantes
  const shapes = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 100 + 50,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
    color: ["#6366f1", "#ec4899", "#f59e0b", "#06b6d4"][Math.floor(Math.random() * 4)],
  }));

  return (
    <>
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes shimmer {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes floatShape {
            0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
            33% { transform: translateY(-30px) translateX(20px) rotate(120deg); }
            66% { transform: translateY(20px) translateX(-20px) rotate(240deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.1); }
          }
        `}
      </style>

      <div style={styles.pageContainer}>
        {/* Suiveur de souris avec effet glow */}
        <div style={styles.mouseFollower} />

        {/* Formes flottantes animées */}
        <div style={styles.floatingShapes}>
          {shapes.map((shape) => (
            <div
              key={shape.id}
              style={{
                position: "absolute",
                left: `${shape.left}%`,
                top: `${shape.top}%`,
                width: `${shape.size}px`,
                height: `${shape.size}px`,
                background: `radial-gradient(circle, ${shape.color}40 0%, transparent 70%)`,
                borderRadius: "50%",
                animation: `floatShape ${shape.duration}s ease-in-out infinite ${shape.delay}s`,
                filter: "blur(20px)",
              }}
            />
          ))}
        </div>

        {/* Particules animées */}
        <div style={styles.animatedBackground}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 6 + 2}px`,
                height: `${Math.random() * 6 + 2}px`,
                background: ["#6366f1", "#ec4899", "#f59e0b", "#06b6d4", "#ffffff"][
                  Math.floor(Math.random() * 5)
                ],
                borderRadius: "50%",
                animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                boxShadow: `0 0 ${Math.random() * 10 + 5}px currentColor`,
              }}
            />
          ))}
        </div>

        <div style={styles.container}>
          <div style={styles.card}>
            {/* Effet de glow rotatif */}
            <div style={styles.cardGlow} />

            <div style={styles.header}>
              <div style={styles.logoContainer}>
                <span style={styles.logo}>🎮</span>
                <span style={styles.logoDelay}>✨</span>
                <span style={styles.logo}>🚀</span>
              </div>
              <h1 style={styles.title}>Bienvenue !</h1>
              <p style={styles.subtitle}>
                Connecte-toi pour accéder à ton <span style={styles.highlight}>espace de jeu</span> et continuer ton aventure éducative ! 🎯
              </p>
            </div>

            <LoginForm />

            <div style={styles.link}>
              Pas encore de compte ?{" "}
              <a
                href="/register"
                style={styles.linkText}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.05)";
                  e.target.style.color = "#4f46e5";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.color = "#6366f1";
                }}
              >
                Inscris-toi ici 🎯
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
