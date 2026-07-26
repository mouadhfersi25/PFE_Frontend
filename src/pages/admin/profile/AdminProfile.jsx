import AdminLayout from "../../../components/layout/AdminLayout";
import { useState, useEffect } from "react";
import { userService } from "../../../services/user.service";
import { getInitial, generateDefaultAvatar, PREDEFINED_AVATARS } from "../../../utils/avatarUtils";
import { getErrorMessage } from "../../../utils/errorHandler";

export default function AdminProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    nom: "",
    prenom: "",
    telephone: "",
    avatar: null, // Avatar sélectionné (emoji)
  });
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await userService.getProfile();
      setForm({
        email: profile.email || "",
        nom: profile.nom || "",
        prenom: profile.prenom || "",
        telephone: profile.telephone || "",
        avatar: profile.avatarUrl || null,
      });
      setSelectedAvatar(profile.avatarUrl || null);
    } catch (err) {
      setError(getErrorMessage(err, "Erreur lors du chargement du profil"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
    setForm({ ...form, avatar });
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleRemoveAvatar = async () => {
    try {
      setSaving(true);
      setError(null);
      await userService.updateProfile({
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        avatarUrl: null, // supprimer l'avatar côté backend
      });
      setSelectedAvatar(null);
      setForm((prev) => ({ ...prev, avatar: null }));
      window.dispatchEvent(new Event("auth:avatar-updated"));
      setSuccess("Avatar supprimé avec succès !");
    } catch (err) {
      setError(getErrorMessage(err, "Erreur lors de la suppression de l'avatar"));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await userService.updateProfile({
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        avatarUrl: selectedAvatar, // Envoyer l'emoji sélectionné
      });
      // Forcer le header à se mettre à jour sans refresh
      window.dispatchEvent(new Event("auth:avatar-updated"));
      setSuccess("Profil mis à jour avec succès !");
    } catch (err) {
      setError(getErrorMessage(err, "Erreur lors de la mise à jour du profil"));
    } finally {
      setSaving(false);
    }
  };

  const initial = getInitial(form.email, form.nom, form.prenom);
  const isImageUrl = selectedAvatar && (selectedAvatar.startsWith("data:") || selectedAvatar.startsWith("http"));
  const currentAvatarStyle = !isImageUrl && selectedAvatar
    ? {
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "60px",
        border: "4px solid #6366f1",
        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
      }
    : generateDefaultAvatar(initial, 120);

  const styles = {
    container: {
      background: "rgba(255, 255, 255, 0.95)",
      borderRadius: "20px",
      padding: "40px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
      maxWidth: "900px",
      margin: "0 auto",
    },
    title: {
      fontSize: "32px",
      fontWeight: "800",
      color: "#1a1a2e",
      marginBottom: "30px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    avatarSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "24px",
      marginBottom: "40px",
      paddingBottom: "40px",
      borderBottom: "2px solid rgba(99, 102, 241, 0.1)",
    },
    avatarActions: {
      display: "flex",
      gap: "12px",
      flexWrap: "wrap",
      justifyContent: "center",
    },
    currentAvatar: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "16px",
    },
    currentAvatarLabel: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#1a1a2e",
    },
    // Modal avatar picker
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(15, 15, 26, 0.55)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      zIndex: 2000,
    },
    modal: {
      width: "min(720px, 95vw)",
      maxHeight: "min(560px, 85vh)",
      background: "rgba(255, 255, 255, 0.98)",
      borderRadius: "20px",
      boxShadow: "0 30px 90px rgba(0, 0, 0, 0.35)",
      border: "1px solid rgba(99, 102, 241, 0.15)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    modalHeader: {
      padding: "18px 22px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: "1px solid rgba(99, 102, 241, 0.12)",
      background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)",
    },
    modalTitle: {
      margin: 0,
      fontSize: "18px",
      fontWeight: "800",
      color: "#1a1a2e",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    modalClose: {
      width: "40px",
      height: "40px",
      borderRadius: "12px",
      border: "none",
      cursor: "pointer",
      background: "rgba(99, 102, 241, 0.12)",
      color: "#1a1a2e",
      fontWeight: "900",
      transition: "all 0.2s ease",
    },
    modalBody: {
      padding: "18px 18px 22px",
      overflowY: "auto",
    },
    avatarsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))",
      gap: "12px",
      width: "100%",
    },
    avatarOption: {
      width: "64px",
      height: "64px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "32px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      border: "3px solid transparent",
      boxShadow: "0 2px 8px rgba(99, 102, 241, 0.2)",
    },
    avatarOptionSelected: {
      border: "4px solid #6366f1",
      transform: "scale(1.1)",
      boxShadow: "0 4px 16px rgba(99, 102, 241, 0.5)",
    },
    removeButton: {
      padding: "10px 20px",
      borderRadius: "10px",
      border: "2px solid #ef4444",
      background: "rgba(239, 68, 68, 0.1)",
      color: "#ef4444",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    chooseAvatarButton: {
      padding: "12px 22px",
      borderRadius: "12px",
      border: "2px solid rgba(99, 102, 241, 0.25)",
      background: "rgba(99, 102, 241, 0.08)",
      color: "#6366f1",
      fontSize: "14px",
      fontWeight: "800",
      cursor: "pointer",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "24px",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    label: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#1a1a2e",
    },
    input: {
      padding: "14px 18px",
      borderRadius: "12px",
      border: "2px solid rgba(99, 102, 241, 0.2)",
      fontSize: "16px",
      fontFamily: "inherit",
      transition: "all 0.3s ease",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      color: "#1a1a2e",
    },
    button: {
      padding: "16px 32px",
      borderRadius: "12px",
      border: "none",
      background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
      color: "white",
      fontSize: "16px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
      marginTop: "12px",
    },
    message: {
      padding: "16px 20px",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "600",
      marginBottom: "20px",
    },
    messageSuccess: {
      background: "#d1fae5",
      color: "#065f46",
      border: "2px solid #10b981",
    },
    messageError: {
      background: "#fee2e2",
      color: "#991b1b",
      border: "2px solid #ef4444",
    },
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={styles.container}>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>Chargement du profil...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={styles.container}>
        <h1 style={styles.title}>
          <span>👤</span>
          <span>Gérer mon profil</span>
        </h1>

        {success && (
          <div style={{ ...styles.message, ...styles.messageSuccess }}>
            ✅ {success}
          </div>
        )}

        {error && (
          <div style={{ ...styles.message, ...styles.messageError }}>
            ⚠️ {error}
          </div>
        )}

        {/* Section Avatar */}
        <div style={styles.avatarSection}>
          <div style={styles.currentAvatar}>
            <span style={styles.currentAvatarLabel}>Avatar / photo actuel</span>
            {isImageUrl ? (
              <img
                src={selectedAvatar}
                alt="Profil"
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "4px solid #6366f1",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                }}
              />
            ) : selectedAvatar ? (
              <div style={currentAvatarStyle}>{selectedAvatar}</div>
            ) : (
              <div style={currentAvatarStyle}>{initial}</div>
            )}
          </div>

          <div style={styles.avatarActions}>
            <button
              type="button"
              style={styles.chooseAvatarButton}
              onClick={() => setAvatarModalOpen(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 8px 18px rgba(99, 102, 241, 0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span>🎭</span>
              <span>Choisir un avatar</span>
            </button>

            {selectedAvatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={saving}
                style={{
                  ...styles.removeButton,
                  opacity: saving ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!saving) e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                }}
              >
                <span>{saving ? "⏳" : "🗑️"}</span>
                <span>{saving ? "Suppression..." : "Supprimer l'avatar"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal: choisir un avatar */}
        {avatarModalOpen && (
          <div
            style={styles.modalOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setAvatarModalOpen(false);
            }}
          >
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  <span>🎭</span>
                  <span>Choisir un avatar</span>
                </h3>
                <button
                  type="button"
                  style={styles.modalClose}
                  onClick={() => setAvatarModalOpen(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.03)";
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.18)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.12)";
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.avatarsGrid}>
                  {PREDEFINED_AVATARS.map((avatar, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        handleAvatarSelect(avatar);
                        setAvatarModalOpen(false);
                      }}
                      style={{
                        ...styles.avatarOption,
                        ...(selectedAvatar === avatar ? styles.avatarOptionSelected : {}),
                      }}
                      onMouseEnter={(e) => {
                        if (selectedAvatar !== avatar) {
                          e.currentTarget.style.transform = "scale(1.06)";
                          e.currentTarget.style.boxShadow = "0 6px 14px rgba(99, 102, 241, 0.35)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedAvatar !== avatar) {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(99, 102, 241, 0.2)";
                        }
                      }}
                      title="Cliquer pour sélectionner"
                    >
                      {avatar}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              style={styles.input}
              disabled
            />
            <small style={{ color: "#6b7280", fontSize: "12px" }}>
              L'email ne peut pas être modifié
            </small>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Nom</label>
            <input
              type="text"
              name="nom"
              value={form.nom}
              onChange={handleChange}
              placeholder="Votre nom"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Prénom</label>
            <input
              type="text"
              name="prenom"
              value={form.prenom}
              onChange={handleChange}
              placeholder="Votre prénom"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Téléphone</label>
            <input
              type="tel"
              name="telephone"
              value={form.telephone}
              onChange={handleChange}
              placeholder="Votre numéro de téléphone"
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...styles.button,
              opacity: saving ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.4)";
              }
            }}
          >
            {saving ? "⏳ Enregistrement..." : "💾 Enregistrer les modifications"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
