// useAuth Hook
import { useContext } from "react";
import { AuthContext } from "../store/auth/AuthContext";

export const useAuth = () => {
  return useContext(AuthContext);
};
