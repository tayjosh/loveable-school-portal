// Demo mode: the portal runs on built-in sample data with no Supabase and no
// login. For reviewing screens only. Off unless NEXT_PUBLIC_DEMO_MODE=true.
export const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
