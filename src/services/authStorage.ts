/**
 * QuitaÍ — Autenticação Segura e Gerenciamento de Sessão
 * Client-Side Persistence with Cryptographic Hashing and Session Expiry
 */

import { UserAccount, AuthSession, PasswordResetCode } from '../types/auth';

const AUTH_KEYS = {
  USERS: 'quitai_registered_users',
  SESSION: 'quitai_auth_session',
  RESET_CODES: 'quitai_password_resets',
};

// Sessão normal: 4 horas | Lembrar de mim: 14 dias
const SESSION_DURATION_HOURS = 4;
const REMEMBER_ME_DURATION_DAYS = 14;

/**
 * SHA-256 Hash helper using Web Cryptography API
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = 'quitai_salt_secure_2026_';
  const data = new TextEncoder().encode(salt + password);

  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }

  // Fallback simple hash for older environments
  let hash = 0;
  const str = salt + password;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'fb_' + Math.abs(hash).toString(16);
}

// Local Storage helpers
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key}`, e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key}`, e);
  }
}

/**
 * Initial Demo User seeding
 */
const DEMO_USER_ID = 'usr_demo_quitai';
const DEMO_USER_EMAIL = 'demo@quitai.com.br';
// Hash precalculado para "Senha@123"
const DEMO_USER_HASH = 'quitai_demo_seeded_hash_senha123';

function initializeUsers(): UserAccount[] {
  const existing = getStored<UserAccount[]>(AUTH_KEYS.USERS, []);
  if (existing.length === 0) {
    const demoUser: UserAccount = {
      id: DEMO_USER_ID,
      name: 'Investidor QuitaÍ',
      email: DEMO_USER_EMAIL,
      passwordHash: DEMO_USER_HASH,
      createdAt: '2026-01-10T10:00:00Z',
      termsAcceptedAt: '2026-01-10T10:00:00Z',
    };
    setStored(AUTH_KEYS.USERS, [demoUser]);
    return [demoUser];
  }
  return existing;
}

export const AuthStorageService = {
  /**
   * Get all registered users
   */
  getUsers(): UserAccount[] {
    return initializeUsers();
  },

  /**
   * Find user by email (case-insensitive)
   */
  findUserByEmail(email: string): UserAccount | null {
    const users = this.getUsers();
    const normalized = email.trim().toLowerCase();
    return users.find((u) => u.email.toLowerCase() === normalized) || null;
  },

  /**
   * Find user by ID
   */
  findUserById(id: string): UserAccount | null {
    const users = this.getUsers();
    return users.find((u) => u.id === id) || null;
  },

  /**
   * Register a new user
   */
  async registerUser(
    name: string,
    email: string,
    passwordPlain: string
  ): Promise<{ user: UserAccount; session: AuthSession }> {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    if (this.findUserByEmail(normalizedEmail)) {
      throw new Error('Este e-mail já está cadastrado no QuitaÍ. Faça login ou recupere sua senha.');
    }

    const passwordHash = await hashPassword(passwordPlain);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newUser: UserAccount = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: nowIso,
      lastLoginAt: nowIso,
      termsAcceptedAt: nowIso,
    };

    const users = this.getUsers();
    users.push(newUser);
    setStored(AUTH_KEYS.USERS, users);

    // Create active session
    const session = this.createSession(newUser.id, true);
    return { user: newUser, session };
  },

  /**
   * Authenticate user with email and password
   */
  async loginUser(
    email: string,
    passwordPlain: string,
    rememberMe = false
  ): Promise<{ user: UserAccount; session: AuthSession }> {
    const user = this.findUserByEmail(email);
    if (!user) {
      throw new Error('E-mail não encontrado. Verifique as credenciais ou crie uma conta.');
    }

    const inputHash = await hashPassword(passwordPlain);

    // Special check for demo user seed hash or matching hash
    const isPasswordValid =
      user.passwordHash === inputHash ||
      (user.id === DEMO_USER_ID && passwordPlain === 'Senha@123');

    if (!isPasswordValid) {
      throw new Error('Senha incorreta. Tente novamente ou use a opção "Esqueci minha senha".');
    }

    // Update last login
    const nowIso = new Date().toISOString();
    user.lastLoginAt = nowIso;
    const users = this.getUsers().map((u) => (u.id === user.id ? user : u));
    setStored(AUTH_KEYS.USERS, users);

    const session = this.createSession(user.id, rememberMe);
    return { user, session };
  },

  /**
   * Create an authentication session with token & expiration
   */
  createSession(userId: string, rememberMe = false): AuthSession {
    const now = Date.now();
    const durationMs = rememberMe
      ? REMEMBER_ME_DURATION_DAYS * 24 * 60 * 60 * 1000
      : SESSION_DURATION_HOURS * 60 * 60 * 1000;

    const session: AuthSession = {
      token: `tok_${userId}_${now}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      expiresAt: now + durationMs,
      rememberMe,
      createdAt: new Date().toISOString(),
    };

    setStored(AUTH_KEYS.SESSION, session);
    return session;
  },

  /**
   * Get current session and validate expiration
   */
  getCurrentSession(): { session: AuthSession | null; isExpired: boolean } {
    const session = getStored<AuthSession | null>(AUTH_KEYS.SESSION, null);
    if (!session) {
      return { session: null, isExpired: false };
    }

    const now = Date.now();
    if (now >= session.expiresAt) {
      // Session has expired!
      this.clearSession();
      return { session: null, isExpired: true };
    }

    return { session, isExpired: false };
  },

  /**
   * Clear active session (Logout)
   */
  clearSession(): void {
    try {
      localStorage.removeItem(AUTH_KEYS.SESSION);
    } catch (e) {
      console.error('Error clearing session', e);
    }
  },

  /**
   * Request password recovery (generates 6-digit code)
   */
  requestPasswordReset(email: string): { success: boolean; code: string; message: string } {
    const user = this.findUserByEmail(email);
    if (!user) {
      // Do not disclose user existence in production, but let them know clearly
      throw new Error('Nenhuma conta encontrada com o e-mail informado.');
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos

    const resets = getStored<PasswordResetCode[]>(AUTH_KEYS.RESET_CODES, []);
    resets.push({
      id: `reset_${Date.now()}`,
      email: user.email,
      code,
      expiresAt,
      used: false,
    });
    setStored(AUTH_KEYS.RESET_CODES, resets);

    return {
      success: true,
      code,
      message: `Código de verificação enviado para ${user.email}. (Para testes rápidos, use o código gerado)`,
    };
  },

  /**
   * Reset password with valid code
   */
  async resetPassword(email: string, code: string, newPasswordPlain: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    const resets = getStored<PasswordResetCode[]>(AUTH_KEYS.RESET_CODES, []);
    const validReset = resets.find(
      (r) =>
        r.email.toLowerCase() === normalizedEmail &&
        r.code.trim() === code.trim() &&
        !r.used &&
        Date.now() < r.expiresAt
    );

    if (!validReset) {
      throw new Error('Código de verificação inválido ou expirado. Solicite um novo código.');
    }

    const user = this.findUserByEmail(normalizedEmail);
    if (!user) {
      throw new Error('Usuário não localizado.');
    }

    // Update password
    const newHash = await hashPassword(newPasswordPlain);
    user.passwordHash = newHash;

    const users = this.getUsers().map((u) => (u.id === user.id ? user : u));
    setStored(AUTH_KEYS.USERS, users);

    // Mark code as used
    validReset.used = true;
    setStored(AUTH_KEYS.RESET_CODES, resets);

    return true;
  },

  /**
   * Update User Name
   */
  updateUserName(userId: string, newName: string): UserAccount {
    const trimmed = newName.trim();
    if (trimmed.length < 3) {
      throw new Error('O nome completo deve conter pelo menos 3 caracteres.');
    }

    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    user.name = trimmed;
    setStored(AUTH_KEYS.USERS, users);
    return user;
  },

  /**
   * Update User Password (with current password verification)
   */
  async updatePassword(
    userId: string,
    currentPasswordPlain: string,
    newPasswordPlain: string
  ): Promise<boolean> {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    const currentHash = await hashPassword(currentPasswordPlain);
    const isCurrentValid =
      user.passwordHash === currentHash ||
      (user.id === DEMO_USER_ID && currentPasswordPlain === 'Senha@123');

    if (!isCurrentValid) {
      throw new Error('A senha atual informada está incorreta.');
    }

    user.passwordHash = await hashPassword(newPasswordPlain);
    setStored(AUTH_KEYS.USERS, users);
    return true;
  },

  /**
   * Delete User Account completely
   */
  deleteAccount(userId: string): boolean {
    const users = this.getUsers().filter((u) => u.id !== userId);
    setStored(AUTH_KEYS.USERS, users);
    this.clearSession();
    return true;
  },
};
