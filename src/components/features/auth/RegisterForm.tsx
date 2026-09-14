import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../../services/auth.service";
import { validateEmail, validatePassword, validateName, validateDate } from "../../../utils/validators";
import { formStyles } from "../../../styles/formStyles";
import { useInputFocus } from "../../../hooks/useInputFocus";
import { getErrorMessage, isTimeoutError } from "../../../utils/errorHandler";
import { getDialCode, getPhoneLength, validatePhoneForCountry } from "../../../utils/countryDialCodes";
import PhoneCountryField from "./PhoneCountryField";

const REGISTRATION_SUCCESS_MESSAGE =
  "Inscription parent réussie ! Vérifiez votre e-mail pour activer votre compte.";

export default function RegisterForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    telephone: "",
    dateDeNaissance: "",
    cin: "",
    paysNom: "",
    genre: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const { handleFocus, handleBlur } = useInputFocus();

  const dialCode = getDialCode(form.paysNom);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
    if (error) setError(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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
      newErrors.email = "L'e-mail est requis";
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Format d'e-mail invalide";
    }

    if (!form.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (!validatePassword(form.password)) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (!form.cin.trim()) {
      newErrors.cin = "Le CIN est requis";
    } else if (!/^[0-9]{8}$/.test(form.cin.trim())) {
      newErrors.cin = "Le CIN doit contenir exactement 8 chiffres";
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
      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

      if (actualAge < 18) {
        newErrors.dateDeNaissance = "L'âge minimum pour un compte parent est de 18 ans";
      }
    }

    if (!form.paysNom.trim()) {
      newErrors.paysNom = "Choisissez un pays (drapeau) pour le téléphone";
    }

    if (!form.genre) {
      newErrors.genre = "Le genre est requis";
    }

    if (!form.telephone.trim()) {
      newErrors.telephone = "Le téléphone est requis";
    } else if (!validatePhoneForCountry(form.telephone, form.paysNom)) {
      const expectedLength = getPhoneLength(form.paysNom);
      newErrors.telephone = `Le téléphone doit contenir exactement ${expectedLength} chiffres pour ce pays`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      setError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    setLoading(true);

    try {
      const registerData: {
        nom: string;
        prenom: string;
        email: string;
        password: string;
        dateDeNaissance: string;
        cin: string;
        telephone: string;
        paysNom: string;
        genre: string;
      } = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        dateDeNaissance: form.dateDeNaissance,
        cin: form.cin.trim(),
        // L'indicatif du pays choisi via le drapeau est ajouté automatiquement devant
        // le numéro (ex. Tunisie -> +216XXXXXXXX).
        telephone: `${dialCode}${form.telephone.trim()}`,
        paysNom: form.paysNom.trim(),
        genre: form.genre,
      };

      await authService.register(registerData);
      navigate("/login", {
        replace: true,
        state: { message: REGISTRATION_SUCCESS_MESSAGE },
      });
    } catch (err) {
      if (isTimeoutError(err)) {
        navigate("/login", {
          replace: true,
          state: {
            message:
              "Votre compte a peut-être été créé. Vérifiez votre e-mail pour confirmer l'inscription.",
          },
        });
        return;
      }

      const errorMessage = getErrorMessage(err, "Erreur lors de l'inscription");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = formStyles;

  const renderInput = (name: keyof typeof form, placeholder: string, type = "text") => (
    <div style={styles.formGroup}>
      <div style={styles.inputWrapper}>
        <input
          type={type}
          id={name}
          name={name}
          placeholder={placeholder}
          aria-label={placeholder}
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
      {errors[name] && <span style={styles.errorText}>{errors[name]}</span>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={styles.form} noValidate>
      <div style={styles.infoBox}>
        Inscription <strong>parent</strong>. Vous pourrez ensuite ajouter les comptes joueurs depuis votre tableau de bord.
        Éducateurs et sponsors sont créés par l’administrateur.
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {renderInput("email", "Adresse e-mail")}

      <div className="grid grid-cols-2 gap-3">
        {renderInput("nom", "Nom")}
        {renderInput("prenom", "Prénom")}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {renderInput("password", "Mot de passe (min. 6)", "password")}
        {renderInput("cin", "CIN (8 chiffres)")}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div style={styles.formGroup}>
          <PhoneCountryField
            value={form.telephone}
            onValueChange={(value) => {
              setForm((f) => ({ ...f, telephone: value }));
              if (errors.telephone) setErrors((prev) => ({ ...prev, telephone: null }));
              if (error) setError(null);
            }}
            countryName={form.paysNom}
            onCountryChange={(countryName) => {
              setForm((f) => ({ ...f, paysNom: countryName }));
              if (errors.paysNom) setErrors((prev) => ({ ...prev, paysNom: null }));
            }}
            error={errors.telephone || errors.paysNom}
            placeholder={
              form.paysNom
                ? `Téléphone (${getPhoneLength(form.paysNom)} chiffres)`
                : "Téléphone (choisir un pays)"
            }
          />
        </div>

        <div style={styles.formGroup}>
          <div style={styles.inputWrapper}>
            <input
              type="date"
              id="dateDeNaissance"
              name="dateDeNaissance"
              aria-label="Date de naissance (âge min. 18 ans)"
              value={form.dateDeNaissance}
              onChange={handleChange}
              onFocus={(e) => handleFocus("dateDeNaissance", e)}
              onBlur={(e) => handleBlur("dateDeNaissance", !!errors.dateDeNaissance, e)}
              style={{
                ...styles.input,
                ...(errors.dateDeNaissance ? styles.inputError : {}),
              }}
            />
          </div>
          {errors.dateDeNaissance ? (
            <span style={styles.errorText}>{errors.dateDeNaissance}</span>
          ) : (
            <span className="text-xs text-slate-400 px-0.5">Âge min. 18 ans</span>
          )}
        </div>
      </div>

      <div style={styles.formGroup}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
          Genre <span style={styles.required}>*</span>
        </span>
        <div style={{ display: 'flex', gap: '16px' }}>
          {(['HOMME', 'FEMME'] as const).map((option) => (
            <label
              key={option}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="genre"
                value={option}
                checked={form.genre === option}
                onChange={() => {
                  setForm((f) => ({ ...f, genre: option }));
                  if (errors.genre) setErrors((prev) => ({ ...prev, genre: null }));
                }}
              />
              {option === 'HOMME' ? 'Homme' : 'Femme'}
            </label>
          ))}
        </div>
        {errors.genre && <span style={styles.errorText}>{errors.genre}</span>}
      </div>

      <button
        type="submit"
        disabled={loading}
        style={styles.button(loading)}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (!loading) {
            e.currentTarget.style.background = "#1d4ed8";
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (!loading) {
            e.currentTarget.style.background = "#2563eb";
            e.currentTarget.style.transform = "translateY(0)";
          }
        }}
      >
        {loading ? (
          <>
            <span
              style={{
                display: "inline-block",
                width: "18px",
                height: "18px",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderTop: "2px solid white",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <span>Création…</span>
          </>
        ) : (
          <span>Créer mon compte parent</span>
        )}
      </button>
    </form>
  );
}
