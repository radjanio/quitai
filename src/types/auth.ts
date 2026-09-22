/**
 * QuitaÍ — Autenticação e Gestão de Usuários
 * Types and Interfaces for Authentication & User Accounts
 */

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  createdAt: string;
  lastLoginAt?: string;
  termsAcceptedAt?: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  expiresAt: number; // Timestamp em milissegundos
  rememberMe: boolean;
  createdAt: string;
}

export interface PasswordResetCode {
  id: string;
  email: string;
  code: string;
  expiresAt: number; // 15 minutos de validade
  used: boolean;
}

export interface AuthState {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
}
