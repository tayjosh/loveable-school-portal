# AviHire School Portal

Partner-school portal for tracking students (onboarding, course progress,
attendance, jobs via the job bucket, exams and licenses).

Same stack as `avihire-frontend`: Next.js (App Router), TypeScript, Tailwind,
shadcn/Radix, React Query, axios, react-hook-form + zod. It talks to the same
AviHire backend API (`NEXT_PUBLIC_API_URL`) and only admits `SCHOOL_ADMIN` and
`CAMPUS_ADMIN` accounts.

## Run

    cp .env.example .env.local
    npm install
    npm run dev      # http://localhost:3001

Student signup links point at `https://avihire.co/join/<code>`.
