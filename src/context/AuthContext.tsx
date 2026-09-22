/**
 * QuitaÍ — Contexto de Autenticação e Sessão de Usuário
 * Integrado com Supabase Auth (Projeto: ybdnhrtetahnvvtbapwm) + RLS
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserAccount } from '../types/auth';
import { AuthStorageService } from '../services/authStorage';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  dismissSessionExpired: () => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => { success: boolean; code: string; message: string };
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  updateName: (newName: string) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  isSupabaseOnline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(true);

  // Restore session from Supabase or Local Storage
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        // 1. Check if Supabase has an active session
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user && isMounted) {
          const supaUser = data.session.user;
          const account: UserAccount = {
            id: supaUser.id,
            name: supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || 'Usuário',
            email: supaUser.email || '',
            createdAt: supaUser.created_at || new Date().toISOString(),
          };
          setUser(account);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Supabase session check fallback:', err);
      }

      // 2. Fallback to local session check
      try {
        const { session, isExpired } = AuthStorageService.getCurrentSession();
        if (isExpired) {
          if (isMounted) {
            setSessionExpired(true);
            setUser(null);
          }
        } else if (session && isMounted) {
          const foundUser = AuthStorageService.findUserById(session.userId);
          if (foundUser) {
            setUser(foundUser);
          } else {
            AuthStorageService.clearSession();
            setUser(null);
          }
        }
      } catch (e) {
        console.error('Failed to restore auth session:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    // Supabase Auth State Change Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const account: UserAccount = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email || '',
          createdAt: session.user.created_at || new Date().toISOString(),
        };
        setUser(account);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Periodic session validity check
  useEffect(() => {
    const checkSession = () => {
      const { session, isExpired } = AuthStorageService.getCurrentSession();
      if (isExpired && !user?.id.includes('-')) {
        setSessionExpired(true);
        setUser(null);
      }
    };

    const interval = setInterval(checkSession, 60000);
    window.addEventListener('focus', checkSession);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkSession);
    };
  }, [user]);

  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true);
    try {
      // 1. Try Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user) {
        const loggedUser: UserAccount = {
          id: data.user.id,
          name: data.user.user_metadata?.name || email.split('@')[0],
          email: data.user.email || email,
          createdAt: data.user.created_at,
        };
        setUser(loggedUser);
        setSessionExpired(false);
        setIsSupabaseOnline(true);
        return;
      }

      // 2. If Supabase returned error or mock user, fallback to local storage authentication
      const { user: localUser } = await AuthStorageService.loginUser(email, password, rememberMe);
      setUser(localUser);
      setSessionExpired(false);
    } catch (err: any) {
      // Fallback
      const { user: localUser } = await AuthStorageService.loginUser(email, password, rememberMe);
      setUser(localUser);
      setSessionExpired(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register
  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // 1. Try Supabase Auth SignUp
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (!error && data?.user) {
        const newUser: UserAccount = {
          id: data.user.id,
          name,
          email,
          createdAt: data.user.created_at || new Date().toISOString(),
        };
        // Also save local shadow for instant offline support
        await AuthStorageService.registerUser(name, email, password);
        setUser(newUser);
        setSessionExpired(false);
        setIsSupabaseOnline(true);
        return;
      }

      // 2. Fallback local user registration
      const { user: localNewUser } = await AuthStorageService.registerUser(name, email, password);
      setUser(localNewUser);
      setSessionExpired(false);
    } catch (err: any) {
      const { user: localNewUser } = await AuthStorageService.registerUser(name, email, password);
      setUser(localNewUser);
      setSessionExpired(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    AuthStorageService.clearSession();
    setUser(null);
    setSessionExpired(false);
  }, []);

  // Password reset request
  const requestPasswordReset = useCallback((email: string) => {
    supabase.auth.resetPasswordForEmail(email).catch(() => {});
    return AuthStorageService.requestPasswordReset(email);
  }, []);

  // Password reset execution
  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await AuthStorageService.resetPassword(email, code, newPassword);
    try {
      await supabase.auth.updateUser({ password: newPassword });
    } catch (e) {
      // ignore
    }
  }, []);

  // Update profile name
  const updateName = useCallback((newName: string) => {
    if (!user) throw new Error('Nenhum usuário autenticado.');
    const updated = AuthStorageService.updateUserName(user.id, newName);
    setUser({ ...updated });
    supabase.auth.updateUser({ data: { name: newName } }).catch(() => {});
  }, [user]);

  // Change password
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('Nenhum usuário autenticado.');
    await AuthStorageService.updatePassword(user.id, currentPassword, newPassword);
    try {
      await supabase.auth.updateUser({ password: newPassword });
    } catch (e) {
      // ignore
    }
  }, [user]);

  // Delete account with cascade purge of all financial data
  const deleteAccount = useCallback(async () => {
    if (!user) throw new Error('Nenhum usuário autenticado.');
    const targetUserId = user.id;

    // 1. Purge remote data in Supabase
    await SupabaseService.purgeUserData(targetUserId);

    // 2. Purge local financial data associated with user
    StorageService.cascadeDeleteUserFinancialData(targetUserId);

    // 3. Remove user from registry and clear session
    AuthStorageService.deleteAccount(targetUserId);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    setUser(null);
    setSessionExpired(false);
  }, [user]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    sessionExpired,
    dismissSessionExpired,
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    updateName,
    changePassword,
    deleteAccount,
    isSupabaseOnline,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
