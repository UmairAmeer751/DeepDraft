// Platform character limits — keep in sync with backend/app/services/format_rules.py
export const PLATFORM_LIMITS = {
  x: 280,
  linkedin: 3000,
  instagram: 2200,
}

export const PLATFORM_LABELS = {
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
}

export const PLATFORM_COLORS = {
  x: 'bg-gray-800 text-gray-100 border-gray-700',
  linkedin: 'bg-blue-950 text-blue-200 border-blue-800',
  instagram: 'bg-pink-950 text-pink-200 border-pink-800',
}

export const PLATFORM_BADGE = {
  x: 'bg-gray-700 text-gray-200',
  linkedin: 'bg-blue-700 text-blue-100',
  instagram: 'bg-gradient-to-r from-pink-600 to-orange-500 text-white',
}

export const TONE_OPTIONS = [
  'professional', 'friendly', 'playful', 'formal', 'bold', 'warm', 'informative',
]

export const LANGUAGE_MODES = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'اردو  Urdu' },
  { value: 'roman_ur', label: 'Roman Urdu' },
]

export const OBJECTIVES = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'lead_generation', label: 'Lead Generation' },
  { value: 'sales', label: 'Sales' },
  { value: 'announcement', label: 'Announcement' },
]

export const INDUSTRIES = [
  'Food & Beverage',
  'Technology',
  'Fashion & Apparel',
  'Health & Wellness',
  'Education',
  'Finance',
  'Real Estate',
  'Retail',
  'Media & Entertainment',
  'Travel & Tourism',
  'Non-profit',
  'Other',
]
