# CommentFlow

CommentFlow is a Next.js SaaS app for Facebook comment-to-Messenger DM automation. It supports connected pages, keyword triggers, multi-step DM flows, cooldowns, idempotent webhook handling, encrypted page tokens, analytics, logs, and conversation tracking.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run prisma:generate
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Use `.env.local` for local development and Render environment variables for production. Do not commit real secrets.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase PostgreSQL connection string used by the app |
| `DIRECT_URL` | Supabase direct connection string, kept for deployment/migration workflows |
| `META_APP_ID` | Meta app ID |
| `META_APP_SECRET` | Meta app secret, used for webhook signature validation and OAuth |
| `WEBHOOK_VERIFY_TOKEN` | Random token you create and also enter in Meta webhook settings |
| `ENCRYPTION_KEY` | Secret used for AES-256-GCM page token encryption |
| `NEXTAUTH_SECRET` | Secret used by NextAuth |
| `NEXTAUTH_URL` | App base URL, for example `https://commentflow.onrender.com` |

## Render Deployment

1. Push this `app/` directory to GitHub.
2. In Render, create a Blueprint from `render.yaml`, or create a Web Service manually.
3. Set the environment variables listed above in Render.
4. Deploy the service.
5. Verify `https://YOUR_RENDER_URL/api/health`.
6. Set `NEXTAUTH_URL` to the final Render or custom-domain URL.
7. In Meta App Dashboard, set the webhook callback URL to `https://YOUR_RENDER_URL/api/webhook`.
8. Enter the same `WEBHOOK_VERIFY_TOKEN` in Meta.

The Render build command is:

```bash
npm ci && npm run prisma:generate && npm run build
```

The Render start command is:

```bash
npm run start
```

## Database

The Prisma schema targets Supabase PostgreSQL. If you are using the existing Supabase database that was already synced with `prisma db push`, deploy first without running migrations automatically.

For a brand-new empty database, run:

```bash
npm run prisma:migrate:deploy
```

## Meta Credentials

Never put Meta credentials in code. Add them to `.env.local` locally and to Render environment variables in production:

- `META_APP_ID`
- `META_APP_SECRET`
- `WEBHOOK_VERIFY_TOKEN`

Facebook Page access tokens should be obtained through the built-in `/api/fb-oauth` flow. They are encrypted before being stored.
