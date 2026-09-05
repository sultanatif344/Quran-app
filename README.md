# قرآن مجید — Quran with Urdu translation

A calm, large-type Quran reader designed for elderly readers. Every ayah is shown with its
Arabic (Uthmani script) and an Urdu translation directly beneath it.

## Features

- Lafzi Tarjuma (word-by-word) layout modelled on the Anjuman Himayat-e-Islam print: for every
  ayah, the Arabic line, then a ruled row of boxes with each Arabic word above its Urdu meaning,
  then the running Urdu translation, all inside the printed-style frame
- Organised by parah (juz): the home screen lists the 30 parahs by their traditional names, and
  the reader shows one printed mushaf page at a time with parah, surah, and page number in the
  header. A surah list (with search) is one tap away and opens the parah where that surah begins
- Surah headers with a Bismillah row (with its own word boxes and translation) at every surah start
- Two Arabic scripts: Indo-Pak style in the PDMS Saleem QuranFont (default) or Uthmani in Amiri Quran.
  The PDMS font (Pakistan Data Management Services, 2007) is free for personal, non-commercial use
  and is self-hosted from `public/fonts/`.
- Adjustable text size (A− / A+), seven steps from 60% to 150%
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

## Data sources

Both are free and need no API key. Everything is fetched one parah at a time and cached in
IndexedDB, so a parah works offline after its first visit.

- **Quran.com API v4** (`https://api.quran.com/api/v4/verses/by_juz/{n}?language=ur&words=true`)
  for the Arabic text (Indo-Pak or Uthmani orthography) and the word-by-word Urdu meanings.
  Its Indo-Pak text carries private-use glyph codes for Quran.com's own font; `cleanArabic` in
  `src/api/quranCom.ts` strips them so the text renders in the PDMS font.
- **Al Quran Cloud** (`https://api.alquran.cloud/v1/juz/{n}/{edition}`) for the full-ayah Urdu
  translation in the chosen edition, plus the surah list.

## Project layout

```
src/
  api/        quranCom.ts (words + Arabic), alquran.ts (translations, surah list), juz.ts (combine per parah),
              editions.ts (Urdu editions), queries.ts (react-query hooks)
  store/      settings.tsx (font size, theme, script, edition), progress.ts (last read, bookmarks), offline.ts (IndexedDB)
  pages/      HomePage (parah / surah tabs), JuzPage (reader), SettingsPage
  components/ AppHeader, LafziPage (page + ayah blocks), GoToDialog, States
  data/       juzNames.ts (parah names, surah→parah map), surahNamesUrdu.ts (Urdu surah names, Urdu digits)
  styles/     theme.css (design tokens), global.css
```

## Deploying (GitHub Pages)

Live site: https://sultanatif344.github.io/Quran-app/

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the app and publishes
`dist/` to GitHub Pages. One-time setup in the repository: **Settings → Pages → Source: GitHub Actions**.

The build is configured for the `/Quran-app/` sub-path (`base` in `vite.config.ts`). The post-build
step copies `index.html` to `404.html` so deep links such as `/Quran-app/surah/2` work on Pages.
To build for a root domain instead, set `VITE_BASE=/` before `npm run build`.
