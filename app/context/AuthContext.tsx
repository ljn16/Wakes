"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from '../lib/supabaseClient';

type AuthContextType = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: any;
  role: string | null;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setUser(session.user);
        fetchRole(session.user.id);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setUser(session.user);
        fetchRole(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRole = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (data) {
      setRole(data.role);
      setIsAdmin(data.role === 'admin');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, user, role, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};