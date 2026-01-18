
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('INSERT_YOUR');

if (!isConfigured) {
    console.warn('Supabase keys are missing! Check your .env file.');
}

// Hardcoded fallbacks to ensure build works even if .env is missed
const FALLBACK_URL = 'https://qylehpuzpcftfzslktrz.supabase.co';
const FALLBACK_KEY = 'sb_publishable_pwBVXgI4YMCsmbpvOmIlOw_tpPtoCmD';

export const isBackendConfigured = true;
export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY
);
