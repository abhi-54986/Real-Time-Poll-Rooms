# Real-Time Poll Rooms

A modern full-stack web application that lets anyone create a poll, share it via a link, and collect votes while results update in real time for all viewers. Features a sleek glassmorphism UI with smooth animations.

Built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Prisma**, **PostgreSQL**, and **Socket.io**.

---

## Features

- **Poll Creation** — Create polls with a question and 2–10 dynamic options
- **Shareable Links** — Every poll gets a unique UUID-based URL (`/poll/[id]`)
- **Single-Choice Voting** — Each viewer can vote for exactly one option
- **Real-Time Results** — Votes update instantly via Socket.io (with automatic polling fallback on serverless)
- **Anti-Abuse** — IP-based rate limiting + browser token deduplication
- **Persistence** — All data stored in PostgreSQL via Prisma ORM
- **Modern UI** — Glassmorphism design, ambient lighting, smooth animations, responsive layout

---

## Tech Stack

| Layer       | Technology                |
|-------------|---------------------------|
| Frontend    | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend     | Next.js API Routes (Pages Router) |
| ORM         | Prisma                    |
| Database    | PostgreSQL (Prisma Postgres / Neon / Supabase) |
| Real-Time   | Socket.io + polling fallback |
| Validation  | Zod                       |
| Deployment  | Vercel                    |

---

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout (nav, ambient background)
│   ├── page.tsx                # Home / hero page
│   ├── globals.css             # Global styles, glass-card, animations
│   ├── create/
│   │   └── page.tsx            # Poll creation page
│   └── poll/[id]/
│       ├── page.tsx            # Poll view (server component)
│       ├── loading.tsx         # Loading skeleton
│       └── not-found.tsx       # 404 page
├── components/
│   ├── CreatePollForm.tsx      # Poll creation form (client component)
│   └── PollView.tsx            # Poll voting + results (client component)
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── socket.ts               # Socket.io client helper
│   └── validation.ts           # Zod schemas
├── pages/api/
│   ├── createPoll.ts           # POST /api/createPoll
│   ├── vote.ts                 # POST /api/vote
│   ├── socket.ts               # Socket.io server init
│   └── poll/[id].ts            # GET /api/poll/:id (polling fallback)
├── prisma/
│   └── schema.prisma           # Database schema
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (hosted via [Prisma Postgres](https://www.prisma.io/postgres), [Neon](https://neon.tech), or [Supabase](https://supabase.com))

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd real-time-poll-rooms
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
IP_HASH_SALT="any-random-secret-string"
```

### 4. Set up the database

```bash
npx prisma db push
```

This creates the `Poll`, `Option`, and `Vote` tables in your PostgreSQL database.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment to Vercel

### 1. Push code to GitHub

### 2. Import project in Vercel

- Go to [vercel.com](https://vercel.com) → New Project → Import your repo

### 3. Set environment variables in Vercel dashboard

- `DATABASE_URL` — Your PostgreSQL connection string
- `IP_HASH_SALT` — A random secret string

### 4. Build settings

Vercel auto-detects Next.js. The `postinstall` script runs `prisma generate` automatically.

### 5. Real-time considerations

Socket.io requires persistent WebSocket connections which are not supported on Vercel's serverless functions. The app includes an **automatic polling fallback** that activates when Socket.io cannot establish a connection:

- **Local dev / WebSocket-capable hosts**: Full Socket.io real-time (instant updates)
- **Vercel (serverless)**: Polling fallback refreshes results every 3 seconds

The UI shows connection status: a green "Live" indicator when Socket.io is connected, or an amber "Polling" indicator when using the fallback.

For full real-time on production, consider:
- Deploying to a platform that supports WebSockets (Railway, Render, DigitalOcean App Platform)
- Using a managed WebSocket service (Ably, Pusher) as a replacement for Socket.io

---

## Anti-Abuse Mechanisms

### Mechanism 1: IP-Based Rate Limiting

- When a user votes, the server extracts their IP address from `x-forwarded-for` or `remoteAddress`
- The IP is hashed using **SHA-256** with a secret salt (`IP_HASH_SALT`) before storage — raw IPs are never stored
- A maximum of **5 votes per hashed IP per poll** is enforced
- **What it prevents**: One person spamming votes by clearing browser data (they can only do it 5 times per network)
- **Why rate limit instead of hard block**: Multiple legitimate users on the same Wi-Fi/corporate network share a public IP — a hard 1-per-IP block would prevent colleagues or family from all voting

### Mechanism 2: One Vote Per Browser (localStorage Token)

- On first visit, a random UUID is generated and stored in `localStorage` as the voter's token
- This token is sent with every vote request
- A unique constraint `(pollId, voterToken)` in the database prevents the same token from voting twice on the same poll
- **What it prevents**: Multiple votes from the same browser session, even if IP changes
- **Limitations**: Clearing localStorage or using incognito mode generates a new token, bypassing this check

### Combined Defence

Both mechanisms run independently on every vote request. A vote is accepted only if:
1. The hashed IP has fewer than 5 votes on that poll, **AND**
2. The voter token has not been used on that poll before

This layered approach makes it significantly harder (but not impossible) to abuse voting.

---

## Edge Cases Handled

| Edge Case | Handling |
|-----------|----------|
| **Poll not found** | Returns styled 404 page with link to create new poll |
| **Invalid UUID in URL** | Regex validation before DB query; returns 404 |
| **Empty question** | Rejected by Zod validation on both client and server |
| **Fewer than 2 options** | Zod enforces minimum of 2 options |
| **Duplicate option text** | Zod refine check (case-insensitive) rejects duplicates |
| **Multiple fast clicks** | Debounce ref prevents concurrent vote submissions; button disabled during request |
| **IP rate limit exceeded** | Returns 429 with user-friendly error message |
| **Already voted (token)** | Returns 409 with clear error message; syncs local state |
| **Race condition** | Prisma unique constraint violation caught and returns 409 |
| **Database failure** | try/catch wrappers return 500 with user-friendly message |
| **Socket.io unavailable** | Automatic polling fallback refreshes results every 3 seconds |
| **Invalid option for poll** | Backend validates option belongs to the specified poll |
| **Method not allowed** | API routes return 405 for non-supported HTTP methods |

---

## Known Limitations

1. **Vercel real-time**: Socket.io does not work on Vercel's serverless platform; the polling fallback is used instead (3-second delay)
2. **localStorage bypass**: Clearing browser data or using incognito mode generates a new voter token
3. **No authentication**: There is no user login system; anti-abuse relies on IP rate limiting + browser token only
4. **No poll expiration**: Polls live forever; there is no mechanism to close or archive them
5. **No edit/delete**: Poll creators cannot edit or delete their polls after creation
6. **No request-level rate limiting**: The API does not implement per-endpoint rate limiting (could be added via middleware)

---

## Future Improvements

- **User authentication** (OAuth / magic link) for verified one-vote-per-account
- **Poll expiration** with configurable close date
- **Request rate limiting** middleware to prevent API abuse
- **Poll management dashboard** for creators (edit, close, delete, view analytics)
- **Multiple choice polls** (vote for N of M options)
- **Rich results** with charts (Chart.js or Recharts)
- **Server-Sent Events (SSE)** as a Vercel-compatible real-time alternative
- **CAPTCHA integration** as a third anti-abuse mechanism
- **Redis adapter** for Socket.io to support horizontal scaling

---

## License

MIT
