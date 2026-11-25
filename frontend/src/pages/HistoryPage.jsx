import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { LANGUAGE_MODES } from '../constants/platforms'

export default function HistoryPage() {
  const [campaigns, setCampaigns] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterBrand, setFilterBrand] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([api.listCampaigns(), api.listBrands()])
      .then(([c, b]) => { setCampaigns(c); setBrands(b) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filterBrand
    ? campaigns.filter((c) => String(c.brand_id) === String(filterBrand))
    : campaigns

  if (loading) return <PageSkeleton />

  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-violet-400 hover:underline">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaign history</h1>
          <p className="text-gray-400 text-sm mt-1">All campaigns and generation runs</p>
        </div>
        <Link
          to="/campaigns/new"
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New campaign
        </Link>
      </div>

      {/* Filter */}
      {brands.length > 1 && (
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-24 rounded-xl border border-dashed border-gray-800">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-gray-300 font-medium mb-2">No campaigns yet</h3>
          <p className="text-gray-500 text-sm mb-6">Create one to start generating content</p>
          <Link
            to="/campaigns/new"
            className="inline-flex px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create first campaign
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((c) => (
                <tr key={c.id} className="bg-gray-900/50 hover:bg-gray-800/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-200 max-w-xs truncate">
                    {c.topic}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {c.brand_name ?? `Brand #${c.brand_id}`}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {LANGUAGE_MODES.find((m) => m.value === c.language_mode)?.label ?? c.language_mode}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString('en-PK', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {c.latest_run_status ? (
                      <RunBadge status={c.latest_run_status} />
                    ) : (
                      <span className="text-xs text-gray-600">No run yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/campaigns/${c.id}`}
                      className="text-xs text-violet-400 hover:text-violet-300 font-medium"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RunBadge({ status }) {
  const map = {
    success: 'bg-emerald-900/50 text-emerald-400 border-emerald-800',
    partial: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
    failed: 'bg-red-900/50 text-red-400 border-red-800',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${map[status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
      {status}
    </span>
  )
}

function PageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-gray-800 rounded" />
      <div className="h-96 bg-gray-900 rounded-xl border border-gray-800" />
    </div>
  )
}
