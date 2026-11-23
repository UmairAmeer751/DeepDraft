export default function ErrorCard({ message, onRetry }) {
  return (
    <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 flex items-start gap-3">
      <span className="text-red-400 text-lg shrink-0">⚠</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-300 font-medium mb-1">Something went wrong</p>
        <p className="text-xs text-red-400/80 break-words">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 text-xs px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 text-red-300 border border-red-800/50 rounded-lg transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}
