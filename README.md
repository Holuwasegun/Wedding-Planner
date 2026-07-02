# codeshakers — Wedding Planner

A branded digital wedding planning app with a persistent database, sidebar navigation, mobile responsiveness, and Gemini AI integration.

## Features

- **Onboarding wizard** — Enter couple names, wedding date, and budget to get started
- **Dashboard** — Countdown timer, summary cards (days left, tasks done, budget remaining, expenses)
- **Milestones checklist** — 4 phases (6+ months, 3 months, 1 month, wedding week) with collapsible sections, add/delete/check off tasks
- **Budget ledger** — Track expenses with NGN formatting, see spent/remaining at a glance
- **ZenAI chat** — Real Gemini 2.0 Flash AI consultant with full wedding context (couple names, date, budget, task progress)
- **Settings modal** — Edit wedding details anytime
- **Persistent storage** — localStorage + Supabase PostgreSQL via Vercel serverless API
- **Mobile responsive** — Collapsible sidebar, stacked grids, touch-friendly targets (44px min-height)
- **Logout** — Session reset with data preserved

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS, CSS (no framework) |
| Styling | CSS custom properties (design tokens), DM Sans / Playfair Display fonts |
| Database | Supabase (PostgreSQL) |
| Serverless API | Vercel Node.js functions (`/api/*`) |
| AI | Google Gemini 2.0 Flash |
| Deployment | Vercel |

## Project Structure

```
.
├── index.html            # Main HTML — onboarding, sidebar, dashboard, modals, chat
├── style.css             # Full design system + responsive breakpoints
├── script.js             # App logic — state, checklist, budget, chat, persistence
├── api/
│   ├── data.js           # CRUD serverless function (Supabase wedding_plans table)
│   └── chat.js           # Gemini AI proxy serverless function
├── supabase-schema.sql   # PostgreSQL schema for Supabase
├── package.json          # @supabase/supabase-js dependency
├── vercel.json           # Vercel deployment configuration
├── .env.example          # Required environment variables template
├── .env                  # Local environment variables (gitignored)
└── .gitignore
```

## Setup

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Vercel account](https://vercel.com)
- [Supabase account](https://supabase.com) (free tier)
- [Gemini API key](https://aistudio.google.com/apikey)

### 1. Supabase Database

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open **SQL Editor**, paste `supabase-schema.sql`, and run it
3. Go to **Project Settings → API** and copy:
   - **Project URL** (e.g. `https://xxx.supabase.co`)
   - **anon public key**

### 2. Environment Variables

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Local Development

This is a static HTML/CSS/JS app — no build step required. Serve it locally:

```bash
npx serve .
```

Or open `index.html` directly in a browser (API calls will fail without the serverless functions — localStorage still works).

### 4. Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Set the environment variables in the Vercel dashboard (or use `vercel env add`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

## API Endpoints

### `GET /api/data?client_id=<id>`
Fetch wedding plan data. Returns `{ data: { onboarding, checklist, budget } }` or `{ data: null }`.

### `PUT /api/data?client_id=<id>`
Save wedding plan data. Body: `{ wedding_data: { onboarding, checklist, budget } }`.

### `DELETE /api/data?client_id=<id>`
Delete wedding plan data.

### `POST /api/chat`
Send a message to ZenAI. Body:

```json
{
  "message": "string",
  "context": {
    "partner1": "string",
    "partner2": "string",
    "weddingDate": "YYYY-MM-DD",
    "budget": 500000,
    "tasksDone": 3,
    "tasksTotal": 23,
    "budgetSpent": 150000,
    "budgetRemaining": 350000
  }
}
```

Returns `{ reply: "string" }`.

## Database Schema

```sql
CREATE TABLE wedding_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Row Level Security is enabled with an anonymous access policy for simplicity.

## Design Tokens

The colour system is sourced from `design-tokens.tokens.json` (Figma export). Primary palette:

| Token | Hex |
|-------|-----|
| Primary30 | `#0D358C` |
| Primary40 | `#1146BB` |
| Primary50 | `#1558EA` |
| Primary80 | `#A1BCF7` |
| Primary90 | `#DAE4FC` |

## Browser Support

- Chrome/Edge 90+
- Firefox 90+
- Safari 15+
- iOS Safari 15+
- Android Chrome 90+

## Licence

MIT
