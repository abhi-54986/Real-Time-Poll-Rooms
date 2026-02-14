# Real-Time Poll Rooms

A full-stack web application that lets anyone create a poll, share it via a link, and collect votes while results update in real time for all viewers.

Built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Prisma**, **PostgreSQL**, and **Socket.io**.

---

## Features

- **Poll Creation** — Create polls with a question and 2–10 options
- **Shareable Links** — Every poll gets a unique UUID-based URL (`/poll/[id]`)
- **Single-Choice Voting** — Each viewer can vote for one option
- **Real-Time Results** — Votes update instantly via Socket.io (with polling fallback)
- **Anti-Abuse** — Two mechanisms to prevent duplicate/abusive voting
- **Persistence** — All data stored in PostgreSQL via Prisma ORM

---

## Tech Stack

| Layer       | Technology                |
|-------------|---------------------------|
| Frontend    | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend     | Next.js API Routes (Pages Router) |
| ORM         | Prisma                    |
| Database    | PostgreSQL (Neon / Supabase) |
| Real-Time   | Socket.io + polling fallback |
| Validation  | Zod                       |

---

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles
│   ├── create/
│   │   └── page.tsx            # Poll creation page
│   └── poll/[id]/
│       ├── page.tsx            # Poll view (server component)
│       ├── loading.tsx         # Loading skeleton
│       └── not-found.tsx       # 404 page
├── components/
│   ├── CreatePollForm.tsx      # Poll creation form
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
- PostgreSQL database (local or hosted via [Neon](https://neon.tech) / [Supabase](https://supabase.com))

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

This creates the tables in your PostgreSQL database.

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

- `DATABASE_URL` — Your Neon / Supabase PostgreSQL connection string
- `IP_HASH_SALT` — A random secret string

### 4. Build settings

Vercel auto-detects Next.js. The `postinstall` script runs `prisma generate` automatically.

### 5. Real-time considerations

Socket.io requires persistent WebSocket connections which are not supported on Vercel's serverless functions. The app includes a **polling fallback** that automatically activates when Socket.io cannot establish a connection:

- **Local dev / WebSocket-capable hosts**: Full Socket.io real-time (instant updates)
- **Vercel (serverless)**: Polling fallback refreshes results every 3 seconds

For full real-time on production, consider:
- Deploying to a platform that supports WebSockets (Railway, Render, DigitalOcean App Platform)
- Using a managed WebSocket service (Ably, Pusher) as a replacement for Socket.io
- Running a separate Socket.io server on Railway/Render alongside the Vercel frontend

---

## Anti-Abuse Mechanisms

### Mechanism 1: One Vote Per IP (Hashed)

- When a user votes, the server extracts their IP address from `x-forwarded-for` or `remoteAddress`
- The IP is hashed using **SHA-256** with a secret salt (`IP_HASH_SALT`) before storage
- A unique constraint `(pollId, ipHash)` prevents the same IP from voting twice on the same poll
- **What it prevents**: Multiple votes from the same network/device
- **Limitations**: Users behind the same NAT/VPN share an IP and would be blocked; IP can change with VPN switching

### Mechanism 2: One Vote Per Browser (localStorage Token)

- On first visit, a random UUID is generated and stored in `localStorage` as the voter's token
- This token is sent with every vote request
- A unique constraint `(pollId, voterToken)` prevents the same token from voting twice on the same poll
- **What it prevents**: Multiple votes from the same browser session even if IP changes
- **Limitations**: Clearing localStorage or using incognito mode generates a new token, bypassing this check

### Combined defence

Both mechanisms run independently. A vote is only accepted if **neither** the IP hash **nor** the voter token has been seen before for that poll. This makes it significantly harder (but not impossible) to vote twice.

---

## Edge Cases Handled

| Edge Case | Handling |
|-----------|----------|
| **Poll not found** | Returns 404 page with link to create new poll |
| **Invalid UUID in URL** | Regex validation before DB query; returns 404 |
| **Empty question** | Rejected by Zod validation on both client and server |
| **Fewer than 2 options** | Zod enforces minimum of 2 options |
| **Duplicate option text** | Zod refine check (case-insensitive) rejects duplicates |
| **Multiple fast clicks** | Debounce ref prevents concurrent vote submissions; button disabled during request |
| **Already voted (IP)** | Returns 409 with clear error message |
| **Already voted (token)** | Returns 409 with clear error message |
| **Race condition (concurrent votes)** | Prisma unique constraint violation caught and returns 409 |
| **Database failure** | try/catch wrappers return 500 with user-friendly message |
| **Socket.io unavailable** | Automatic polling fallback refreshes results every 3 seconds |
| **Invalid option for poll** | Backend validates option belongs to the specified poll |
| **Method not allowed** | API routes return 405 for non-supported HTTP methods |

---

## Known Limitations

1. **Vercel real-time**: Socket.io does not work on Vercel's serverless platform; the polling fallback is used instead (3-second delay)
2. **IP-based blocking**: Users behind the same NAT/corporate network share an IP — only one of them can vote
3. **localStorage bypass**: Clearing browser data or using incognito mode generates a new voter token
4. **No authentication**: There is no user login system; anti-abuse relies on IP + browser token only
5. **No poll expiration**: Polls live forever; there is no mechanism to close or archive them
6. **No rate limiting**: The API does not implement request-rate limiting (could be added via middleware)
7. **No edit/delete**: Poll creators cannot edit or delete their polls after creation

---

## Future Improvements

- **User authentication** (OAuth / magic link) for verified one-vote-per-account
- **Poll expiration** with configurable close date
- **Rate limiting** middleware to prevent API abuse
- **Poll management dashboard** for creators (edit, close, delete, view analytics)
- **Multiple choice polls** (vote for N of M options)
- **Rich results** with charts (Chart.js or Recharts)
- **Webhook notifications** when a poll reaches a vote threshold
- **Server-Sent Events (SSE)** as a Vercel-compatible real-time alternative
- **Redis adapter** for Socket.io to support horizontal scaling
- **CAPTCHA integration** as a third anti-abuse mechanism

---

## License

MIT
