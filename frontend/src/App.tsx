import { uk } from './i18n/uk'

export function App() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">{uk.appName}</h1>
        <p className="mt-2 text-gray-600">{uk.tagline}</p>
      </div>
    </main>
  )
}
