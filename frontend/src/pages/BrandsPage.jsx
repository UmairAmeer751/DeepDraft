import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function BrandsPage() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.listBrands()
      .then(setBrands)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSkeleton />

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <div className="text-red-400 text-sm mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-violet-400 hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Brands</h1>
          <p className="text-gray-400 text-sm mt-1">Manage brand voices and guidelines</p>
        </div>
        <Link
          to="/brands/new"
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span>+ New brand</span>
        </Link>
      </div>

      {brands.length === 0 ? (
        <EmptyBrands />
      ) : (
        <div className="grid gap-4">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} onEdit={() => navigate(`/brands/${brand.id}/edit`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function BrandCard({ brand, onEdit }) {
  return (
    <div className="p-5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {brand.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-semibold text-gray-100 truncate">{brand.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 whitespace-nowrap shrink-0">
              {brand.industry}
            </span>
          </div>

          <p className="text-xs text-gray-500 ml-11 mb-3">{brand.audience}</p>

          {brand.tone?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 ml-11">
              {brand.tone.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 bg-violet-900/40 text-violet-300 border border-violet-800/40 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          <Link
            to={`/campaigns/new?brand=${brand.id}`}
            className="text-xs px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-700/40 rounded-lg transition-colors"
          >
            New campaign
          </Link>
          <button
            onClick={onEdit}
            className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyBrands() {
  return (
    <div className="text-center py-24 rounded-xl border border-dashed border-gray-800">
      <div className="text-4xl mb-4">🏢</div>
      <h3 className="text-gray-300 font-medium mb-2">No brands yet</h3>
      <p className="text-gray-500 text-sm mb-6">Create your first brand to start generating content</p>
      <Link
        to="/brands/new"
        className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Create your first brand
      </Link>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-gray-800 rounded w-32" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-gray-900 rounded-xl border border-gray-800" />
      ))}
    </div>
  )
}
