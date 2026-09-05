import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { SURAH_START_JUZ } from './data/juzNames'
import { HomePage } from './pages/HomePage'
import { JuzPage } from './pages/JuzPage'
import { SettingsPage } from './pages/SettingsPage'
import { SettingsProvider } from './store/settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 6000),
      refetchOnWindowFocus: false,
    },
  },
})

/** Old /surah/:n links open the parah where that surah begins. */
function SurahRedirect() {
  const n = Number(useParams().number)
  if (!Number.isInteger(n) || n < 1 || n > 114) return <Navigate to="/" replace />
  return <Navigate to={`/juz/${SURAH_START_JUZ[n - 1]}?ayah=${n}:1`} replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/juz/:number" element={<JuzPage />} />
            <Route path="/surah/:number" element={<SurahRedirect />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </QueryClientProvider>
  )
}
