# EduPulse AI — EdTech Level 2

An end-to-end Next.js student engagement, quiz assessment and analytics application built around the ARIA brief and quiz-video rubric.

## Installation

1. Copy this ZIP's files into your existing Next.js project folder (overwrite matching starter files).
2. Run `npm install`.
3. Create a Supabase project at supabase.com. In its SQL Editor, run `supabase/migrations/001_init.sql` **once**. This creates the tables, row-level security policies, seed courses and quizzes, and atomic attempt-save function.
4. Copy `.env.example` to `.env.local`. Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase Publishable/anon key), and `SUPABASE_SERVICE_ROLE_KEY` (Supabase secret/service-role key). Optionally set `OPENAI_API_KEY` for AI-generated recommendations. **Never commit `.env.local` or expose the service-role key.**
5. In Supabase Authentication settings, configure email sign-in and your development/production site URLs. If email confirmation is enabled, verify your account before signing in.
6. Run `npm run dev`, open http://localhost:3000, create an account, sign in, enroll in a course, start/end a learning session, take a quiz, review wrong answers, retake, and view history/insights.
7. Run `npm test` and `npm run build`.
8. Push to GitHub and deploy on Vercel. Add the same environment variables in Vercel project settings; configure Supabase Auth redirect/site URLs for your deployed domain. Check live login, database writes, and quiz history.

## Architecture

- `src/app/page.js`: responsive client UI, sign-in, courses, analytics, quizzes, history, AI insights.
- `src/app/api/dashboard`: user-scoped activity data.
- `src/app/api/quiz`: quizzes without correct answers.
- `src/app/api/attempts`: server-scored submissions and immutable historical review.
- `src/app/api/sessions`: enrollment, progress and learning-session tracking.
- `src/app/api/insights`: transparent engagement indicator, deterministic tips and optional OpenAI output.
- `src/lib/scoring.mjs`: testable score and review snapshot calculation.
- `supabase/migrations/001_init.sql`: schema, constraints, RLS and atomic database writes.

## Notes and limitations

- The supplied questions are **sample course content**, not real student results. New accounts start with empty analytics.
- Dropout risk is an **illustrative engagement heuristic**, not a validated predictive model. AI recommendations use aggregate activity and avoid sensitive data.
- Learning progress is manually incremented in 10% steps as a simple prototype; it is not inferred from quiz performance.
- An active session's UI state is not persisted across a full page refresh, though its open database record remains. For a production release, add session-resumption and stale-session recovery.
- Quiz answer drafts are saved locally per account/quiz; the authoritative score and historical attempts are stored on the server. If the user submits and the network response is lost, a manual resubmission currently uses a new submission ID. The database function supports idempotency for repeated identical IDs, but a production version should persist the pending submission ID client-side until the result is confirmed.
- The example content contains two short quizzes. Add richer question banks for a complete client deployment.
- API routes verify the Supabase user token; service-role access is server-only. Database writes happen via server routes. Keep credentials secret.
- The current code is a functional MVP that **requires Supabase configuration and end-to-end verification**. It has not been validated against the private Finlatics grading engine.
