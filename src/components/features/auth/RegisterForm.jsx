import { useState } from "react";
import { authService } from "../../../services/auth.service";
import { validateEmail, validatePassword, validateName, validatePhone, validateDate } from "../../../utils/validators";
import { formStyles } from "../../../styles/formStyles";
import { useInputFocus } from "../../../hooks/useInputFocus";
import { getErrorMessage, isTimeoutError } from "../../../utils/errorHandler";

export default function RegisterForm() {
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    telephone: "",
    dateDeNaissance: "",
  });

  const [profileImage, setProfileImage] = useState(null); // data URL ou null (photo à l'inscription)
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const { focusedField, handleFocus, handleBlur } = useInputFocus();

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
    if (msg) setMsg(null);
    if (error) setError(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.nom.trim()) {
      newErrors.nom = "Le nom est requis";
    } else if (!validateName(form.nom)) {
      newErrors.nom = "Le nom doit contenir entre 3 et 50 caractères";
    }

    if (!form.prenom.trim()) {
      newErrors.prenom = "Le prénom est requis";
    } else if (!validateName(form.prenom)) {
      newErrors.prenom = "Le prénom doit contenir entre 3 et 50 caractères";
    }

    if (!form.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!form.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (!validatePassword(form.password)) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (!form.dateDeNaissance) {
      newErrors.dateDeNaissance = "La date de naissance est requise";
    } else if (!validateDate(form.dateDeNaissance)) {
      newErrors.dateDeNaissance = "Date invalide";
    } else {
      const birthDate = new Date(form.dateDeNaissance);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      
      if (actualAge < 7) {
        newErrors.dateDeNaissance = "L'âge minimum requis est de 7 ans";
      }
    }

    if (form.telephone && !validatePhone(form.telephone)) {
      newErrors.telephone = "Le téléphone doit contenir exactement 8 chiffres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMsg(null);

    if (!validateForm()) {
      setError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    setLoading(true);

    try {
      const registerData = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        dateDeNaissance: form.dateDeNaissance,
      };

      const phoneTrimmed = form.telephone?.trim();
      if (phoneTrimmed && phoneTrimmed.length === 8 && /^[0-9]{8}$/.test(phoneTrimmed)) {
        registerData.telephone = phoneTrimmed;
      }
      if (profileImage) {
        registerData.avatarUrl = profileImage;
      }

      await authService.register(registerData);
      setMsg("Inscription réussie ! Vérifiez votre email pour activer votre compte.");
      
      setForm({
        nom: "",
        prenom: "",
        email: "",
        password: "",
        telephone: "",
        dateDeNaissance: "",
      });
      setProfileImage(null);
      setErrors({});
    } catch (err) {
      if (isTimeoutError(err)) {
        setMsg("✅ Ton compte a peut-être été créé ! Vérifie ton email pour confirmer l'inscription. Si tu ne reçois pas d'email, réessaie dans quelques instants.");
        setForm({
          nom: "",
          prenom: "",
          email: "",
          password: "",
          telephone: "",
          dateDeNaissance: "",
        });
        setProfileImage(null);
        setErrors({});
        return;
      }
      
      const errorMessage = getErrorMessage(err, "Erreur lors de l'inscription");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = formStyles;

  const renderInput = (name, label, icon, placeholder, type = "text", required = true) => (
    <div style={styles.formGroup}>
      <label htmlFor={name} style={styles.label}>
        <span style={styles.labelIcon}>{icon}</span>
        <span>
          {label} {required && <span style={styles.required}>*</span>}
        </span>
      </label>
      <div style={styles.inputWrapper}>
        <div style={{ ...styles.inputGlow, opacity: focusedField === name ? 1 : 0 }} />
        <input
          type={type}
          id={name}
          name={name}
          placeholder={placeholder}
          value={form[name]}
          onChange={handleChange}
          onFocus={(e) => handleFocus(name, e)}
          onBlur={(e) => handleBlur(name, !!errors[name], e)}
          style={{
            ...styles.input,
            ...(errors[name] ? styles.inputError : {}),
          }}
        />
      </div>
      {errors[name] && <span style={styles.errorText}>⚠️ {errors[name]}</span>}
    </div>
  );

  return (
    <>
      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        {/* Message d'information */}
        <div style={styles.infoBox}>
          <span>🎮</span>
          <span>Création d'un compte <strong>Joueur</strong> pour accéder aux jeux éducatifs</span>
        </div>

        {msg && (
          <div style={styles.success}>
            <span style={{ fontSize: "20px" }}>✅</span>
            <span>{msg}</span>
          </div>
        )}
        {error && (
          <div style={styles.error}>
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Nom */}
        {renderInput("nom", "Nom", "👤", "Ton nom")}

        {/* Prénom */}
        {renderInput("prenom", "Prénom", "✨", "Ton prénom")}

        {/* Email */}
        {renderInput("email", "Email", "📧", "exemple@email.com")}

        {/* Mot de passe */}
        {renderInput("password", "Mot de passe", "🔒", "Minimum 6 caractères", "password")}

        {/* Date de naissance */}
        <div style={styles.formGroup}>
          <label htmlFor="dateDeNaissance" style={styles.label}>
            <span style={styles.labelIcon}>🎂</span>
            <span>
              Date de naissance <span style={styles.required}>*</span>
              <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "400", marginLeft: "8px" }}>
                (Minimum 7 ans)
              </span>
            </span>
          </label>
          <div style={styles.inputWrapper}>
            <div style={{ ...styles.inputGlow, opacity: focusedField === 'dateDeNaissance' ? 1 : 0 }} />
            <input
              type="date"
              id="dateDeNaissance"
              name="dateDeNaissance"
              value={form.dateDeNaissance}
              onChange={handleChange}
              onFocus={(e) => handleFocus('dateDeNaissance', e)}
              onBlur={(e) => handleBlur('dateDeNaissance', !!errors.dateDeNaissance, e)}
              style={{
                ...styles.input,
                ...(errors.dateDeNaissance ? styles.inputError : {}),
              }}
            />
          </div>
          {errors.dateDeNaissance && <span style={styles.errorText}>⚠️ {errors.dateDeNaissance}</span>}
        </div>

        {/* Téléphone */}
        <div style={styles.formGroup}>
          <label htmlFor="telephone" style={styles.label}>
            <span style={styles.labelIcon}>📱</span>
            <span>Téléphone <span style={styles.optional}>(optionnel)</span></span>
          </label>
          <div style={styles.inputWrapper}>
            <div style={{ ...styles.inputGlow, opacity: focusedField === 'telephone' ? 1 : 0 }} />
            <input
              type="text"
              id="telephone"
              name="telephone"
              placeholder="8 chiffres (ex: 12345678)"
              value={form.telephone}
              onChange={handleChange}
              onFocus={(e) => handleFocus('telephone', e)}
              onBlur={(e) => handleBlur('telephone', !!errors.telephone, e)}
              style={{
                ...styles.input,
                ...(errors.telephone ? styles.inputError : {}),
              }}
            />
          </div>
          {errors.telephone && <span style={styles.errorText}>⚠️ {errors.telephone}</span>}
        </div>

        {/* Photo de profil (optionnel) - peut être changée en avatar depuis le dashboard */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            <span style={styles.labelIcon}>📷</span>
            <span>Photo de profil <span style={styles.optional}>(optionnel)</span></span>
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            {profileImage ? (
              <>
                <img
                  src={profileImage}
                  alt="Aperçu"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid rgba(99, 102, 241, 0.4)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setProfileImage(null)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #ef4444",
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Retirer la photo
                </button>
              </>
            ) : null}
            <label style={{ cursor: "pointer" }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
              <span
                style={{
                  display: "inline-block",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "2px dashed rgba(99, 102, 241, 0.4)",
                  background: "rgba(99, 102, 241, 0.06)",
                  color: "#6366f1",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                {profileImage ? "Changer la photo" : "Choisir une photo"}
              </span>
            </label>
          </div>
          <small style={{ color: "#6b7280", fontSize: "12px", marginTop: "6px", display: "block" }}>
            Tu pourras aussi choisir un avatar (emoji) depuis ton espace après inscription.
          </small>
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
              <span>Création en cours...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Créer mon compte Joueur</span>
              <div style={styles.buttonShine} />
            </>
          )}
        </button>
      </form>
    </>
  );
}
