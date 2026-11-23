/**
 * ScoreBreakdown — U6
 * Shows the brand consistency score with an ALWAYS-VISIBLE experimental label.
 * Never hide or soften the experimental label.
 */
export default function ScoreBreakdown({ score }) {
  const { total, status, dimensions = [] } = score

  return (
    <div className="p-4 bg-gray-900/80" data-testid="score-breakdown">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div>
          <span className="text-2xl font-bold text-white">{total}</span>
          <span className="text-gray-500 text-sm"> / 100</span>
        </div>
        {/* Experimental badge — ALWAYS shown, never hidden */}
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-900/50 text-amber-400 border border-amber-700/50"
          data-testid="experimental-label"
        >
          ⚠ Experimental — not validated
        </span>
      </div>

      {/* Info text */}
      <p className="text-xs text-gray-500 mb-4 leading-relaxed max-w-lg">
        Preliminary rubric score. It checks DeepDraft's rules and similarity to your example posts.
        It has <strong className="text-gray-400">not yet been validated against human judgement</strong>.
      </p>

      {/* Dimension bars */}
      <div className="space-y-3">
        {dimensions.map((dim) => {
          const pct = dim.max > 0 ? (dim.score / dim.max) * 100 : 0
          const barColor =
            pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
          return (
            <div key={dim.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-300 font-medium capitalize">
                  {dim.name.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  {dim.score}/{dim.max}
                </span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {dim.explanation && (
                <p className="text-xs text-gray-500 mt-0.5">{dim.explanation}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
