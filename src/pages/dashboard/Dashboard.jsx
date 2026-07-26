export default function Dashboard() {
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      minHeight: "60vh",
    },
    card: {
      background: "rgba(255, 255, 255, 0.95)",
      borderRadius: "20px",
      padding: "40px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      maxWidth: "500px",
      width: "100%",
      textAlign: "center",
    },
    title: {
      fontSize: "32px",
      fontWeight: "800",
      color: "#1a1a2e",
      marginBottom: "20px",
    },
    message: {
      fontSize: "18px",
      color: "#4b5563",
      margin: 0,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎮 Dashboard</h1>
        <p style={styles.message}>
          Bienvenue ! Tu es connecté avec succès. Utilise le menu Profil en haut à droite pour accéder à ton profil ou te déconnecter.
        </p>
      </div>
    </div>
  );
}
