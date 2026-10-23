# Stash — save it for later

A personal save-for-later queue: collect videos and articles you want to watch
or read, organize them in categories, check them off when done, and see your
progress add up everywhere.

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** + **lucide-react** + **framer-motion**
- Data lives in your browser (`localStorage`) — no accounts, no database
- Pasting a URL auto-fetches title, description, favicon, and thumbnail via the
  `/api/metadata` serverless route (with YouTube/Vimeo detection and embeds)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then click **Add sample
data** on the empty screen to explore the app instantly.

## Features

- Categories with per-category progress (`3/8 watched`) and one-click
  create/rename/delete (with color swatches)
- Add a link: paste URL → metadata is fetched and previewed live → editable
  title/description → pick category → save; falls back to manual entry when a
  page can’t be fetched
- Checkbox marks an item done; per-category bars and the overall count/percent
  update immediately
- Search + `All / To watch / Done` filters, delete with **Undo** toast
- Light and dark mode, mobile drawer navigation, empty and loading states
  throughout

## Deploy to Vercel

No environment variables or setup needed — the app works on the free Hobby
plan.

```bash
# Option 1 — CLI
npm i -g vercel
vercel        # preview
vercel --prod # production

# Option 2 — Git
# push this folder to GitHub, then import it at https://vercel.com/new
```

> Note: your stash is stored per browser. Since data is on-device, the deployed
> app keeps each browser’s data separate.
