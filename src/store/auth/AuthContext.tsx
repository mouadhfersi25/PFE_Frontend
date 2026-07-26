// Auth Context
import React, { createContext, useState, useEffect, ReactNode } from "react";
import { authService } from "../../services/auth.service";

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token] = useState(localStorage.getItem("jwt_token"));

  useEffect(() => {
    if (token) {
      const email = localStorage.getItem("auth_email");
      const role = localStorage.getItem("auth_role");
      setUser(email ? { email, role: role || undefined } : { email: "logged_user" });
    }
  }, [token]);

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
