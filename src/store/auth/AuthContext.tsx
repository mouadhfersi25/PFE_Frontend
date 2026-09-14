// Auth Context
import React, { createContext, useState, useEffect, ReactNode } from "react";
import { authService } from "../../services/auth.service";
import storage from "../../utils/storage";

interface AuthUser {
  email: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: Record<string, unknown>) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  const token = storage.get("jwt_token");
  if (!token) return null;
  const email = storage.get("auth_email");
  const role = storage.get("auth_role") || undefined;
  if (!email) return { email: "logged_user", role };
  return { email, role };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  useEffect(() => {
    setUser(readStoredUser());
  }, []);

  const login = async (credentials: Record<string, unknown>) => {
    const data = await authService.login(credentials);
    setUser({ email: data.email as string, role: data.role as string });
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
