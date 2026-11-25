import { useState, useRef, useEffect } from 'react'

/**
 * TagInput — reusable chip/tag input.
 * Press Enter or comma to add a tag. Click × to remove.
 */
export default function TagInput({ tags = [], onChange, placeholder = 'Type and press Enter' }) {
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  function addTag(raw) {
    const val = raw.trim().replace(/^,+|,+$/g, '').trim()
    if (!val || tags.includes(val)) return
    onChange([...tags, val])
    setInput('')
  }

  function removeTag(tag) {
    onChange(tags.filter((t) => t !== tag))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 min-h-[42px] cursor-text focus-within:ring-2 focus-within:ring-violet-500/50 focus-within:border-violet-600 transition-colors"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-700 text-gray-200 rounded-full"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input && addTag(input)}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent text-gray-100 text-sm placeholder-gray-600 outline-none"
      />
    </div>
  )
}
