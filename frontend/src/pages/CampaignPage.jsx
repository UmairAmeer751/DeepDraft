import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../services/api'
import PostCard from '../components/PostCard'
import ErrorCard from '../components/ErrorCard'
import Toast from '../components/Toast'
import { LANGUAGE_MODES } from '../constants/platforms'

export default function CampaignPage() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(null)
  const [toast, setToast] = useState(null)
  const [selectedRunIndex, setSelectedRunIndex] = useState(0)

  // Load campaign
  useEffect(() => {
    setLoading(true)
    api.getCampaign(id)
      .then((c) => { setCampaign(c); setSelectedRunIndex(0) })
      .catch((e) => setFetchError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleGenerate(languageMode) {
    setGenerating(true)
    setGenError(null)
    try {
      const run = await api.generate(id, languageMode || campaign.language_mode)
      setCampaign((c) => ({
        ...c,
        latest_run: run,
        runs: [run, ...(c.runs || [])],
        language_mode: languageMode || c.language_mode,
      }))
      setSelectedRunIndex(0)
    } catch (err) {
      setGenError(err)
    } finally {
      setGenerating(false)
    }
  }

  async function handleExport(format) {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      try {
        const content = await api.exportMock(id, format)
        const mime = format === 'json' ? 'application/json' : 'text/plain'
        const ext = format
        const blob = new Blob([content], { type: mime })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `deepdraft_campaign_${id}.${ext}`
        a.click()
        URL.revokeObjectURL(url)
      } catch (err) {
        setToast({ type: 'error', message: err.message })
      }
    } else {
      window.open(api.exportUrl(id, format), '_blank')
    }
  }

  function handlePostUpdate(updatedPost) {
    setCampaign((c) => {
      const run = c.latest_run
      if (!run) return c
      return {
        ...c,
        latest_run: {
          ...run,
          posts: run.posts.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
        },
      }
    })
  }

  async function handleSimulatePublish(postId) {
    try {
      const result = await api.simulatePublish(postId)
      handlePostUpdate({ id: postId, publish_status: 'simulated' })
      setToast({ type: 'info', message: result.message ?? 'Simulated — not posted to any platform.' })
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    }
  }

  if (loading) return <PageSkeleton />

  if (fetchError) {
    return (
      <div className="max-w-3xl mx-auto">
        <ErrorCard message={fetchError} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  if (!campaign) return null

  const currentRun = campaign.runs?.[selectedRunIndex] ?? campaign.latest_run
  const allRuns = campaign.runs ?? (campaign.latest_run ? [campaign.latest_run] : [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Campaign summary */}
      <div className="p-5 rounded-xl bg-gray-900 border border-gray-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">{campaign.topic}</h1>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-2">
              <span>🏢 {campaign.brand_name ?? `Brand #${campaign.brand_id}`}</span>
              <span>🎯 {campaign.objective}</span>
              <span>💬 {campaign.cta}</span>
              <span>🌐 {LANGUAGE_MODES.find(m => m.value === campaign.language_mode)?.label ?? campaign.language_mode}</span>
            </div>
          </div>

          {/* Export buttons */}
          {currentRun?.posts?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {['txt', 'md', 'json'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg transition-colors font-mono"
                >
                  ↓ {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generate / Regenerate panel */}
      <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleGenerate(null)}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {generating ? (
              <>
                <Spinner />
                <span>Generating drafts…</span>
              </>
            ) : (
              <>✨ {currentRun ? 'Regenerate' : 'Generate'}</>
            )}
          </button>

          {/* Regenerate in another language */}
          {!generating && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Regenerate in:</span>
              {LANGUAGE_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleGenerate(m.value)}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg transition-colors"
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generation error */}
      {genError && (
        <ErrorCard message={genError.message} onRetry={() => handleGenerate(null)} />
      )}

      {/* Partial warning */}
      {currentRun?.status === 'partial' && (
        <div className="p-3 rounded-lg bg-yellow-900/30 border border-yellow-800/50">
          <p className="text-sm text-yellow-400">
            ⚠ Some drafts failed a format check — review before using.
          </p>
        </div>
      )}

      {/* Run switcher (if multiple runs) */}
      {allRuns.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">View run:</span>
          {allRuns.map((run, i) => (
            <button
              key={run.id}
              onClick={() => setSelectedRunIndex(i)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                i === selectedRunIndex
                  ? 'bg-violet-600/20 text-violet-300 border-violet-700/50'
                  : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-600'
              }`}
            >
              {new Date(run.created_at).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {LANGUAGE_MODES.find(m => m.value === run.language_mode)?.label ?? run.language_mode}
              {i === 0 && <span className="ml-1 text-emerald-400">●</span>}
            </button>
          ))}
        </div>
      )}

      {/* Posts */}
      {currentRun?.posts?.length > 0 ? (
        <div className="space-y-4">
          {currentRun.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpdate={handlePostUpdate}
              onSimulatePublish={handleSimulatePublish}
            />
          ))}
        </div>
      ) : currentRun === null && !generating ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-800">
          <div className="text-4xl mb-3">✨</div>
          <p className="text-gray-400 text-sm">Click Generate to create platform-specific posts</p>
        </div>
      ) : null}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

function PageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="h-24 bg-gray-900 rounded-xl border border-gray-800" />
      <div className="h-14 bg-gray-900 rounded-xl border border-gray-800" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-56 bg-gray-900 rounded-xl border border-gray-800" />
      ))}
    </div>
  )
}
