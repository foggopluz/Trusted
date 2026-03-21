'use client'
import { Shield } from 'lucide-react'

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#070E08', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#C8900C', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Shield style={{ width: 24, height: 24, color: '#fff' }} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.02em' }}>TrustNet encountered an error</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 40, maxWidth: 360, lineHeight: 1.65 }}>
          A critical error occurred. Please reload the page.
        </p>
        <button
          onClick={reset}
          style={{ background: '#C8900C', color: '#fff', border: 'none', padding: '13px 32px', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          Reload
        </button>
      </body>
    </html>
  )
}
