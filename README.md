# قرآن مجید — Quran with Urdu translation

A calm, large-type Quran reader designed for elderly readers. Every ayah is shown with its
Arabic (Uthmani script) and an Urdu translation directly beneath it.

## Features

- Ayah-by-ayah Arabic + Urdu (Nastaliq script), with adjustable text size (A− / A+)
- Chestnut-brown day theme and a warm night theme
- Surah list with search by number, Arabic, English or Urdu name
- "Continue reading" card that remembers the last ayah you were looking at
- Bookmarks, and a "go to ayah" dialog
- Six selectable Urdu translations by Ahl-e-Sunnat scholars (default: Maududi, Tafheem-ul-Quran)
- Installable PWA; any surah you have opened once can be read offline

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build (service worker is active here)
```

Regenerate the PWA icons (pure Node, no dependencies):

```bash
node scripts/make-icons.mjs
```

## Data source

Text and translations come from the free, key-less **Al Quran Cloud** API
(`https://api.alquran.cloud/v1`). One request per surah fetches the Arabic
`quran-uthmani` edition and the chosen Urdu edition together.

Note: the API prepends the Bismillah to ayah 1 of every surah except 1 and 9. The app strips it
(see `stripBismillah` in `src/api/alquran.ts`) and renders it once as a header.

A documented fallback, not wired in, is the Quran.com API v4 (`https://api.quran.com/api/v4`),
where the Jalandhari translation has id 234.

## Project layout

```
src/
  api/        alquran.ts (fetch + types), editions.ts (Urdu editions), queries.ts (react-query hooks)
  store/      settings.tsx (font size, theme, edition), progress.ts (last read, bookmarks), offline.ts (IndexedDB)
  pages/      HomePage, SurahPage, SettingsPage
  components/ AppHeader, AyahCard, GoToAyahDialog, States
  data/       surahNamesUrdu.ts (Urdu surah names + Urdu digits helper)
  styles/     theme.css (design tokens), global.css
```

## Deploying (GitHub Pages)

Live site: https://sultanatif344.github.io/Quran-app/

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the app and publishes
`dist/` to GitHub Pages. One-time setup in the repository: **Settings → Pages → Source: GitHub Actions**.

The build is configured for the `/Quran-app/` sub-path (`base` in `vite.config.ts`). The post-build
step copies `index.html` to `404.html` so deep links such as `/Quran-app/surah/2` work on Pages.
To build for a root domain instead, set `VITE_BASE=/` before `npm run build`.
