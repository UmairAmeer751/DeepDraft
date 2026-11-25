/**
 * api.js — the ONLY place that talks to the backend.
 * All backend calls from pages/components must go through this module.
 *
 * When VITE_USE_MOCK=true the functions return fixture data from src/mocks/
 * after a short fake delay so pages can be built before the backend is ready.
 */

import mockBrand from '../mocks/brand.json'
import mockCampaign from '../mocks/campaign.json'
import generationRun from '../mocks/generation_run.json'
import generationRunUr from '../mocks/generation_run_ur.json'
import generationRunFailed from '../mocks/generation_run_failed.json'

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

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// ── Mock state seeded from fixtures ──────────────────────────────────────────
const _brands = [cloneDeep(mockBrand)]

const initialRun8 = {
  id: 8,
  campaign_id: 3,
  language_mode: 'roman_ur',
  status: 'failed',
  provider: 'mock',
  model: 'mock-v1',
  prompt_version: 'generate_v1',
  error: generationRunFailed.detail,
  latency_ms: 1200,
  created_at: '2026-11-28T15:10:40Z',
  posts: [],
}

// Internal map: campaignId -> Array of full GenerationRun objects
const _runs = new Map()
// Seed campaign 3 runs: 9 (newest), 8 (failed), 7 (success)
_runs.set(3, [
  cloneDeep(generationRunUr),
  cloneDeep(initialRun8),
  cloneDeep(mockCampaign.latest_run || generationRun),
])

const { latest_run: _lr, runs: _r, ...campaignBase } = mockCampaign
const _campaigns = [cloneDeep(campaignBase)]

let _nextBrandId = 100
let _nextCampaignId = 200
let _nextRunId = 1000
let _nextPostId = 5000

// Helper to compute char_count per section 4
function computeCharCount(text, hashtags) {
  const t = text || ''
  const tagStr = (hashtags && hashtags.length > 0) ? hashtags.join(' ') : ''
  return t.length + (tagStr ? 1 + tagStr.length : 0)
}

// ── Public API ────────────────────────────────────────────────────────────────
export const api = {
  // Health check — E1
  health: async () => {
    if (USE_MOCK) {
      await delay(300)
      return { status: 'ok', db: 'ok' }
    }
    return request('/health')
  },

  // Brands — E3, E4, E2, E5
  listBrands: async () => {
    if (USE_MOCK) {
      await delay()
      return _brands.map((b) => ({
        id: b.id,
        name: b.name,
        industry: b.industry,
        language_preference: b.language_preference,
        example_count: b.example_posts?.length ?? 0,
        created_at: b.created_at,
      }))
    }
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
      const now = new Date().toISOString()
      const newBrand = {
        ...b,
        id: _nextBrandId++,
        example_posts: (b.example_posts || []).map((ep, idx) => ({ id: idx + 1, ...ep })),
        created_at: now,
        updated_at: now,
      }
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
      _brands[idx] = {
        ..._brands[idx],
        ...b,
        updated_at: new Date().toISOString(),
      }
      return cloneDeep(_brands[idx])
    }
    return request(`/brands/${id}`, { method: 'PUT', body: b })
  },

  // Campaigns — E7, E8, E6
  listCampaigns: async (brandId) => {
    if (USE_MOCK) {
      await delay()
      const list = brandId
        ? _campaigns.filter((c) => c.brand_id === Number(brandId))
        : _campaigns
      return list.map((c) => {
        const runs = _runs.get(c.id) || []
        const latestRun = runs[0]
        return {
          id: c.id,
          brand_id: c.brand_id,
          brand_name: c.brand_name,
          topic: c.topic,
          language_mode: c.language_mode,
          latest_run_status: latestRun ? latestRun.status : null,
          created_at: c.created_at,
        }
      })
    }
    return request(`/campaigns${brandId ? `?brand_id=${brandId}` : ''}`)
  },

  getCampaign: async (id, runId) => {
    if (USE_MOCK) {
      await delay()
      const c = _campaigns.find((x) => x.id === Number(id))
      if (!c) throw { status: 404, code: 'not_found', message: 'Campaign not found' }
      const campaignRuns = _runs.get(Number(id)) || []
      const selectedRun = runId
        ? campaignRuns.find((r) => r.id === Number(runId))
        : campaignRuns[0]
      return {
        ...cloneDeep(c),
        latest_run: selectedRun ? cloneDeep(selectedRun) : null,
        runs: campaignRuns.map((r) => ({
          id: r.id,
          language_mode: r.language_mode,
          status: r.status,
          created_at: r.created_at,
        })),
      }
    }
    const qs = runId ? `?run_id=${runId}` : ''
    return request(`/campaigns/${id}${qs}`)
  },

  createCampaign: async (c) => {
    if (USE_MOCK) {
      await delay(800)
      const brand = _brands.find((b) => b.id === Number(c.brand_id))
      const newId = _nextCampaignId++
      const newCampaign = {
        ...c,
        id: newId,
        brand_name: brand?.name ?? 'Unknown',
        created_at: new Date().toISOString(),
      }
      _campaigns.push(newCampaign)
      _runs.set(newId, [])
      return {
        ...cloneDeep(newCampaign),
        latest_run: null,
        runs: [],
      }
    }
    return request('/campaigns', { method: 'POST', body: c })
  },

  // Generate — E9
  generate: async (campaignId, languageMode) => {
    if (USE_MOCK) {
      await delay(2000) // simulate generation time
      const c = _campaigns.find((x) => x.id === Number(campaignId))
      if (!c) throw { status: 404, code: 'not_found', message: 'Campaign not found' }

      const targetLang = languageMode || c.language_mode
      const fixture = targetLang === 'ur' ? generationRunUr : generationRun
      const run = cloneDeep(fixture)

      const now = new Date().toISOString()
      const newRunId = _nextRunId++
      run.id = newRunId
      run.campaign_id = Number(campaignId)
      run.language_mode = targetLang
      run.created_at = now

      run.posts = (run.posts || []).map((p, idx) => ({
        ...p,
        id: _nextPostId++,
        run_id: newRunId,
        created_at: now,
        updated_at: now,
      }))

      const existingRuns = _runs.get(Number(campaignId)) || []
      existingRuns.unshift(run)
      _runs.set(Number(campaignId), existingRuns)

      return cloneDeep(run)
    }
    return request(`/campaigns/${campaignId}/generate`, {
      method: 'POST',
      body: languageMode ? { language_mode: languageMode } : {},
    })
  },

  // Posts — E10
  updatePost: async (id, patch) => {
    if (USE_MOCK) {
      await delay(500)
      for (const [, runs] of _runs.entries()) {
        for (const run of runs) {
          if (run.posts) {
            const pi = run.posts.findIndex((p) => p.id === Number(id))
            if (pi !== -1) {
              const prev = run.posts[pi]
              const updated = {
                ...prev,
                ...patch,
                edited: true,
                updated_at: new Date().toISOString(),
              }
              updated.char_count = computeCharCount(updated.text, updated.hashtags)
              if (updated.format_checks) {
                updated.format_checks = updated.format_checks.map((fc) =>
                  fc.rule === 'max_chars'
                    ? {
                        ...fc,
                        passed: true,
                        detail: `${updated.char_count}/${fc.detail.split('/')[1] || '280'}`,
                      }
                    : fc
                )
              }
              run.posts[pi] = updated
              return cloneDeep(updated)
            }
          }
        }
      }
      throw { status: 404, code: 'not_found', message: 'Post not found' }
    }
    return request(`/posts/${id}`, { method: 'PATCH', body: patch })
  },

  // Simulate publish — E12
  simulatePublish: async (postId) => {
    if (USE_MOCK) {
      await delay(1000)
      for (const [, runs] of _runs.entries()) {
        for (const run of runs) {
          if (run.posts) {
            const pi = run.posts.findIndex((p) => p.id === Number(postId))
            if (pi !== -1) {
              const post = run.posts[pi]
              post.publish_status = 'simulated'
              if (!post._publishResult) {
                post._publishResult = {
                  status: 'simulated',
                  provider: 'mock',
                  external_id: null,
                  message: `Simulated — not posted to ${post.platform ? post.platform.toUpperCase() : 'platform'}`,
                  created_at: new Date().toISOString(),
                }
              }
              return cloneDeep(post._publishResult)
            }
          }
        }
      }
      throw { status: 404, code: 'not_found', message: 'Post not found' }
    }
    return request(`/posts/${postId}/publish`, { method: 'POST' })
  },

  // Export URL — E11
  exportUrl: (campaignId, format, runId) => {
    const qs = runId ? `?format=${format}&run_id=${runId}` : `?format=${format}`
    return `${BASE}/campaigns/${campaignId}/export${qs}`
  },

  // Mock-only export
  exportMock: async (campaignId, format, runId) => {
    await delay(400)
    const c = _campaigns.find((x) => x.id === Number(campaignId))
    if (!c) throw { status: 404, code: 'not_found', message: 'Campaign not found' }
    const runs = _runs.get(Number(campaignId)) || []
    const run = runId ? runs.find((r) => r.id === Number(runId)) : runs[0]
    if (!run) throw { status: 404, code: 'not_found', message: 'No run to export' }

    const brand = _brands.find((b) => b.id === c.brand_id)

    if (format === 'json') {
      return JSON.stringify({ campaign: c, brand_name: brand?.name, run }, null, 2)
    }

    const lines = (run.posts || []).map((p) => {
      const tags = p.hashtags?.join(' ') ?? ''
      if (format === 'md') {
        return `## ${p.platform.toUpperCase()}\n\n${p.text}\n\n${tags}\n\n*Score: ${p.score?.total ?? 'N/A'}/100 — Score is experimental — DeepDraft FYP-1*`
      }
      return `[${p.platform.toUpperCase()}]\n${p.text}\n${tags}`
    })

    return lines.join('\n\n---\n\n')
  },
}
