import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api'
import TagInput from '../components/TagInput'
import ExamplePostsEditor from '../components/ExamplePostsEditor'
import Toast from '../components/Toast'
import { TONE_OPTIONS, INDUSTRIES, LANGUAGE_MODES } from '../constants/platforms'

const EMPTY_BRAND = {
  name: '',
  industry: '',
  audience: '',
  tone: [],
  language_preference: 'en',
  guidelines: '',
  prohibited_phrases: [],
  example_posts: [],
}

export default function BrandFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_BRAND)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    api.getBrand(id)
      .then((b) => setForm(b))
      .catch((e) => setToast({ type: 'error', message: e.message }))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Brand name is required'
    if (!form.industry.trim()) e.industry = 'Industry is required'
    if (!form.audience.trim()) e.audience = 'Target audience is required'
    if (form.example_posts.length < 1) e.example_posts = 'Add at least one example post'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    setErrors({})
    try {
      if (isEdit) {
        await api.updateBrand(id, form)
        setToast({ type: 'success', message: 'Brand updated successfully!' })
      } else {
        await api.createBrand(form)
        setToast({ type: 'success', message: 'Brand created!' })
      }
      setTimeout(() => navigate('/brands'), 1200)
    } catch (err) {
      setToast({ type: 'error', message: err.message })
      setSaving(false)
    }
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-gray-900 rounded-lg border border-gray-800" />)}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{isEdit ? 'Edit brand' : 'New brand'}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {isEdit ? 'Update your brand voice and guidelines' : 'Set up brand voice, tone, and guidelines'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Name */}
        <Field label="Brand name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Chai Junction"
            className={inputCls(errors.name)}
          />
        </Field>

        {/* Industry */}
        <Field label="Industry" required error={errors.industry}>
          <select
            value={form.industry}
            onChange={(e) => set('industry', e.target.value)}
            className={inputCls(errors.industry)}
          >
            <option value="">Select industry…</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </Field>

        {/* Audience */}
        <Field label="Target audience" required error={errors.audience}>
          <input
            type="text"
            value={form.audience}
            onChange={(e) => set('audience', e.target.value)}
            placeholder="e.g. Students and young professionals in Lahore"
            className={inputCls(errors.audience)}
          />
        </Field>

        {/* Tone chips */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Brand tone <span className="text-gray-500 font-normal">(select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((t) => {
              const active = form.tone.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    set('tone', active ? form.tone.filter((x) => x !== t) : [...form.tone, t])
                  }
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    active
                      ? 'bg-violet-600/30 text-violet-300 border-violet-600/60'
                      : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        {/* Language preference */}
        <Field label="Language preference">
          <div className="flex gap-3 flex-wrap">
            {LANGUAGE_MODES.map((m) => (
              <label key={m.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="language_preference"
                  value={m.value}
                  checked={form.language_preference === m.value}
                  onChange={() => set('language_preference', m.value)}
                  className="accent-violet-500"
                />
                <span className="text-sm text-gray-300">{m.label}</span>
              </label>
            ))}
          </div>
        </Field>

        {/* Guidelines */}
        <Field label="Content guidelines">
          <textarea
            value={form.guidelines}
            onChange={(e) => set('guidelines', e.target.value)}
            placeholder="Short sentences. Mention Lahore. Max 2 emojis."
            rows={3}
            className={inputCls() + ' resize-none'}
          />
        </Field>

        {/* Prohibited phrases */}
        <Field label="Prohibited phrases" hint="Type and press Enter to add">
          <TagInput
            tags={form.prohibited_phrases}
            onChange={(tags) => set('prohibited_phrases', tags)}
            placeholder="e.g. cheapest"
          />
        </Field>

        {/* Example posts */}
        <Field label="Example posts" required hint="Add 3–10 real or representative posts" error={errors.example_posts}>
          <ExamplePostsEditor
            posts={form.example_posts}
            onChange={(posts) => set('example_posts', posts)}
          />
        </Field>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : isEdit ? 'Update brand' : 'Create brand'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/brands')}
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
