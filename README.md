# AviHire School Portal

Standalone partner-school product for tracking students: onboarding, course
progress, attendance, exams/licenses, and sending jobs to students' AviHire
job buckets. It has its own Supabase project (database + staff login) and is
**not** connected to the main avihire.co site except for the "send job" call.

Stack matches `avihire-frontend`: Next.js (App Router), TypeScript, Tailwind,
shadcn/Radix, React Query, react-hook-form + zod. Added: `@supabase/supabase-js`.

## Setup

1. Create a Supabase project, run `supabase/migrations/0001_init.sql` in its SQL Editor.
2. `cp .env.example .env.local` and fill in the URL and **publishable** key
   (never the secret/service_role key).
3. `npm install && npm run dev` (http://localhost:3001)

## Security model

Every table has row-level security: a signed-in staff member can only read or
change rows for their own school, enforced by the database, not the UI.
