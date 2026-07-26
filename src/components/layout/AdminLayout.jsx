import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Erreur lors du logout:", error);
      navigate("/login");
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: "📊",
      path: "/admin/dashboard",
    },
    {
      id: "players",
      label: "Gestion des joueurs",
      icon: "👥",
      path: "/admin/players",
    },
    {
      id: "games",
      label: "Gestion des jeux",
      icon: "🎮",
      path: "/admin/games",
    },
    {
      id: "badges",
      label: "Gestion des badges",
      icon: "🏆",
      path: "/admin/badges",
    },
    {
      id: "moderation",
      label: "Modération du contenu",
      icon: "🛡️",
      path: "/admin/moderation",
    },
    {
      id: "statistics",
      label: "Statistiques",
      icon: "📈",
      path: "/admin/statistics",
    },
  ];

  const isActive = (path) => location.pathname === path;

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
      backgroundSize: "400% 400%",
      animation: "gradientShift 15s ease infinite",
    },
    sidebar: {
      width: sidebarOpen ? "280px" : "80px",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      boxShadow: "4px 0 20px rgba(0, 0, 0, 0.1)",
      transition: "width 0.3s ease",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      top: 0,
      left: 0,
      height: "100vh",
      zIndex: 10,
    },
    sidebarHeader: {
      padding: "24px 20px",
      borderBottom: "2px solid rgba(99, 102, 241, 0.1)",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    logo: {
      fontSize: "28px",
      fontWeight: "800",
      background: "linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      whiteSpace: "nowrap",
      overflow: "hidden",
    },
    sidebarContent: {
      flex: 1,
      padding: "20px 0",
      overflowY: "auto",
    },
    menuItem: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      padding: "14px 20px",
      margin: "4px 12px",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      textDecoration: "none",
      color: "#1a1a2e",
      fontSize: "15px",
      fontWeight: "500",
    },
    menuItemActive: {
      background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)",
      color: "#6366f1",
      fontWeight: "700",
      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
    },
    menuIcon: {
      fontSize: "20px",
      minWidth: "24px",
      textAlign: "center",
    },
    menuLabel: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      opacity: sidebarOpen ? 1 : 0,
      transition: "opacity 0.3s ease",
    },
    toggleButton: {
      position: "absolute",
      top: "20px",
      right: "-15px",
      width: "30px",
      height: "30px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
      border: "none",
      color: "white",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
      fontSize: "14px",
      zIndex: 20,
    },
    mainContent: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      marginLeft: sidebarOpen ? "280px" : "80px",
      transition: "margin-left 0.3s ease",
    },
    header: {
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      padding: "20px 32px",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      zIndex: 5,
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
    },
    headerTitle: {
      fontSize: "24px",
      fontWeight: "800",
      color: "#1a1a2e",
      margin: 0,
    },
    headerRight: {
      display: "flex",
      alignItems: "center",
      gap: "20px",
    },
    menuContainer: {
      position: "relative",
      display: "flex",
      alignItems: "center",
    },
    menuButton: {
      padding: "10px 18px",
      borderRadius: "12px",
      border: "2px solid rgba(99, 102, 241, 0.3)",
      background: "rgba(99, 102, 241, 0.08)",
      color: "#1a1a2e",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.2s ease",
    },
    menuDropdown: {
      position: "absolute",
      top: "48px",
      right: "0",
      background: "rgba(255, 255, 255, 0.98)",
      backdropFilter: "blur(10px)",
      borderRadius: "12px",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
      minWidth: "200px",
      padding: "8px",
      zIndex: 1000,
      border: "1px solid rgba(99, 102, 241, 0.1)",
      opacity: menuOpen ? 1 : 0,
      visibility: menuOpen ? "visible" : "hidden",
      transform: menuOpen ? "translateY(0)" : "translateY(-10px)",
      transition: "all 0.3s ease",
    },
    dropdownItem: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      color: "#1a1a2e",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease",
    },
    dropdownDivider: {
      height: "1px",
      background: "rgba(99, 102, 241, 0.1)",
      margin: "4px 0",
    },
    logoutButton: {
      padding: "10px 20px",
      borderRadius: "10px",
      border: "none",
      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      color: "white",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    contentArea: {
      flex: 1,
      padding: "32px",
      overflowY: "auto",
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
        `}
      </style>
      <div style={styles.container}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.logo}>
              {sidebarOpen ? "🎮 Admin Panel" : "🎮"}
            </div>
          </div>

          <button
            style={styles.toggleButton}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
            }}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>

          <div style={styles.sidebarContent}>
            {menuItems.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.menuItem,
                  ...(isActive(item.path) ? styles.menuItemActive : {}),
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "translateX(0)";
                  }
                }}
              >
                <span style={styles.menuIcon}>{item.icon}</span>
                <span style={styles.menuLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.mainContent}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <h1 style={styles.headerTitle}>Administration</h1>
            </div>
            <div style={styles.headerRight}>
              <div style={styles.menuContainer} ref={menuRef}>
                <button
                  type="button"
                  style={styles.menuButton}
                  onClick={() => setMenuOpen(!menuOpen)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)";
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                  }}
                >
                  <span>👤</span>
                  <span>Profil</span>
                  <span>▼</span>
                </button>
                <div style={styles.menuDropdown}>
                  <div
                    style={styles.dropdownItem}
                    onClick={() => {
                      navigate("/admin/profile");
                      setMenuOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>👤</span>
                    <span>Gérer mon profil</span>
                  </div>
                  <div style={styles.dropdownDivider} />
                  <div
                    style={styles.dropdownItem}
                    onClick={() => setMenuOpen(false)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>⚙️</span>
                    <span>Paramètres</span>
                  </div>
                  <div style={styles.dropdownDivider} />
                  <div
                    style={{ ...styles.dropdownItem, color: "#ef4444" }}
                    onClick={handleLogout}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>🚪</span>
                    <span>Déconnexion</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div style={styles.contentArea}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
