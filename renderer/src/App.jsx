import { useState, useEffect } from "react";
import { useTheme } from "./components/useTheme";
import { TitleBar } from "./components/TitleBar";
import { Sidebar } from "./components/Sidebar";
import { GalleryView } from "./components/GalleryView";
import { SearchView } from "./components/SearchView";
import { SettingsView } from "./components/SettingsView";

const views = {
  gallery: GalleryView,
  search: SearchView,
  settings: SettingsView,
};

function SplashAnimation({ onComplete }) {
  const [phase, setPhase] = useState('rock')
  useEffect(() => {
    const rockTimer = setTimeout(() => setPhase('fly'), 2000)
    const doneTimer = setTimeout(() => onComplete(), 3000)
    return () => { clearTimeout(rockTimer); clearTimeout(doneTimer) }
  }, [])
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
      opacity: phase === 'fly' ? 0 : 1,
      transition: phase === 'fly' ? 'opacity 0.6s ease 0.2s' : 'none',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <img src="/logo.png" alt="Shard" style={{
          width: '72px', height: 'auto',
          animation: phase === 'rock'
            ? 'splashRock 0.5s ease-in-out infinite alternate'
            : 'splashFly 0.5s ease-in forwards',
        }} />
        <p style={{
          fontFamily: "'Satoshi', sans-serif", fontSize: '26px', fontWeight: 700,
          color: 'var(--text-primary)', letterSpacing: '0.2em', margin: 0,
          animation: phase === 'rock' ? 'none' : 'splashFade 0.4s ease forwards',
        }}>SHARD</p>
      </div>
    </div>
  )
}

function ScanOverlay({ scan }) {
  if (!scan.active) return null

  const progress = scan.total > 0 ? (scan.current / scan.total) * 100 : 0
  const isIndeterminate = scan.total === 0

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '36px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        minWidth: '320px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Animated icon */}
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: 'var(--accent-glow)',
          border: '1px solid var(--accent-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: 'spin 2s linear infinite' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>

        {/* Text */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700,
            color: 'var(--text-primary)', marginBottom: '6px',
          }}>
            {isIndeterminate ? 'Scanning folder...' : `Processing screenshots`}
          </p>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)',
          }}>
            {isIndeterminate
              ? 'Finding images...'
              : `${scan.current} of ${scan.total} files`}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%', height: '4px',
          background: 'var(--bg-overlay)',
          borderRadius: '2px', overflow: 'hidden',
        }}>
          {isIndeterminate ? (
            <div style={{
              height: '100%', width: '40%', borderRadius: '2px',
              background: 'var(--accent)',
              animation: 'scanIndeterminate 1.4s ease-in-out infinite',
            }} />
          ) : (
            <div style={{
              height: '100%', borderRadius: '2px',
              background: 'var(--accent)',
              width: `${progress}%`,
              transition: 'width 0.3s ease',
            }} />
          )}
        </div>

        {/* Percentage */}
        {!isIndeterminate && (
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px',
            color: 'var(--accent)', letterSpacing: '0.05em',
          }}>
            {Math.round(progress)}%
          </p>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [activeView, setActiveView] = useState('gallery')
  const { theme, applyTheme } = useTheme()
  const [showSplash, setShowSplash] = useState(true)
  const [scan, setScan] = useState({ active: false, total: 0, current: 0 })

  useEffect(() => {
    window.shard.onScanStart(({ total }) => {
      // Only show overlay if there are files to process
      if (total > 0) {
        setScan({ active: true, total, current: 0 })
      }
    })
    window.shard.onScanProgress(({ total, current }) => {
      setScan((prev) => ({ ...prev, total, current }))
    })
    window.shard.onScanComplete(() => {
      // Brief delay so the 100% state is visible before dismissing
      setTimeout(() => setScan({ active: false, total: 0, current: 0 }), 600)
    })
  }, [])

  const ActiveView = views[activeView]

  return (
    <div className="flex flex-col h-full">
      {showSplash && <SplashAnimation onComplete={() => setShowSplash(false)} />}
      <ScanOverlay scan={scan} />
      <TitleBar theme={theme} onToggleTheme={(t) => applyTheme(t)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="flex-1 overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
          <ActiveView applyTheme={applyTheme} currentTheme={theme} />
        </main>
      </div>
    </div>
  )
}