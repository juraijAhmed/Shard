import { useState, useEffect } from "react";
import { useTheme } from "./components/useTheme";
import { TitleBar } from "./components/TitleBar";
import { Sidebar } from "./components/Sidebar";
import { GalleryView } from "./components/GalleryView";
import { SearchView } from "./components/SearchView";
import { SettingsView } from "./components/SettingsView";
import { LicenseView } from "./views/LicenseView";
import logo from '../public/logo.png'

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
        <img src={logo} alt="Shard" style={{
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
        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px',
        padding: '36px 48px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '20px', minWidth: '320px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: 'spin 2s linear infinite' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {isIndeterminate ? 'Scanning folder...' : 'Processing screenshots'}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
            {isIndeterminate ? 'Finding images...' : `${scan.current} of ${scan.total} files`}
          </p>
        </div>
        <div style={{ width: '100%', height: '4px', background: 'var(--bg-overlay)', borderRadius: '2px', overflow: 'hidden' }}>
          {isIndeterminate ? (
            <div style={{ height: '100%', width: '40%', borderRadius: '2px', background: 'var(--accent)', animation: 'scanIndeterminate 1.4s ease-in-out infinite' }} />
          ) : (
            <div style={{ height: '100%', borderRadius: '2px', background: 'var(--accent)', width: `${progress}%`, transition: 'width 0.3s ease' }} />
          )}
        </div>
        {!isIndeterminate && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.05em' }}>
            {Math.round(progress)}%
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Update Toast ─────────────────────────────────────────────────────────────

function UpdateToast({ version, onInstall, onDismiss }) {
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 8000,
      background: 'var(--bg-raised)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'toastSlideIn 0.3s ease',
      maxWidth: '320px',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>
          Update available
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)', margin: 0 }}>
          Shard {version} is ready to install
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
        <button
          onClick={onInstall}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
            color: 'var(--bg)', background: 'var(--accent)',
            border: 'none', borderRadius: '6px', padding: '4px 10px',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Install
        </button>
        <button
          onClick={onDismiss}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            color: 'var(--text-dim)', background: 'transparent',
            border: 'none', borderRadius: '6px', padding: '4px 10px',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Later
        </button>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeView, setActiveView] = useState('gallery')
  const { theme, applyTheme } = useTheme()
  const [showSplash, setShowSplash] = useState(true)
  const [scan, setScan] = useState({ active: false, total: 0, current: 0 })
  const [licensed, setLicensed] = useState(null)
  const [updateInfo, setUpdateInfo] = useState(null)

  // Check license on mount
  useEffect(() => {
    window.shard.checkLicense().then((result) => {
      setLicensed(result.licensed)
    }).catch(() => {
      setLicensed(false)
    })
  }, [])

  // Scan listeners
  useEffect(() => {
    window.shard.onScanStart(({ total }) => {
      if (total > 0) setScan({ active: true, total, current: 0 })
    })
    window.shard.onScanProgress(({ total, current }) => {
      setScan((prev) => ({ ...prev, total, current }))
    })
    window.shard.onScanComplete(() => {
      setTimeout(() => setScan({ active: false, total: 0, current: 0 }), 600)
    })
  }, [])

  // Update listener
  useEffect(() => {
    window.shard.onUpdateAvailable((info) => {
      setUpdateInfo({ version: info.version })
    })
  }, [])

  const ActiveView = views[activeView]

  if (licensed === null) {
    return <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)' }} />
  }

  if (!licensed) {
    return <LicenseView onActivated={() => setLicensed(true)} />
  }

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
      {updateInfo && (
        <UpdateToast
          version={updateInfo.version}
          onInstall={() => { window.shard.installUpdate(); setUpdateInfo(null); }}
          onDismiss={() => setUpdateInfo(null)}
        />
      )}
    </div>
  )
}