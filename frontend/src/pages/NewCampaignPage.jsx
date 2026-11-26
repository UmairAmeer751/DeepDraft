import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import Toast from '../components/Toast'
import { LANGUAGE_MODES, OBJECTIVES } from '../constants/platforms'

const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'x', label: 'X (Twitter)' },
]

export default function NewCampaignPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedBrandId = searchParams.get('brand')

  const [brands, setBrands] = useState([])
  const [form, setForm] = useState({
    brand_id: preselectedBrandId || '',
    topic: '',
    objective: 'awareness',
    audience: '',
    key_message: '',
    cta: '',
    platforms: ['linkedin', 'instagram', 'x'],
    language_mode: 'en',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    api.listBrands().then((b) => {
      setBrands(b)
      // If a brand was preselected, prefill its audience
      if (preselectedBrandId) {
        api.getBrand(preselectedBrandId)
          .then((brand) => {
            if (brand?.audience) {
              setForm((f) => ({ ...f, audience: brand.audience }))
            }
          })
          .catch(() => {})
      }
    })
  }, [preselectedBrandId])

  // Auto-fill audience when brand changes
  async function handleBrandChange(brandId) {
    setForm((f) => ({ ...f, brand_id: brandId }))
    clearErr('brand_id')
    if (!brandId) return

    try {
      const brand = await api.getBrand(brandId)
      if (brand?.audience) {
        setForm((f) => ({ ...f, audience: brand.audience }))
      }
    } catch {
      // Leave audience unchanged on error
    }
  }

  function togglePlatform(id) {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(id)
        ? f.platforms.filter((p) => p !== id)
        : [...f.platforms, id],
    }))
    clearErr('platforms')
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    clearErr(field)
  }

  function clearErr(field) {
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  function validate() {
    const e = {}
    if (!form.brand_id) e.brand_id = 'Please select a brand'
    if (!form.topic.trim()) e.topic = 'Topic is required'
    if (!form.audience.trim()) e.audience = 'Audience is required'
    if (!form.key_message.trim()) e.key_message = 'Key message is required'
    if (!form.cta.trim()) e.cta = 'CTA is required'
    if (form.platforms.length === 0) e.platforms = 'Select at least one platform'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const campaign = await api.createCampaign({
        ...form,
        brand_id: Number(form.brand_id),
      })
      navigate(`/campaigns/${campaign.id}`)
    } catch (err) {
      setToast({ type: 'error', message: err.message })
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">New campaign</h1>
        <p className="text-gray-400 text-sm mt-1">Write a brief to generate cross-platform content</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Brand */}
        <Field label="Brand" required error={errors.brand_id}>
          <select
            value={form.brand_id}
            onChange={(e) => handleBrandChange(e.target.value)}
            className={inputCls(errors.brand_id)}
          >
            <option value="">Select brand…</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          {brands.length === 0 && (
            <p className="mt-1.5 text-xs text-gray-500">
              No brands found.{' '}
              <a href="/brands/new" className="text-violet-400 hover:underline">Create one first →</a>
            </p>
          )}
        </Field>

        {/* Topic */}
        <Field label="Topic / Campaign brief" required error={errors.topic}>
          <input
            type="text"
            value={form.topic}
            onChange={(e) => set('topic', e.target.value)}
            placeholder="e.g. Winter menu launch"
            className={inputCls(errors.topic)}
          />
        </Field>

        {/* Objective */}
        <Field label="Objective">
          <select
            value={form.objective}
            onChange={(e) => set('objective', e.target.value)}
            className={inputCls()}
          >
            {OBJECTIVES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>

        {/* Audience */}
        <Field label="Target audience" required error={errors.audience}>
          <input
            type="text"
            value={form.audience}
            onChange={(e) => set('audience', e.target.value)}
            placeholder="Pre-filled from brand, editable"
            className={inputCls(errors.audience)}
          />
        </Field>

        {/* Key message */}
        <Field label="Key message" required error={errors.key_message}>
          <textarea
            value={form.key_message}
            onChange={(e) => set('key_message', e.target.value)}
            placeholder="e.g. New winter drinks available from 1 Dec"
            rows={2}
            className={inputCls(errors.key_message) + ' resize-none'}
          />
        </Field>

        {/* CTA */}
        <Field label="Call to action" required error={errors.cta}>
          <input
            type="text"
            value={form.cta}
            onChange={(e) => set('cta', e.target.value)}
            placeholder="e.g. Visit any branch this weekend"
            className={inputCls(errors.cta)}
          />
        </Field>

        {/* Platforms */}
        <Field label="Platforms" required error={errors.platforms} hint="At least one required">
          <div className="flex gap-3">
            {PLATFORMS.map((p) => {
              const checked = form.platforms.includes(p.id)
              return (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePlatform(p.id)}
                    className="accent-violet-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-300">{p.label}</span>
                </label>
              )
            })}
          </div>
        </Field>

        {/* Language mode */}
        <Field label="Language mode">
          <div className="flex gap-4 flex-wrap">
            {LANGUAGE_MODES.map((m) => (
              <label key={m.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="language_mode"
                  value={m.value}
                  checked={form.language_mode === m.value}
                  onChange={() => set('language_mode', m.value)}
                  className="accent-violet-500"
                />
                <span className="text-sm text-gray-300">{m.label}</span>
              </label>
            ))}
          </div>
        </Field>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Creating…' : 'Create campaign →'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, required, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {hint && <span className="text-gray-500 font-normal ml-2 text-xs">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}

function inputCls(error) {
  return `w-full px-3 py-2.5 rounded-lg bg-gray-900 border ${
    error ? 'border-red-600' : 'border-gray-700'
  } text-gray-100 placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-600 transition-colors`
}
