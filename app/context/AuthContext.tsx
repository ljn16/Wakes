"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type AuthContextType = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  toggleLogin: () => void;
  toggleAdmin: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const toggleLogin = () => {
    setIsLoggedIn(prev => !prev);
    if (isAdmin) setIsAdmin(false);
  };

  const toggleAdmin = () => {
    setIsAdmin(prev => !prev);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, toggleLogin, toggleAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};