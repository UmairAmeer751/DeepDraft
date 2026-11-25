import { useEffect } from 'react'

/**
 * Toast notification — auto-dismisses after 4 seconds.
 * type: 'success' | 'error' | 'info'
 */
export default function Toast({ type = 'info', message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  const styles = {
    success: 'bg-emerald-900/80 border-emerald-700 text-emerald-200',
    error: 'bg-red-950/80 border-red-800 text-red-200',
    info: 'bg-gray-800/90 border-gray-700 text-gray-200',
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ' }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur max-w-sm ${styles[type]}`}>
        <span className="font-bold text-sm shrink-0">{icons[type]}</span>
        <p className="text-sm">{message}</p>
        <button
          onClick={onClose}
          className="ml-auto text-current opacity-50 hover:opacity-100 shrink-0"
        >
          ×
        </button>
      </div>
    </div>
  )
}
