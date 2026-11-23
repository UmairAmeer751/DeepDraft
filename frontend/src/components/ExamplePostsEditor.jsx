/**
 * ExamplePostsEditor — repeater: platform dropdown + textarea, add/remove
 * Aim for 3–10 posts as per guide.
 */
const PLATFORMS = ['instagram', 'linkedin', 'x']

export default function ExamplePostsEditor({ posts = [], onChange }) {
  function addPost() {
    onChange([...posts, { platform: 'instagram', text: '' }])
  }

  function removePost(i) {
    onChange(posts.filter((_, idx) => idx !== i))
  }

  function updatePost(i, field, value) {
    onChange(posts.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)))
  }

  return (
    <div className="space-y-3">
      {posts.map((post, i) => (
        <div key={i} className="rounded-lg bg-gray-900 border border-gray-700 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={post.platform}
              onChange={(e) => updatePost(i, 'platform', e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
            <span className="flex-1 text-xs text-gray-500">Post #{i + 1}</span>
            <button
              type="button"
              onClick={() => removePost(i)}
              className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
            >
              Remove
            </button>
          </div>
          <textarea
            value={post.text}
            onChange={(e) => updatePost(i, 'text', e.target.value)}
            placeholder="Paste or type a real post from this brand…"
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none transition-colors"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addPost}
        className="w-full py-2 rounded-lg border border-dashed border-gray-700 hover:border-violet-700 text-gray-500 hover:text-gray-300 text-sm transition-colors"
      >
        + Add example post
      </button>

      {posts.length > 0 && (
        <p className="text-xs text-gray-500">
          {posts.length}/10 posts · {posts.length < 3 ? `Add ${3 - posts.length} more for best results` : 'Good — the model learns better from more examples'}
        </p>
      )}
    </div>
  )
}
