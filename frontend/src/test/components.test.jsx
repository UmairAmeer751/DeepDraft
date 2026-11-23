import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PostCard from '../components/PostCard'
import ScoreBreakdown from '../components/ScoreBreakdown'

// ── Mock api.js so PostCard doesn't need a real server ───────────────────────
vi.mock('../services/api', () => ({
  api: {
    updatePost: vi.fn().mockResolvedValue({ id: 1, text: 'Updated', hashtags: [], edited: true }),
    simulatePublish: vi.fn().mockResolvedValue({ status: 'simulated', message: 'Mock' }),
  },
}))

// ── Shared mock data ─────────────────────────────────────────────────────────
const basePost = {
  id: 1,
  platform: 'x',
  language_mode: 'en',
  text: 'Hello Lahore! Visit Chai Junction this weekend. ☕',
  hashtags: ['#ChaiJunction', '#Lahore'],
  char_count: 50,
  format_checks: [{ rule: 'max_chars', passed: true, detail: '50/280' }],
  score: {
    total: 74,
    status: 'experimental',
    dimensions: [
      { name: 'prohibited_phrases', score: 20, max: 20, explanation: 'None found' },
    ],
  },
  edited: false,
  publish_status: 'draft',
}

// ── Test 1: char counter turns red over the platform limit ───────────────────
describe('PostCard character counter', () => {
  it('turns red when text exceeds platform limit', async () => {
    const onUpdate = vi.fn()
    const onSimulate = vi.fn()

    render(<PostCard post={basePost} onUpdate={onUpdate} onSimulatePublish={onSimulate} />)

    // Click Edit
    fireEvent.click(screen.getByText('Edit'))

    const textarea = screen.getByTestId('post-textarea')
    const counter = screen.getByTestId('char-counter')

    // Type 281 chars (over X's 280 limit)
    const longText = 'a'.repeat(281)
    fireEvent.change(textarea, { target: { value: longText } })

    // Counter must have red colour class
    expect(counter).toHaveClass('text-red-400')
  })

  it('is NOT red when text is within limit', () => {
    const onUpdate = vi.fn()
    render(<PostCard post={basePost} onUpdate={onUpdate} onSimulatePublish={vi.fn()} />)
    fireEvent.click(screen.getByText('Edit'))

    const counter = screen.getByTestId('char-counter')
    expect(counter).not.toHaveClass('text-red-400')
  })
})

// ── Test 2: Urdu post renders with dir="rtl" ─────────────────────────────────
describe('PostCard Urdu RTL', () => {
  it('renders text with dir=rtl and lang=ur for Urdu posts', () => {
    const urduPost = {
      ...basePost,
      language_mode: 'ur',
      text: 'لاہور میں چائی جنکشن کا موسم سرما مینو',
    }

    render(<PostCard post={urduPost} onUpdate={vi.fn()} onSimulatePublish={vi.fn()} />)

    const textEl = screen.getByText(urduPost.text)
    expect(textEl).toHaveAttribute('dir', 'rtl')
    expect(textEl).toHaveAttribute('lang', 'ur')
  })

  it('does NOT set dir=rtl for Roman Urdu (stays LTR)', () => {
    const romanPost = { ...basePost, language_mode: 'roman_ur' }
    render(<PostCard post={romanPost} onUpdate={vi.fn()} onSimulatePublish={vi.fn()} />)
    const textEl = screen.getByText(basePost.text)
    expect(textEl).not.toHaveAttribute('dir', 'rtl')
  })
})

// ── Test 3: ScoreBreakdown always shows experimental label ───────────────────
describe('ScoreBreakdown experimental label', () => {
  it('always renders the experimental label', () => {
    const score = {
      total: 74,
      status: 'experimental',
      dimensions: [{ name: 'tone_match', score: 15, max: 20, explanation: 'Good' }],
    }

    render(<ScoreBreakdown score={score} />)

    const label = screen.getByTestId('experimental-label')
    expect(label).toBeInTheDocument()
    expect(label).toHaveTextContent('Experimental')
  })

  it('shows score total as x/100', () => {
    const score = { total: 82, status: 'experimental', dimensions: [] }
    render(<ScoreBreakdown score={score} />)
    expect(screen.getByText('82')).toBeInTheDocument()
  })
})
