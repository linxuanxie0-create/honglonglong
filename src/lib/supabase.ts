import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// These values are baked into the Vite build. Log only their presence and the
// public project host so a deployed build can be diagnosed without exposing keys.
let projectHost: string | null = null
try {
  projectHost = supabaseUrl ? new URL(supabaseUrl).host : null
} catch {
  // Keep startup alive so a malformed URL is reported as configuration data.
}

console.info('[Supabase] client configuration', {
  configured: isSupabaseConfigured,
  urlPresent: Boolean(supabaseUrl),
  anonKeyPresent: Boolean(supabaseAnonKey),
  projectHost,
  pageHost: window.location.host,
})

export function logSupabaseError(stage: string, error: unknown) {
  const value = error as { name?: string; message?: string; code?: string; status?: number; details?: string; hint?: string } | null
  console.error(`[Supabase] ${stage} failed`, {
    name: value?.name,
    message: value?.message ?? String(error),
    code: value?.code,
    status: value?.status,
    details: value?.details,
    hint: value?.hint,
  })
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
