import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example)",
  );
}

// Browser client. Safe: it only holds the public key; what a user can read or
// change is decided by the database's row-level security, not by this code.
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});
