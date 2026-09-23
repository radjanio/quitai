/**
 * QuitaÍ — Supabase Client Configuration
 * Resilient to reversed, malformed or token-as-URL configurations
 * Project: ybdnhrtetahnvvtbapwm
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_PROJECT_REF = 'ybdnhrtetahnvvtbapwm';
const DEFAULT_SUPABASE_URL = `https://${DEFAULT_PROJECT_REF}.supabase.co`;
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZG5ocnRldGFobnZ2dGJhcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDMzMTIsImV4cCI6MjEwNTY3OTMxMn0.ifYn3nxffebWgNycFJoMSfCjvgaY7rKjJ7g5hO2ecjs';

/**
 * Safely extracts the Supabase project reference from a JWT anon key
 */
function extractProjectRefFromJwt(token?: string): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      if (payload && payload.ref && typeof payload.ref === 'string') {
        return payload.ref;
      }
    }
  } catch {
    // ignore parsing errors
  }
  return null;
}

/**
 * Resolves and sanitizes Supabase URL & Key to guarantee no unhandled crashes
 */
function resolveSupabaseConfig(): { url: string; key: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  let resolvedUrl = envUrl;
  let resolvedKey = envKey;

  // Case 1: URL was provided as the JWT anon key and Key was provided as the URL
  if (resolvedUrl.startsWith('eyJ') && !resolvedKey.startsWith('eyJ')) {
    const temp = resolvedUrl;
    resolvedUrl = resolvedKey;
    resolvedKey = temp;
  }

  // Case 2: URL was provided as a publishable key like 'sb_publishable_...'
  if (resolvedUrl.startsWith('sb_publishable_') || !resolvedUrl.startsWith('http')) {
    // If key is empty or also not a JWT, maybe resolvedUrl was meant to be the key
    if (!resolvedKey) {
      resolvedKey = resolvedUrl;
    }
    // Correct URL using the project ref from the JWT key or default
    const ref = extractProjectRefFromJwt(resolvedKey) || DEFAULT_PROJECT_REF;
    resolvedUrl = `https://${ref}.supabase.co`;
  }

  // Case 3: Key is missing or invalid
  if (!resolvedKey) {
    resolvedKey = DEFAULT_ANON_KEY;
  }

  // Case 4: URL is missing or doesn't start with https://
  if (!resolvedUrl || !resolvedUrl.startsWith('http')) {
    const ref = extractProjectRefFromJwt(resolvedKey) || DEFAULT_PROJECT_REF;
    resolvedUrl = `https://${ref}.supabase.co`;
  }

  // Ensure no trailing slash
  resolvedUrl = resolvedUrl.replace(/\/+$/, '');

  return { url: resolvedUrl, key: resolvedKey };
}

const { url: SANITIZED_URL, key: SANITIZED_KEY } = resolveSupabaseConfig();

export const SUPABASE_URL = SANITIZED_URL;
export const SUPABASE_ANON_KEY = SANITIZED_KEY;
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function buildSupabaseClient(): SupabaseClient {
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'quitai_supabase_auth_token',
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client with config:', SUPABASE_URL, err);
    // Fallback safe client with default URL so application never white-screens
    return createClient(DEFAULT_SUPABASE_URL, DEFAULT_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'quitai_supabase_auth_token',
      },
    });
  }
}

export const supabase = buildSupabaseClient();
