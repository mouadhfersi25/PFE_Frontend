import { useState, useEffect, useRef } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { userService } from "../../services/user.service";
import storage from "../../utils/storage";
import { getInitial, generateDefaultAvatar } from "../../utils/avatarUtils";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(() => storage.get("auth_avatar"));
  const [initial, setInitial] = useState("");
  const menuRef = useRef(null);

  const loadProfileForAvatar = async () => {
    try {
      const profile = await userService.getProfile();
      const url = profile.avatarUrl || null;
      if (url) {
        storage.set("auth_avatar", url);
        setAvatarUrl(url);
      } else {
        storage.remove("auth_avatar");
        setAvatarUrl(null);
      }
      setInitial(getInitial(profile.email, profile.nom, profile.prenom));
    } catch (_) {
      setInitial(getInitial(storage.get("auth_email") || "", null, null));
    }
  };

  useEffect(() => {
    loadProfileForAvatar();
  }, []);

  useEffect(() => {
    const onAvatarUpdated = () => {
      setAvatarUrl(storage.get("auth_avatar"));
    };
    window.addEventListener("auth:avatar-updated", onAvatarUpdated);
    return () => window.removeEventListener("auth:avatar-updated", onAvatarUpdated);
  }, []);

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

  const isImageUrl = avatarUrl && (avatarUrl.startsWith("data:") || avatarUrl.startsWith("http"));
  const isEmoji = avatarUrl && !isImageUrl && avatarUrl.length <= 4;
  const displayInitial = initial || (storage.get("auth_email") || "?").charAt(0).toUpperCase();

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      backgroundSize: "400% 400%",
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
      padding: "8px 14px",
      borderRadius: "12px",
      border: "2px solid rgba(99, 102, 241, 0.3)",
      background: "rgba(99, 102, 241, 0.08)",
      color: "#1a1a2e",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      transition: "all 0.2s ease",
    },
    avatarCircle: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      overflow: "hidden",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)",
      fontSize: "20px",
      border: "2px solid rgba(99, 102, 241, 0.3)",
    },
    menuDropdown: {
      position: "absolute",
      top: "52px",
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
    contentArea: {
      flex: 1,
      padding: "24px",
      overflowY: "auto",
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.headerTitle}>🎮 Dashboard</h1>
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
              <div
                style={
                  isImageUrl
                    ? {
                        ...styles.avatarCircle,
                        padding: 0,
                        background: "transparent",
                      }
                    : isEmoji
                    ? styles.avatarCircle
                    : { ...styles.avatarCircle, ...generateDefaultAvatar(displayInitial, 40) }
                }
              >
                {isImageUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : isEmoji ? (
                  avatarUrl
                ) : (
                  displayInitial
                )}
              </div>
              <span>Profil</span>
              <span>▼</span>
            </button>
            <div style={styles.menuDropdown}>
              <div
                style={styles.dropdownItem}
                onClick={() => {
                  navigate("/dashboard/profile");
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
                <span>Mon profil</span>
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
                <span>Se déconnecter</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main style={styles.contentArea}>
        <Outlet />
      </main>
    </div>
  );
}
