/**
 * QuitaÍ — Supabase Client Configuration
 * Project: ybdnhrtetahnvvtbapwm
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ybdnhrtetahnvvtbapwm.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZG5ocnRldGFobnZ2dGJhcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDMzMTIsImV4cCI6MjEwNTY3OTMxMn0.ifYn3nxffebWgNycFJoMSfCjvgaY7rKjJ7g5hO2ecjs';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'quitai_supabase_auth_token',
  },
});
