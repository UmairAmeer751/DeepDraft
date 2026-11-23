import { useState } from 'react'
import { api } from '../services/api'
import ScoreBreakdown from './ScoreBreakdown'
import { PLATFORM_LIMITS, PLATFORM_LABELS, PLATFORM_BADGE } from '../constants/platforms'

export default function PostCard({ post, onUpdate, onSimulatePublish }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(post.text)
  const [editHashtags, setEditHashtags] = useState(post.hashtags?.join(' ') ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const [scoreOpen, setScoreOpen] = useState(false)

  const isUrdu = post.language_mode === 'ur'
  const limit = PLATFORM_LIMITS[post.platform] ?? 2200
  const charCount = editText.length
  const overLimit = charCount > limit

  function handleEdit() {
    setEditText(post.text)
    setEditHashtags(post.hashtags?.join(' ') ?? '')
    setSaveError(null)
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
    setSaveError(null)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await api.updatePost(post.id, {
        text: editText,
        hashtags: editHashtags.split(/\s+/).filter((t) => t.startsWith('#')),
      })
      onUpdate(updated)
      setEditing(false)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    try {
      await onSimulatePublish(post.id)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${platformBorder(post.platform)}`} data-testid="post-card">
      {/* Platform header */}
      <div className={`flex items-center justify-between px-4 py-2.5 ${platformHeader(post.platform)}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLATFORM_BADGE[post.platform] ?? 'bg-gray-700 text-gray-200'}`}>
            {PLATFORM_LABELS[post.platform] ?? post.platform.toUpperCase()}
          </span>
          {post.edited && (
            <span className="text-xs px-2 py-0.5 bg-blue-900/40 text-blue-400 border border-blue-800/40 rounded-full">
              Edited
            </span>
          )}
          {post.publish_status === 'simulated' && (
            <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-400 border border-gray-600 rounded-full" data-testid="simulated-badge">
              SIMULATED — not posted to {PLATFORM_LABELS[post.platform]}
            </span>
          )}
        </div>

        {/* Format checks */}
        <div className="flex items-center gap-2">
          {post.format_checks?.map((fc) => (
            <span
              key={fc.rule}
              title={fc.detail}
              className={`text-xs px-2 py-0.5 rounded-full border font-mono ${
                fc.passed
                  ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40'
                  : 'bg-red-900/30 text-red-400 border-red-800/40'
              }`}
            >
              {fc.detail}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-gray-900">
        {editing ? (
          <>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={6}
              dir={isUrdu ? 'rtl' : 'ltr'}
              lang={isUrdu ? 'ur' : undefined}
              className={`w-full px-3 py-2.5 rounded-lg bg-gray-800 border ${
                overLimit ? 'border-red-600' : 'border-gray-700'
              } text-gray-100 placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none transition-colors ${
                isUrdu ? 'urdu-text' : ''
              }`}
              data-testid="post-textarea"
            />

            {/* Character counter */}
            <div className="flex items-center justify-between mt-1.5 mb-3">
              <input
                type="text"
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                placeholder="#Hashtag1 #Hashtag2"
                className="flex-1 mr-4 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              <span
                className={`text-xs font-mono font-medium ${overLimit ? 'text-red-400' : 'text-gray-400'}`}
                data-testid="char-counter"
              >
                {charCount}/{limit}
              </span>
            </div>

            {saveError && <p className="text-xs text-red-400 mb-2">{saveError}</p>}

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || overLimit}
                className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Post text */}
            <p
              className={`text-gray-100 text-sm leading-relaxed whitespace-pre-wrap mb-3 ${isUrdu ? 'urdu-text text-right' : ''}`}
              dir={isUrdu ? 'rtl' : 'ltr'}
              lang={isUrdu ? 'ur' : undefined}
            >
              {post.text}
            </p>

            {/* Hashtags */}
            {post.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4" dir={isUrdu ? 'rtl' : 'ltr'}>
                {post.hashtags.map((tag) => (
                  <span key={tag} className="text-xs text-violet-400 bg-violet-900/20 px-2 py-0.5 rounded-full border border-violet-800/30">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Score summary + actions */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-gray-800">
              {post.score && (
                <button
                  onClick={() => setScoreOpen((v) => !v)}
                  className="flex items-center gap-2 group"
                  data-testid="score-toggle"
                >
                  <ScoreMeter total={post.score.total} />
                  <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                    {scoreOpen ? 'Hide breakdown ↑' : 'View breakdown ↓'}
                  </span>
                </button>
              )}

              <div className="flex gap-2">
                {post.publish_status !== 'simulated' && (
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 border border-gray-700 rounded-lg transition-colors"
                  >
                    {publishing ? 'Simulating…' : 'Simulate publish'}
                  </button>
                )}
                <button
                  onClick={handleEdit}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Score breakdown (expandable) */}
      {scoreOpen && post.score && !editing && (
        <div className="border-t border-gray-800">
          <ScoreBreakdown score={post.score} />
        </div>
      )}
    </div>
  )
}

function ScoreMeter({ total }) {
  const color = total >= 80 ? 'text-emerald-400' : total >= 60 ? 'text-yellow-400' : 'text-red-400'
  return (
    <span className={`text-sm font-bold ${color}`} data-testid="score-total">
      {total}/100
    </span>
  )
}

function platformBorder(platform) {
  const map = {
    x: 'border-gray-700',
    linkedin: 'border-blue-800/50',
    instagram: 'border-pink-800/50',
  }
  return map[platform] ?? 'border-gray-700'
}

function platformHeader(platform) {
  const map = {
    x: 'bg-gray-800/80',
    linkedin: 'bg-blue-950/60',
    instagram: 'bg-pink-950/60',
  }
  return map[platform] ?? 'bg-gray-800/80'
}
