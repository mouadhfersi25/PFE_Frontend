import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Home() {
  const navigate = useNavigate();
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
      flexDirection: "column",
      alignItems: "center",
      padding: "0 24px 60px",
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(160deg, #0d0d1a 0%, #1a1a2e 35%, #16213e 70%, #0f3460 100%)",
      backgroundSize: "400% 400%",
      animation: "gradientShift 18s ease infinite",
    },
    particles: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      overflow: "hidden",
      zIndex: 1,
      pointerEvents: "none",
    },
    particle: {
      position: "absolute",
      width: "4px",
      height: "4px",
      background: "rgba(129, 140, 248, 0.5)",
      borderRadius: "50%",
      animation: "floatParticle 12s infinite ease-in-out",
      boxShadow: "0 0 8px rgba(129, 140, 248, 0.6)",
    },
    mouseFollower: {
      position: "fixed",
      width: "400px",
      height: "400px",
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(129, 140, 248, 0.08) 0%, transparent 70%)",
      left: `${mousePosition.x - 200}px`,
      top: `${mousePosition.y - 200}px`,
      transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
      pointerEvents: "none",
      zIndex: 2,
    },
    nav: {
      position: "relative",
      zIndex: 10,
      width: "100%",
      maxWidth: "1100px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 0 16px",
      marginBottom: "20px",
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "clamp(18px, 2.2vw, 22px)",
      fontWeight: "800",
      color: "rgba(255, 255, 255, 0.95)",
      letterSpacing: "-0.5px",
    },
    logoIcon: {
      fontSize: "28px",
      filter: "drop-shadow(0 0 12px rgba(129, 140, 248, 0.5))",
    },
    navCta: {
      padding: "10px 22px",
      borderRadius: "12px",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      background: "rgba(255, 255, 255, 0.06)",
      backdropFilter: "blur(12px)",
      color: "rgba(255, 255, 255, 0.9)",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.25s ease",
    },
    content: {
      position: "relative",
      zIndex: 10,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "48px",
      maxWidth: "1100px",
      width: "100%",
      flex: 1,
    },
    heroSection: {
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "28px",
      padding: "20px 0 40px",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 18px",
      borderRadius: "999px",
      background: "rgba(129, 140, 248, 0.2)",
      border: "1px solid rgba(129, 140, 248, 0.35)",
      color: "rgba(199, 210, 254, 0.95)",
      fontSize: "clamp(12px, 1.2vw, 14px)",
      fontWeight: "600",
      letterSpacing: "0.5px",
    },
    title: {
      fontSize: "clamp(40px, 6.5vw, 72px)",
      fontWeight: "800",
      background: "linear-gradient(135deg, #a5b4fc 0%, #c084fc 40%, #f472b6 100%)",
      backgroundSize: "200% auto",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      lineHeight: "1.1",
      letterSpacing: "-1.5px",
      margin: 0,
      animation: "gradientMove 6s ease infinite",
      maxWidth: "14ch",
    },
    subtitle: {
      fontSize: "clamp(18px, 2.2vw, 24px)",
      color: "rgba(255, 255, 255, 0.78)",
      fontWeight: "400",
      lineHeight: "1.5",
      maxWidth: "32ch",
      margin: 0,
    },
    ctaRow: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: "16px",
      marginTop: "8px",
    },
    btnPrimary: {
      padding: "18px 36px",
      borderRadius: "16px",
      border: "none",
      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      color: "white",
      fontSize: "clamp(16px, 1.8vw, 18px)",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 8px 32px rgba(99, 102, 241, 0.45), 0 2px 8px rgba(0,0,0,0.2)",
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
    },
    btnSecondary: {
      padding: "18px 36px",
      borderRadius: "16px",
      border: "2px solid rgba(255, 255, 255, 0.25)",
      background: "rgba(255, 255, 255, 0.06)",
      backdropFilter: "blur(12px)",
      color: "rgba(255, 255, 255, 0.95)",
      fontSize: "clamp(16px, 1.8vw, 18px)",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
    },
    heroVisual: {
      width: "clamp(280px, 35vw, 380px)",
      height: "auto",
      marginTop: "20px",
      filter: "drop-shadow(0 24px 48px rgba(99, 102, 241, 0.25))",
      opacity: 0.92,
    },
    featuresGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "24px",
      width: "100%",
      maxWidth: "1000px",
    },
    featureCard: {
      background: "rgba(255, 255, 255, 0.04)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: "20px",
      padding: "32px 24px",
      textAlign: "center",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
      transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
      overflow: "hidden",
    },
    featureIcon: {
      fontSize: "clamp(40px, 4.5vw, 52px)",
      marginBottom: "16px",
      filter: "drop-shadow(0 4px 12px rgba(129, 140, 248, 0.3))",
    },
    featureTitle: {
      fontSize: "clamp(18px, 2vw, 22px)",
      fontWeight: "700",
      color: "rgba(255, 255, 255, 0.95)",
      marginBottom: "10px",
    },
    featureDescription: {
      fontSize: "clamp(14px, 1.5vw, 16px)",
      color: "rgba(255, 255, 255, 0.6)",
      lineHeight: "1.6",
      margin: 0,
    },
  };

  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 12}s`,
    duration: `${8 + Math.random() * 8}s`,
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
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes floatParticle {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
            50% { transform: translateY(-60px) translateX(20px); opacity: 0.8; }
          }
        `}
      </style>

      <div style={styles.pageContainer}>
        <div style={styles.particles}>
          {particles.map((p) => (
            <div
              key={p.id}
              style={{
                ...styles.particle,
                left: p.left,
                top: p.top,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          ))}
        </div>
        <div style={styles.mouseFollower} />

        <div style={styles.content}>
          <nav style={styles.nav}>
            <div style={styles.logo}>
              <span style={styles.logoIcon}>🎮</span>
              EduGame
            </div>
            <button
              type="button"
              style={styles.navCta}
              onClick={() => navigate("/login")}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
            >
              Se connecter
            </button>
          </nav>

          <section style={styles.heroSection}>
            <div style={styles.badge}>
              <span>✨</span> Apprentissage ludique
            </div>
            <h1 style={styles.title}>EduGame Platforme</h1>
            <p style={styles.subtitle}>
              Apprends en jouant, progresse en t'amusant !
            </p>
            <div style={styles.ctaRow}>
              <button
                type="button"
                style={styles.btnPrimary}
                onClick={() => navigate("/register")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(99, 102, 241, 0.5), 0 4px 12px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(99, 102, 241, 0.45), 0 2px 8px rgba(0,0,0,0.2)";
                }}
              >
                <span>🚀</span> Commencer
              </button>
            </div>
            <svg
              style={styles.heroVisual}
              viewBox="0 0 200 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.9" />
                </linearGradient>
                <filter id="softGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect x="40" y="30" width="120" height="70" rx="12" fill="url(#heroGrad)" filter="url(#softGlow)" opacity="0.85" />
              <rect x="55" y="45" width="30" height="22" rx="4" fill="rgba(255,255,255,0.4)" />
              <rect x="92" y="45" width="30" height="22" rx="4" fill="rgba(255,255,255,0.4)" />
              <rect x="129" y="45" width="30" height="22" rx="4" fill="rgba(255,255,255,0.4)" />
              <circle cx="100" cy="85" r="8" fill="rgba(255,255,255,0.5)" />
              <path d="M 75 50 L 75 75 L 55 75 L 55 50 Z" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" rx="2" />
            </svg>
          </section>

          <div style={styles.featuresGrid}>
            <div
              style={styles.featureCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.borderColor = "rgba(129, 140, 248, 0.25)";
                e.currentTarget.style.boxShadow = "0 16px 48px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(129, 140, 248, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.2)";
              }}
            >
              <div style={styles.featureIcon}>🎯</div>
              <h3 style={styles.featureTitle}>Jeux Éducatifs</h3>
              <p style={styles.featureDescription}>
                Quiz interactifs et jeux amusants pour apprendre efficacement.
              </p>
            </div>
            <div
              style={styles.featureCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.borderColor = "rgba(129, 140, 248, 0.25)";
                e.currentTarget.style.boxShadow = "0 16px 48px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(129, 140, 248, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.2)";
              }}
            >
              <div style={styles.featureIcon}>🏆</div>
              <h3 style={styles.featureTitle}>Badges & Niveaux</h3>
              <p style={styles.featureDescription}>
                Gagne des badges, monte de niveau et deviens un champion !
              </p>
            </div>
            <div
              style={styles.featureCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.borderColor = "rgba(129, 140, 248, 0.25)";
                e.currentTarget.style.boxShadow = "0 16px 48px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(129, 140, 248, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.2)";
              }}
            >
              <div style={styles.featureIcon}>📊</div>
              <h3 style={styles.featureTitle}>Suivi de Progression</h3>
              <p style={styles.featureDescription}>
                Suis ta progression et celle de tes enfants en temps réel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
