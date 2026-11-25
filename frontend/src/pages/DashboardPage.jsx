import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

export default function DashboardPage() {
  const [health, setHealth] = useState(null)
  const [healthError, setHealthError] = useState(false)
  const [brands, setBrands] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check backend health
    api.health()
      .then((data) => setHealth(data))
      .catch(() => setHealthError(true))

    // Load summary data
    Promise.all([api.listBrands(), api.listCampaigns()])
      .then(([b, c]) => { setBrands(b); setCampaigns(c) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1 text-sm">
          DeepDraft — AI-powered brand content generation platform
        </p>
      </div>

      {/* Backend status */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-900 border border-gray-800">
        {health ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-gray-300">
              Backend <span className="text-emerald-400 font-medium">online</span>
              {health.db && (
                <span className="text-gray-500 ml-2">· DB: {health.db}</span>
              )}
              {import.meta.env.VITE_USE_MOCK === 'true' && (
                <span className="text-gray-500 ml-2">· mock mode</span>
              )}
            </span>
          </>
        ) : healthError ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-sm text-gray-300">
              Backend <span className="text-red-400 font-medium">offline</span>
              {import.meta.env.VITE_USE_MOCK === 'true' && (
                <span className="text-gray-500 ml-2">— running in mock mode</span>
              )}
            </span>
          </>
        ) : (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-sm text-gray-400">Checking backend…</span>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Brands"
          value={loading ? '—' : brands.length}
          sub="registered"
          color="violet"
          to="/brands"
        />
        <StatCard
          label="Campaigns"
          value={loading ? '—' : campaigns.length}
          sub="created"
          color="blue"
          to="/campaigns"
        />
        <StatCard
          label="Runs completed"
          value={loading ? '—' : campaigns.filter((c) => c.latest_run_status !== null).length}
          sub="across campaigns"
          color="emerald"
          to="/campaigns"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <QuickCard
            to="/brands/new"
            title="Create a brand"
            desc="Set up a brand's voice, tone, and guidelines"
            icon="🏢"
          />
          <QuickCard
            to="/campaigns/new"
            title="Start a campaign"
            desc="Generate cross-platform content from a brief"
            icon="✨"
          />
        </div>
      </div>

      {/* Recent campaigns */}
      {campaigns.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Recent campaigns
            </h2>
            <Link to="/campaigns" className="text-xs text-violet-400 hover:text-violet-300">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {campaigns.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to={`/campaigns/${c.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div>
                  <span className="text-sm font-medium text-gray-200">{c.topic}</span>
                  <span className="text-xs text-gray-500 ml-2">· {c.brand_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {c.latest_run_status ? (
                    <RunStatusBadge status={c.latest_run_status} />
                  ) : (
                    <span className="text-xs text-gray-600">No run yet</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* FYP note */}
      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/40">
        <p className="text-xs text-amber-400/80 leading-relaxed">
          <span className="font-semibold text-amber-400">⚠ FYP-1 Demo Mode</span> — All scores are
          experimental and have not been validated against human judgement. The publish feature uses a
          MockPublisher and never posts to real social media platforms.
        </p>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color, to }) {
  const colors = {
    violet: 'from-violet-900/40 to-violet-900/10 border-violet-800/40',
    blue: 'from-blue-900/40 to-blue-900/10 border-blue-800/40',
    emerald: 'from-emerald-900/40 to-emerald-900/10 border-emerald-800/40',
  }
  const textColors = {
    violet: 'text-violet-400',
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
  }
  return (
    <Link
      to={to}
      className={`p-5 rounded-xl bg-gradient-to-br ${colors[color]} border hover:opacity-80 transition-opacity`}
    >
      <div className={`text-3xl font-bold ${textColors[color]}`}>{value}</div>
      <div className="text-sm font-medium text-gray-300 mt-1">{label}</div>
      <div className="text-xs text-gray-500">{sub}</div>
    </Link>
  )
}

function QuickCard({ to, title, desc, icon }) {
  return (
    <Link
      to={to}
      className="p-5 rounded-xl bg-gray-900 border border-gray-800 hover:border-violet-700/50 hover:bg-gray-800/60 transition-all group"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-semibold text-gray-200 group-hover:text-white">{title}</div>
      <div className="text-xs text-gray-500 mt-1">{desc}</div>
    </Link>
  )
}

function RunStatusBadge({ status }) {
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
