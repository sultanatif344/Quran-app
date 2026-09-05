// GitHub Pages has no SPA rewrite rule. Serving index.html as 404.html makes
// deep links such as /Quran-app/surah/2 load the app, which then routes client-side.
import { copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))
console.log('wrote dist/404.html')
