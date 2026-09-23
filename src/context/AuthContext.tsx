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
  isAdmin: boolean;
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
        // 1. Check if Supabase has an active session with a 1200ms timeout
        const supaPromise = supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 1200)
        );
        const { data } = await Promise.race([supaPromise, timeoutPromise]);

        if (data?.session?.user && isMounted) {
          const supaUser = data.session.user;
          const isUserAdmin =
            supaUser.email === 'radjaniokk@gmail.com' ||
            supaUser.email === 'demo@quitai.com.br' ||
            supaUser.user_metadata?.role === 'admin';

          const account: UserAccount = {
            id: supaUser.id,
            name: supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || 'Usuário',
            email: supaUser.email || '',
            role: isUserAdmin ? 'admin' : 'user',
            createdAt: supaUser.created_at || new Date().toISOString(),
          };
          setUser(account);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Supabase session check fallback:', err);
      }

      // 2. Check local session only if user previously logged in manually
      try {
        const hasManualLogin = localStorage.getItem('quitai_manual_login') === 'true';
        if (!hasManualLogin) {
          // Clear any stale auto-login from past visits so user sees login screen
          AuthStorageService.clearSession();
          if (isMounted) {
            setUser(null);
          }
          return;
        }

        const { session, isExpired } = AuthStorageService.getCurrentSession();
        if (isExpired) {
          if (isMounted) {
            setSessionExpired(true);
            setUser(null);
            localStorage.removeItem('quitai_manual_login');
          }
        } else if (session && isMounted) {
          const foundUser = AuthStorageService.findUserById(session.userId);
          if (foundUser) {
            const isUserAdmin =
              foundUser.email === 'radjaniokk@gmail.com' ||
              foundUser.email === 'demo@quitai.com.br' ||
              foundUser.role === 'admin';
            setUser({ ...foundUser, role: isUserAdmin ? 'admin' : 'user' });
            setIsLoading(false);
            return;
          } else {
            AuthStorageService.clearSession();
            localStorage.removeItem('quitai_manual_login');
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
        const isUserAdmin =
          session.user.email === 'radjaniokk@gmail.com' ||
          session.user.email === 'demo@quitai.com.br' ||
          session.user.user_metadata?.role === 'admin';

        const account: UserAccount = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email || '',
          role: isUserAdmin ? 'admin' : 'user',
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
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // 1. Try Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!error && data?.user) {
        const isUserAdmin =
          data.user.email === 'radjaniokk@gmail.com' ||
          data.user.email === 'demo@quitai.com.br' ||
          data.user.user_metadata?.role === 'admin';

        const loggedUser: UserAccount = {
          id: data.user.id,
          name: data.user.user_metadata?.name || normalizedEmail.split('@')[0],
          email: data.user.email || normalizedEmail,
          role: isUserAdmin ? 'admin' : 'user',
          createdAt: data.user.created_at,
        };
        localStorage.setItem('quitai_manual_login', 'true');
        setUser(loggedUser);
        setSessionExpired(false);
        setIsSupabaseOnline(true);
        return;
      }

      // 2. Demo shortcut fallback: allow test user if Supabase doesn't have it created yet
      if (normalizedEmail === 'demo@quitai.com.br' && password === 'Senha@123') {
        const { user: localUser } = await AuthStorageService.loginUser(normalizedEmail, password, rememberMe);
        localStorage.setItem('quitai_manual_login', 'true');
        setUser({ ...localUser, role: 'admin' });
        setSessionExpired(false);
        return;
      }

      // 3. Fallback to local storage user if registered locally
      try {
        const { user: localUser } = await AuthStorageService.loginUser(normalizedEmail, password, rememberMe);
        localStorage.setItem('quitai_manual_login', 'true');
        setUser(localUser);
        setSessionExpired(false);
        return;
      } catch {
        // Continue to throw specific error below
      }

      // 4. Translate Supabase error for the user
      if (error) {
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('invalid_credentials')
        ) {
          throw new Error('E-mail ou senha incorretos no Supabase. Se ainda não possui conta, cadastre-se ao lado.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Seu e-mail cadastrado no Supabase ainda não foi confirmado. Verifique sua caixa de entrada.');
        } else {
          throw new Error(`Falha no Supabase: ${error.message}`);
        }
      }

      throw new Error('Não foi possível entrar. Verifique seus dados.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register
  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // 1. Try Supabase Auth SignUp
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('Este e-mail já está cadastrado no Supabase. Faça login na sua conta.');
        }
        throw new Error(`Erro no Supabase: ${error.message}`);
      }

      if (data?.user) {
        const isUserAdmin =
          normalizedEmail === 'radjaniokk@gmail.com' ||
          normalizedEmail === 'demo@quitai.com.br';

        const newUser: UserAccount = {
          id: data.user.id,
          name: name.trim(),
          email: normalizedEmail,
          role: isUserAdmin ? 'admin' : 'user',
          createdAt: data.user.created_at || new Date().toISOString(),
        };

        // Also save local shadow for instant offline support
        try {
          await AuthStorageService.registerUser(name, normalizedEmail, password);
        } catch {
          // ignore if exists locally
        }

        localStorage.setItem('quitai_manual_login', 'true');
        setUser(newUser);
        setSessionExpired(false);
        setIsSupabaseOnline(true);
        return;
      }

      // 2. Fallback local user registration
      const { user: localNewUser } = await AuthStorageService.registerUser(name, normalizedEmail, password);
      localStorage.setItem('quitai_manual_login', 'true');
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
      console.warn('Supabase signOut error:', e);
    }
    localStorage.removeItem('quitai_manual_login');
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
    isAdmin: user?.email === 'radjaniokk@gmail.com' || user?.email === 'demo@quitai.com.br' || user?.role === 'admin',
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
