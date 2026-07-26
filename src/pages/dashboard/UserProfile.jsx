import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "../../services/user.service";
import { authService } from "../../services/auth.service";
import { getInitial, generateDefaultAvatar, PREDEFINED_AVATARS } from "../../utils/avatarUtils";
import { getErrorMessage } from "../../utils/errorHandler";

export default function UserProfile() {
  const navigate = useNavigate();
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
    avatar: null,
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

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedAvatar(reader.result);
      setForm((prev) => ({ ...prev, avatar: reader.result }));
      if (error) setError(null);
      if (success) setSuccess(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveAvatar = async () => {
    try {
      setSaving(true);
      setError(null);
      await userService.updateProfile({
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        avatarUrl: null,
      });
      setSelectedAvatar(null);
      setForm((prev) => ({ ...prev, avatar: null }));
      window.dispatchEvent(new Event("auth:avatar-updated"));
      setSuccess("Photo / avatar supprimé avec succès !");
    } catch (err) {
      setError(getErrorMessage(err, "Erreur lors de la suppression"));
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
        avatarUrl: selectedAvatar,
      });
      window.dispatchEvent(new Event("auth:avatar-updated"));
      setSuccess("Profil mis à jour avec succès !");
    } catch (err) {
      setError(getErrorMessage(err, "Erreur lors de la mise à jour du profil"));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
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
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "24px 20px 40px",
    },
    topBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      maxWidth: "900px",
      margin: "0 auto 24px",
    },
    backBtn: {
      padding: "10px 18px",
      borderRadius: "12px",
      border: "2px solid rgba(255,255,255,0.4)",
      background: "rgba(255,255,255,0.15)",
      color: "white",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
    },
    logoutBtn: {
      padding: "10px 18px",
      borderRadius: "12px",
      border: "none",
      background: "rgba(239, 68, 68, 0.9)",
      color: "white",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
    },
    container: {
      background: "rgba(255, 255, 255, 0.95)",
      borderRadius: "20px",
      padding: "40px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
      maxWidth: "900px",
      margin: "0 auto",
    },
    title: {
      fontSize: "28px",
      fontWeight: "800",
      color: "#1a1a2e",
      marginBottom: "24px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    avatarSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "20px",
      marginBottom: "32px",
      paddingBottom: "32px",
      borderBottom: "2px solid rgba(99, 102, 241, 0.1)",
    },
    avatarActions: {
      display: "flex",
      gap: "12px",
      flexWrap: "wrap",
      justifyContent: "center",
    },
    currentAvatarLabel: { fontSize: "16px", fontWeight: "600", color: "#1a1a2e" },
    chooseAvatarBtn: {
      padding: "10px 18px",
      borderRadius: "10px",
      border: "2px solid rgba(99, 102, 241, 0.3)",
      background: "rgba(99, 102, 241, 0.08)",
      color: "#6366f1",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    choosePhotoBtn: {
      padding: "10px 18px",
      borderRadius: "10px",
      border: "2px solid rgba(16, 185, 129, 0.4)",
      background: "rgba(16, 185, 129, 0.08)",
      color: "#059669",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    removeButton: {
      padding: "10px 18px",
      borderRadius: "10px",
      border: "2px solid #ef4444",
      background: "rgba(239, 68, 68, 0.1)",
      color: "#ef4444",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
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
      maxHeight: "85vh",
      background: "rgba(255, 255, 255, 0.98)",
      borderRadius: "20px",
      boxShadow: "0 30px 90px rgba(0, 0, 0, 0.35)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    modalHeader: {
      padding: "16px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "1px solid rgba(99, 102, 241, 0.12)",
    },
    modalTitle: { margin: 0, fontSize: "18px", fontWeight: "800", color: "#1a1a2e" },
    modalClose: {
      width: "36px",
      height: "36px",
      borderRadius: "10px",
      border: "none",
      cursor: "pointer",
      background: "rgba(99, 102, 241, 0.12)",
      color: "#1a1a2e",
      fontWeight: "700",
    },
    modalBody: { padding: "16px", overflowY: "auto" },
    avatarsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))",
      gap: "10px",
    },
    avatarOption: {
      width: "56px",
      height: "56px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "28px",
      cursor: "pointer",
      border: "3px solid transparent",
    },
    avatarOptionSelected: { border: "4px solid #6366f1", transform: "scale(1.08)" },
    form: { display: "flex", flexDirection: "column", gap: "20px" },
    formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    label: { fontSize: "14px", fontWeight: "600", color: "#1a1a2e" },
    input: {
      padding: "12px 16px",
      borderRadius: "12px",
      border: "2px solid rgba(99, 102, 241, 0.2)",
      fontSize: "15px",
    },
    button: {
      padding: "14px 28px",
      borderRadius: "12px",
      border: "none",
      background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
      color: "white",
      fontSize: "16px",
      fontWeight: "700",
      cursor: "pointer",
      marginTop: "8px",
    },
    message: { padding: "14px 18px", borderRadius: "12px", fontSize: "14px", fontWeight: "600", marginBottom: "16px" },
    messageSuccess: { background: "#d1fae5", color: "#065f46", border: "2px solid #10b981" },
    messageError: { background: "#fee2e2", color: "#991b1b", border: "2px solid #ef4444" },
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <p style={{ textAlign: "center", padding: "40px" }}>Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button type="button" style={styles.backBtn} onClick={() => navigate("/dashboard")}>
          ← Retour au dashboard
        </button>
        <button type="button" style={styles.logoutBtn} onClick={handleLogout}>
          🚪 Déconnexion
        </button>
      </div>

      <div style={styles.container}>
        <h1 style={styles.title}>
          <span>👤</span>
          <span>Mon profil</span>
        </h1>

        {success && <div style={{ ...styles.message, ...styles.messageSuccess }}>✅ {success}</div>}
        {error && <div style={{ ...styles.message, ...styles.messageError }}>⚠️ {error}</div>}

        <div style={styles.avatarSection}>
          <span style={styles.currentAvatarLabel}>Photo / avatar actuel</span>
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

          <div style={styles.avatarActions}>
            <button type="button" style={styles.chooseAvatarBtn} onClick={() => setAvatarModalOpen(true)}>
              <span>🎭</span>
              <span>Choisir un avatar</span>
            </button>
            <label style={{ cursor: "pointer" }}>
              <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: "none" }} />
              <span style={styles.choosePhotoBtn}>
                <span>📷</span>
                <span>Choisir une photo</span>
              </span>
            </label>
            {selectedAvatar && (
              <button
                type="button"
                style={{ ...styles.removeButton, opacity: saving ? 0.7 : 1 }}
                onClick={handleRemoveAvatar}
                disabled={saving}
              >
                <span>{saving ? "⏳" : "🗑️"}</span>
                <span>Supprimer</span>
              </button>
            )}
          </div>
        </div>

        {avatarModalOpen && (
          <div
            style={styles.modalOverlay}
            onClick={(e) => e.target === e.currentTarget && setAvatarModalOpen(false)}
          >
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>🎭 Choisir un avatar</h3>
                <button type="button" style={styles.modalClose} onClick={() => setAvatarModalOpen(false)}>✕</button>
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
            <input type="email" name="email" value={form.email} style={styles.input} disabled />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nom</label>
            <input type="text" name="nom" value={form.nom} onChange={handleChange} placeholder="Votre nom" style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Prénom</label>
            <input type="text" name="prenom" value={form.prenom} onChange={handleChange} placeholder="Votre prénom" style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Téléphone</label>
            <input type="tel" name="telephone" value={form.telephone} onChange={handleChange} placeholder="Téléphone" style={styles.input} />
          </div>
          <button type="submit" disabled={saving} style={{ ...styles.button, opacity: saving ? 0.7 : 1 }}>
            {saving ? "⏳ Enregistrement..." : "💾 Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}
