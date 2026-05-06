import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lg ring-1 ring-black/10">
      <span className="text-sm text-gray-700">New version available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
      >
        Reload
      </button>
    </div>
  )
}
