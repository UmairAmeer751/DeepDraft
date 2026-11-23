# DeepDraft — Frontend

> AI-powered brand-adaptive content generation platform · FYP-1 · CUI Lahore · Session 2023–2027

**Frontend Lead:** Umair  
**Supervisor:** Ms. Humera Faisal  
**Deadline:** Monday 14 December 2026

---

## Quick start

```bash
# 1. Install dependencies (run once)
cd frontend
npm install

# 2. Set up environment
cp .env.example .env
# Default: VITE_USE_MOCK=true  → runs with mock data, no backend needed

# 3. Start dev server
npm run dev
# → http://localhost:5173
```

> With `VITE_USE_MOCK=true` the app runs fully in mock mode — no backend required.  
> Set `VITE_USE_MOCK=false` and ensure the backend is running at `http://localhost:8000` to use real data.

---

## Project structure

```
frontend/
├── index.html                  # Noto Nastaliq Urdu + Inter fonts loaded here
├── vite.config.js              # Vite + Tailwind v4 + Vitest config
├── .env.example                # Copy to .env locally
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Router + route definitions
    ├── index.css               # Tailwind v4 import + urdu-text utility
    ├── constants/
    │   └── platforms.js        # Char limits, labels, tone options (single source of truth)
    ├── services/
    │   └── api.js              # ★ ALL backend calls go through here — never call fetch from components
    ├── mocks/
    │   ├── brands.json         # Fixture data for mock mode
    │   ├── campaigns.json
    │   └── run.json            # Full generation run with 3 platform posts
    ├── components/
    │   ├── Layout.jsx          # Sidebar + top bar — shared by all pages
    │   ├── PostCard.jsx        # U4+U5: post display, edit, char counter, RTL, publish badge
    │   ├── ScoreBreakdown.jsx  # U6: score bars + always-visible experimental label
    │   ├── ErrorCard.jsx       # Reusable error display with retry
    │   ├── TagInput.jsx        # Chip input (tone chips, prohibited phrases)
    │   ├── ExamplePostsEditor.jsx  # Repeater for brand example posts
    │   └── Toast.jsx           # Auto-dismissing success/error notifications
    ├── pages/
    │   ├── DashboardPage.jsx   # Backend health, stats, quick actions
    │   ├── BrandsPage.jsx      # Brand list (U2)
    │   ├── BrandFormPage.jsx   # Create/edit brand (U2)
    │   ├── NewCampaignPage.jsx # Campaign brief form (U3)
    │   ├── CampaignPage.jsx    # Result page, generate, run switcher, export (U4+U7+U8+U9)
    │   ├── HistoryPage.jsx     # Campaign history table (U8)
    │   └── AnnotatePage.jsx    # Placeholder for Sohaib's annotation page
    └── test/
        ├── setup.js            # @testing-library/jest-dom
        └── components.test.jsx # U12: 4 automated tests
```

---

## Routes

| Path | Page |
|------|------|
| `/` | Dashboard |
| `/brands` | Brand list |
| `/brands/new` | Create brand |
| `/brands/:id/edit` | Edit brand |
| `/campaigns/new` | New campaign brief |
| `/campaigns/:id` | Campaign result + generate |
| `/campaigns` | History |
| `/dataset/annotate` | Annotation (Sohaib) |

---

## Demo flow (what to show in FYP-1)

1. **Dashboard** — backend status, stats
2. **Brands → New brand** — fill form, add tone chips, example posts → Save
3. **Campaigns → New campaign** — select brand, fill brief, choose platforms + language → Create
4. **Campaign page** — click **Generate** → spinner → 3 platform cards appear
5. **Read the Urdu card** — text renders right-to-left in Noto Nastaliq Urdu font
6. **Edit a card** — live char counter turns red if over limit → Save → "Edited" badge appears, score updates
7. **Score breakdown** — click score → expandable bars → "Experimental" label always visible
8. **Regenerate in اردو Urdu** — new run created, run switcher appears
9. **History** — reopen campaign from table
10. **Export** — click TXT / MD / JSON → file downloads with Urdu intact

---

## Running tests

```bash
cd frontend
npm run test
```

Tests cover (U12):
- Char counter turns red over platform limit
- Char counter is not red within limit
- Urdu post renders with `dir="rtl"` and `lang="ur"`
- Roman Urdu stays LTR
- ScoreBreakdown always shows experimental label
- ScoreBreakdown shows correct total

---

## Important rules

| ✅ Do | ❌ Don't |
|-------|---------|
| Call backend only through `api.js` | Call `fetch` directly from components |
| Use plain React state | Add Redux / Zustand / MobX |
| Use Tailwind CSS | Add Chakra / shadcn / MUI |
| Show "SIMULATED" badge | Use the word "Published" anywhere |
| Always show experimental label on scores | Hide or soften the experimental label |
| Keep `.env` out of git | Commit any API key or `.env` file |

---

## Docs

- [`DECISIONS_LOG.md`](../DECISIONS_LOG.md) — Architecture decisions
- [`docs/SOCIAL_API_FEASIBILITY.md`](../docs/SOCIAL_API_FEASIBILITY.md) — Buffer / LinkedIn / X / Instagram API analysis (U11)
- [`docs/ui/wireframes/`](../docs/ui/wireframes/) — Wireframe sketches (U1)
- [`docs/ui/screenshots/`](../docs/ui/screenshots/) — Demo screenshots (U12)
