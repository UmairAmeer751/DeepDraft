import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import CampaignPage from '../pages/CampaignPage'
import mockCampaign from '../mocks/campaign.json'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    getCampaign: vi.fn(),
    generate: vi.fn(),
    updatePost: vi.fn(),
    simulatePublish: vi.fn(),
    exportUrl: vi.fn(),
    exportMock: vi.fn(),
  },
}))

function renderCampaignPage(campaignId = '3') {
  return render(
    <MemoryRouter initialEntries={[`/campaigns/${campaignId}`]}>
      <Routes>
        <Route path="/campaigns/:id" element={<CampaignPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CampaignPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getCampaign.mockResolvedValue(JSON.parse(JSON.stringify(mockCampaign)))
  })

  // a) Given mocks/campaign.json as the getCampaign result, renders exactly latest_run.posts.length post cards.
  it('renders exactly latest_run.posts.length post cards', async () => {
    renderCampaignPage()

    const cards = await screen.findAllByTestId('post-card')
    expect(cards).toHaveLength(mockCampaign.latest_run.posts.length)
  })

  // b) After editing a post and clicking Save (updatePost resolves to the post with new text), the new text is visible.
  it('shows new text after editing a post and clicking Save', async () => {
    const updatedText = 'Brand new edited post text for testing!'
    const firstPost = mockCampaign.latest_run.posts[0]
    api.updatePost.mockResolvedValueOnce({
      ...firstPost,
      text: updatedText,
      edited: true,
    })

    renderCampaignPage()

    await screen.findAllByTestId('post-card')

    // Click Edit on the first post card
    const editButtons = screen.getAllByRole('button', { name: /^edit$/i })
    fireEvent.click(editButtons[0])

    const textarea = screen.getByTestId('post-textarea')
    fireEvent.change(textarea, { target: { value: updatedText } })

    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.queryByTestId('post-textarea')).not.toBeInTheDocument()
    })

    expect(screen.getByText(updatedText)).toBeInTheDocument()
  })

  // c) After clicking "Simulate publish", the SIMULATED badge appears and the card still shows its text.
  it('shows the SIMULATED badge and still shows post text after clicking Simulate publish', async () => {
    const firstPost = mockCampaign.latest_run.posts[0]
    api.simulatePublish.mockResolvedValueOnce({
      status: 'simulated',
      provider: 'mock',
      external_id: null,
      message: 'Simulated — not posted to LinkedIn',
      created_at: new Date().toISOString(),
    })

    renderCampaignPage()

    await screen.findAllByTestId('post-card')

    // The text of the first post must be visible
    expect(screen.getByText(/Winter is here/i)).toBeInTheDocument()

    const simulateButtons = screen.getAllByRole('button', { name: /simulate publish/i })
    fireEvent.click(simulateButtons[0])

    const badge = await screen.findByTestId('simulated-badge')
    expect(badge).toBeInTheDocument()
    expect(screen.getByText(/Winter is here/i)).toBeInTheDocument()
  })
})
