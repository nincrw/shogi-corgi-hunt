# Find the Shogi Corgi

A mobile, landscape hidden-object game built for the Shopee Leadership Hackathon. Tap all 15 hidden
Shogi Corgi mascots in a scene as fast as you can — clearing a scene instantly generates a new one, and
the game keeps going until a continuous 3-minute timer runs out. Final score is submitted with a
username to a Supabase-backed leaderboard.

See `CLAUDE.md` for architecture notes and `STACK.md` for the shared hackathon stack.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project URL + service role key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For the real mobile/landscape experience, open it
on a phone (or Chrome DevTools device toolbar in landscape).

## Database

Run `supabase/schema.sql` against your Supabase project (SQL editor or `supabase db push`) to create the
`scores` table.

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint
```
