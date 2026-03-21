import { Shield } from 'lucide-react'

export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.8s ease-in-out infinite' }}>
        <Shield style={{ width: 24, height: 24, color: '#fff' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '-0.01em' }}>TrustNet</span>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.95)} }`}</style>
    </div>
  )
}
