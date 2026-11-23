/**
 * api.js — the ONLY place that talks to the backend.
 * All backend calls from pages/components must go through this module.
 *
 * When VITE_USE_MOCK=true the functions return fixture data from src/mocks/
 * after a short fake delay so pages can be built before the backend is ready.
 */

import mockBrands from '../mocks/brands.json'
import mockCampaigns from '../mocks/campaigns.json'
import mockRun from '../mocks/run.json'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ── Helper: fake network delay ───────────────────────────────────────────────
const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms))

// ── Core fetch wrapper ───────────────────────────────────────────────────────
async function request(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw {
      status: 0,
      code: 'network',
      message: 'Cannot reach the DeepDraft server. Is the backend running?',
    }
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const d = data?.detail
    const message = Array.isArray(d)
      ? d.map((e) => e.msg).join('; ')
      : d?.message ?? (typeof d === 'string' ? d : 'Request failed')
    throw { status: res.status, code: d?.code ?? 'error', message }
  }

  return data
}

// ── Mock helpers ─────────────────────────────────────────────────────────────
let _brands = [...mockBrands]
let _campaigns = [...mockCampaigns]
let _nextBrandId = 100
let _nextCampaignId = 200

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// ── Public API ────────────────────────────────────────────────────────────────
export const api = {
  // Health check — used by Dashboard
  health: async () => {
    if (USE_MOCK) {
      await delay(300)
      return { status: 'ok', version: 'mock', model: 'gemini-1.5-pro' }
    }
    return request('/health')
  },

  // Brands
  listBrands: async () => {
    if (USE_MOCK) { await delay(); return cloneDeep(_brands) }
    return request('/brands')
  },

  getBrand: async (id) => {
    if (USE_MOCK) {
      await delay()
      const brand = _brands.find((b) => b.id === Number(id))
      if (!brand) throw { status: 404, code: 'not_found', message: 'Brand not found' }
      return cloneDeep(brand)
    }
    return request(`/brands/${id}`)
  },

  createBrand: async (b) => {
    if (USE_MOCK) {
      await delay(800)
      const newBrand = { ...b, id: _nextBrandId++, created_at: new Date().toISOString() }
      _brands.push(newBrand)
      return cloneDeep(newBrand)
    }
    return request('/brands', { method: 'POST', body: b })
  },

  updateBrand: async (id, b) => {
    if (USE_MOCK) {
      await delay(800)
      const idx = _brands.findIndex((x) => x.id === Number(id))
      if (idx === -1) throw { status: 404, code: 'not_found', message: 'Brand not found' }
      _brands[idx] = { ..._brands[idx], ...b }
      return cloneDeep(_brands[idx])
    }
    return request(`/brands/${id}`, { method: 'PUT', body: b })
  },

  // Campaigns
  listCampaigns: async (brandId) => {
    if (USE_MOCK) {
      await delay()
      const list = brandId
        ? _campaigns.filter((c) => c.brand_id === Number(brandId))
        : _campaigns
      return cloneDeep(list)
    }
    return request(`/campaigns${brandId ? `?brand_id=${brandId}` : ''}`)
  },

  getCampaign: async (id) => {
    if (USE_MOCK) {
      await delay()
      const c = _campaigns.find((x) => x.id === Number(id))
      if (!c) throw { status: 404, code: 'not_found', message: 'Campaign not found' }
      return cloneDeep(c)
    }
    return request(`/campaigns/${id}`)
  },

  createCampaign: async (c) => {
    if (USE_MOCK) {
      await delay(800)
      const brand = _brands.find((b) => b.id === Number(c.brand_id))
      const newCampaign = {
        ...c,
        id: _nextCampaignId++,
        brand_name: brand?.name ?? 'Unknown',
        created_at: new Date().toISOString(),
        latest_run: null,
        runs: [],
      }
      _campaigns.push(newCampaign)
      return cloneDeep(newCampaign)
    }
    return request('/campaigns', { method: 'POST', body: c })
  },

  // Generate
  generate: async (campaignId, languageMode) => {
    if (USE_MOCK) {
      await delay(2000) // simulate generation time
      const idx = _campaigns.findIndex((x) => x.id === Number(campaignId))
      if (idx === -1) throw { status: 404, code: 'not_found', message: 'Campaign not found' }

      const run = cloneDeep(mockRun)
      run.id = Date.now()
      run.campaign_id = Number(campaignId)
      run.language_mode = languageMode || run.language_mode
      run.created_at = new Date().toISOString()

      // Apply requested language_mode to all posts
      if (languageMode) {
        run.posts = run.posts.map((p) => ({ ...p, language_mode: languageMode }))
      }

      _campaigns[idx].latest_run = run
      _campaigns[idx].runs = [run, ...(_campaigns[idx].runs || [])]
      return cloneDeep(run)
    }
    return request(`/campaigns/${campaignId}/generate`, {
      method: 'POST',
      body: languageMode ? { language_mode: languageMode } : {},
    })
  },

  // Posts
  updatePost: async (id, patch) => {
    if (USE_MOCK) {
      await delay(500)
      // Find post across all campaigns
      for (const c of _campaigns) {
        if (c.latest_run?.posts) {
          const pi = c.latest_run.posts.findIndex((p) => p.id === Number(id))
          if (pi !== -1) {
            const updated = { ...c.latest_run.posts[pi], ...patch, edited: true }
            updated.char_count = updated.text.length
            // Simple format check update
            updated.format_checks = updated.format_checks.map((fc) =>
              fc.rule === 'max_chars'
                ? {
                    ...fc,
                    passed: true,
                    detail: `${updated.char_count}/${fc.detail.split('/')[1]}`,
                  }
                : fc
            )
            c.latest_run.posts[pi] = updated
            return cloneDeep(updated)
          }
        }
      }
      throw { status: 404, code: 'not_found', message: 'Post not found' }
    }
    return request(`/posts/${id}`, { method: 'PATCH', body: patch })
  },

  // Simulate publish
  simulatePublish: async (postId) => {
    if (USE_MOCK) {
      await delay(1000)
      for (const c of _campaigns) {
        if (c.latest_run?.posts) {
          const pi = c.latest_run.posts.findIndex((p) => p.id === Number(postId))
          if (pi !== -1) {
            if (c.latest_run.posts[pi].publish_status === 'simulated') {
              return { status: 'simulated', message: 'Already simulated', idempotent: true }
            }
            c.latest_run.posts[pi].publish_status = 'simulated'
            return {
              status: 'simulated',
              provider: 'MockPublisher',
              external_id: null,
              message: 'Mock publish — no real post was created.',
              created_at: new Date().toISOString(),
            }
          }
        }
      }
      throw { status: 404, code: 'not_found', message: 'Post not found' }
    }
    return request(`/posts/${postId}/publish`, { method: 'POST' })
  },

  // Export URL — just a URL string, opened directly by the browser
  exportUrl: (campaignId, format, runId) => {
    const qs = runId ? `?format=${format}&run_id=${runId}` : `?format=${format}`
    return `${BASE}/campaigns/${campaignId}/export${qs}`
  },

  // Mock-only export (since we can't redirect to backend in mock mode)
  exportMock: async (campaignId, format) => {
    await delay(400)
    const c = _campaigns.find((x) => x.id === Number(campaignId))
    if (!c?.latest_run) throw { status: 404, code: 'not_found', message: 'No run to export' }

    const run = c.latest_run
    const brand = _brands.find((b) => b.id === c.brand_id)

    if (format === 'json') {
      return JSON.stringify({ campaign: c, brand_name: brand?.name, run }, null, 2)
    }

    const lines = run.posts.map((p) => {
      const tags = p.hashtags?.join(' ') ?? ''
      if (format === 'md') {
        return `## ${p.platform.toUpperCase()}\n\n${p.text}\n\n${tags}\n\n*Score: ${p.score?.total ?? 'N/A'}/100 — Score is experimental — DeepDraft FYP-1*`
      }
      return `[${p.platform.toUpperCase()}]\n${p.text}\n${tags}`
    })

    return lines.join('\n\n---\n\n')
  },
}
