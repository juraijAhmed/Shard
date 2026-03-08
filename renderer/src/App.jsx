import { useState, useEffect } from 'react'

// Custom titlebar — replaces native frame

function highlight(text, query) {
  if (!text || !query) return text
  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: 'var(--accent)', color: '#0e0e0f', borderRadius: '2px', padding: '0 2px' }}>{part}</mark>
      : part
  )
}

function TitleBar() {
  return (
    <div
      className="flex items-center justify-between px-4 h-10 shrink-0"
      style={{
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        WebkitAppRegion: 'drag', // makes the bar draggable
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '15px',
            letterSpacing: '0.08em',
            color: 'var(--accent)',
          }}
        >
          SHARD
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-dim)',
            letterSpacing: '0.05em',
          }}
        >
          screenshot yard
        </span>
      </div>

      {/* Window controls */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={() => window.shard?.minimize()}
          className="w-7 h-7 rounded flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={e => e.target.style.background = 'var(--bg-overlay)'}
          onMouseLeave={e => e.target.style.background = 'transparent'}
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={() => window.shard?.maximize()}
          className="w-7 h-7 rounded flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={e => e.target.style.background = 'var(--bg-overlay)'}
          onMouseLeave={e => e.target.style.background = 'transparent'}
          title="Maximize"
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="0.5" y="0.5" width="8" height="8" />
          </svg>
        </button>
        <button
          onClick={() => window.shard?.close()}
          className="w-7 h-7 rounded flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#c0392b'; e.currentTarget.style.color = 'white' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-dim)' }}
          title="Close"
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.2">
            <line x1="0" y1="0" x2="9" y2="9" />
            <line x1="9" y1="0" x2="0" y2="9" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ScreenshotModal({ screenshot, onClose }) {
  if (!screenshot) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          width: '680px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative' }}>
          <img
            src={`file://${screenshot.filepath}`}
            alt={screenshot.filename}
            style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', background: '#000' }}
          />
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Meta */}
        <div className="flex gap-6 p-4 overflow-y-auto" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex flex-col gap-3 shrink-0" style={{ minWidth: '140px' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)', marginBottom: '2px' }}>FILENAME</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{screenshot.filename}</p>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)', marginBottom: '2px' }}>DATE</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>{new Date(screenshot.timestamp).toLocaleString()}</p>
            </div>
            {screenshot.ai_tags && (
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)', marginBottom: '6px' }}>TAGS</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {screenshot.ai_tags.split(',').map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: 'var(--accent)',
                        background: 'rgba(232,255,71,0.08)',
                        border: '1px solid rgba(232,255,71,0.2)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                      }}
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {screenshot.ocr_text && (
            <div className="flex-1 overflow-y-auto">
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)', marginBottom: '4px' }}>EXTRACTED TEXT</p>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {screenshot.ocr_text}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Sidebar nav
function Sidebar({ activeView, setActiveView }) {
  const navItems = [
    { id: 'gallery', label: 'Gallery', icon: '⊞' },
    { id: 'search', label: 'Search', icon: '⌕' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ]

  return (
    <div
      className="flex flex-col py-4 gap-1 shrink-0"
      style={{
        width: '56px',
        borderRight: '1px solid var(--border)',
        background: 'var(--bg)',
      }}
    >
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          title={item.label}
          className="mx-2 h-10 rounded flex items-center justify-center text-lg transition-all"
          style={{
            color: activeView === item.id ? 'var(--accent)' : 'var(--text-dim)',
            background: activeView === item.id ? 'var(--bg-overlay)' : 'transparent',
          }}
          onMouseEnter={e => {
            if (activeView !== item.id) e.currentTarget.style.color = 'var(--text-secondary)'
          }}
          onMouseLeave={e => {
            if (activeView !== item.id) e.currentTarget.style.color = 'var(--text-dim)'
          }}
        >
          {item.icon}
        </button>
      ))}
    </div>
  )
}

// Placeholder views
function GalleryView() {
  const [screenshots, setScreenshots] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    window.shard.getAll().then(setScreenshots)

    window.shard.onScreenshotAdded((data) => {
      setScreenshots((prev) => [data, ...prev])
    })

    window.shard.onScreenshotOcrDone(({ filepath, ocrText }) => {
      setScreenshots((prev) =>
        prev.map((s) => s.filepath === filepath ? { ...s, ocr_text: ocrText } : s)
      )
    })
  }, [])

  if (screenshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div style={{ fontSize: '48px', opacity: 0.2 }}>⊞</div>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: '14px' }}>
          No screenshots yet
        </p>
        <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          Set a watch folder in Settings to get started
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-full overflow-hidden">
      <ScreenshotModal screenshot={selected} onClose={() => setSelected(null)} />
      <div className="h-full overflow-y-auto p-4">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
          {screenshots.map((s) => (
            <div
              key={s.filepath}
              onClick={() => setSelected(s)}
              className="rounded-lg overflow-hidden cursor-pointer transition-all"
              style={{
                border: '2px solid var(--border)',
                background: 'var(--bg-overlay)',
                aspectRatio: '16/10',
              }}
            >
              <img
                src={`file://${s.filepath}`}
                alt={s.filename}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SearchView() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (query.trim() === '') {
      setResults([])
      setHasSearched(false)
      return
    }

    const timeout = setTimeout(async () => {
      const found = await window.shard.search(query)
      setResults(found)
      setHasSearched(true)
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  return (
    <div className="relative flex h-full overflow-hidden">
      <ScreenshotModal screenshot={selected} onClose={() => setSelected(null)} />
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Search input */}
        <div className="p-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '16px' }}>⌕</span>
            <input
              autoFocus
              type="text"
              placeholder="Search screenshot text..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--text-primary)',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{ color: 'var(--text-dim)', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {!hasSearched && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                Type to search OCR'd text across all screenshots
              </p>
            </div>
          )}

          {hasSearched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div style={{ fontSize: '36px', opacity: 0.2 }}>⌕</div>
              <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: '14px' }}>
                No results for "{query}"
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="flex flex-col gap-2">
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                {results.length} RESULT{results.length !== 1 ? 'S' : ''}
              </p>
              {results.map((s) => (
                <div
                  key={s.filepath}
                  onClick={() => setSelected(s)}
                  className="flex gap-3 rounded-lg p-3 cursor-pointer transition-all"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                  }}
                >
                  <img
                    src={`file://${s.filepath}`}
                    alt={s.filename}
                    style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                  />
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.filename}
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                      {highlight(s.ocr_text, query)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
function SettingsView() {
  const [folder, setFolder] = useState('')

  // Load saved folder on mount
  useEffect(() => {
    window.shard.getSetting('watchFolder').then((val) => {
      if (val) setFolder(val)
    })
  }, [])

  async function handleBrowse() {
    const picked = await window.shard.pickFolder()
    if (!picked) return
    setFolder(picked)
    await window.shard.setSetting('watchFolder', picked)
  }

  return (
    <div className="flex flex-col p-8 gap-6 h-full">
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '18px', color: 'var(--text-primary)' }}>
          Settings
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
          Configure Shard
        </p>
      </div>

      <div
        className="rounded-lg p-4"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)' }}
      >
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Watch Folder
        </p>
        <div className="flex items-center gap-3">
          <div
            className="flex-1 rounded px-3 py-2"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: folder ? 'var(--text-primary)' : 'var(--text-dim)',
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {folder || 'Not set'}
          </div>
          <button
            onClick={handleBrowse}
            className="px-3 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              background: 'var(--accent)',
              color: '#0e0e0f',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Browse
          </button>
        </div>
        {folder && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
            ✓ Watching for new screenshots
          </p>
        )}
      </div>
    </div>
  )
}

const views = {
  gallery: GalleryView,
  search: SearchView,
  settings: SettingsView,
}

export default function App() {
  const [activeView, setActiveView] = useState('gallery')
  const ActiveView = views[activeView]

  return (
    <div className="flex flex-col h-full">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="flex-1 overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
          <ActiveView />
        </main>
      </div>
    </div>
  )
}