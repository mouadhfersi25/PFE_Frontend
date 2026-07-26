// Fonctions de validation

export const validateEmail = (email: string | undefined): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const validatePassword = (password: string | undefined): boolean => {
  return !!password && password.length >= 6;
};

export const validateDate = (date: string | undefined): boolean => {
  if (!date) return false;
  const selectedDate = new Date(date);
  const today = new Date();
  return selectedDate <= today && !isNaN(selectedDate.getTime());
};

export const validatePhone = (phone: string | undefined): boolean => {
  if (!phone) return true;
  const phoneRegex = /^[0-9]{8}$/;
  return phoneRegex.test(phone.trim());
};

export const validateName = (name: string | undefined): boolean => {
  if (!name) return false;
  const trimmed = name.trim();
  return trimmed.length >= 3 && trimmed.length <= 50;
};

