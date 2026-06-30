import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Gym } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  gym: Gym | null;
  isLoading: boolean;
  loginAs: (role: 'gym_owner' | 'super_admin', status?: 'approved' | 'pending' | 'suspended') => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpGym: (params: {
    email: string;
    password: string;
    gymName: string;
    ownerName: string;
    phone: string;
    country: string;
    currency: string;
  }) => Promise<{ error: string | null }>;
  logout: () => void;
  refreshUserStatus: () => Promise<any>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const userId = session.user.id;
          if (userId === "admin-1") {
            setUser(session.user);
            setGym(null);
          } else {
            const res = await fetch(`/api/auth/user-status?userId=${userId}`);
            if (res.ok) {
              const statusData = await res.json();
              setUser({
                ...session.user,
                status: statusData.status
              });
              setGym(statusData.gym);
            } else {
              setUser(session.user);
              setGym(session.gym || null);
            }
          }
        }
      } catch (e) {
        console.error("Error restoring session:", e);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const loginAs = async (role: 'gym_owner' | 'super_admin', status: 'approved' | 'pending' | 'suspended' = 'approved') => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, status })
      });
      const result = await res.json();
      if (res.ok && result.session) {
        localStorage.setItem('gymos_supabase_session', JSON.stringify(result.session));
        setUser(result.session.user);
        setGym(result.session.gym);
      }
    } catch (e) {
      console.error("Error doing demo login:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      return { error: error.message };
    }
    
    // Set user and gym state
    if (data.session) {
      setUser(data.session.user);
      setGym(data.session.gym || null);
    }
    setIsLoading(false);
    return { error: null };
  };

  const signUpGym = async (params: {
    email: string;
    password: string;
    gymName: string;
    ownerName: string;
    phone: string;
    country: string;
    currency: string;
  }) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          gymName: params.gymName,
          name: params.ownerName,
          phone: params.phone,
          country: params.country,
          currency: params.currency
        }
      }
    });

    if (error) {
      setIsLoading(false);
      return { error: error.message };
    }

    if (data.session) {
      setUser(data.session.user);
      setGym(data.session.gym || null);
    }
    setIsLoading(false);
    return { error: null };
  };

  const refreshUserStatus = async () => {
    if (!user || user.role === 'super_admin') return null;
    try {
      const res = await fetch(`/api/auth/user-status?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUser(prev => prev ? { ...prev, status: data.status } : null);
        setGym(data.gym);
        return data;
      }
    } catch (e) {
      console.warn("Could not refresh user status (server may be starting or offline):", e);
    }
    return null;
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setGym(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, gym, isLoading, loginAs, signIn, signUpGym, logout, refreshUserStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
