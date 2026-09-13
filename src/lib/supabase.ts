import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(url && supabaseKey);

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase is not configured. Copy .env.example to .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_KEY.",
  );
}

export const supabase = createClient(url ?? "http://localhost", supabaseKey ?? "public-anon-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
