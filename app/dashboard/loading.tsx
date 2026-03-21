export default function DashboardLoading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', paddingTop: 64 }}>
      {/* Header skeleton */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="skeleton skeleton-avatar" style={{ width: 64, height: 64 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-title" style={{ width: 200, height: 24, marginBottom: 10 }} />
            <div className="skeleton skeleton-text" style={{ width: 140 }} />
          </div>
        </div>
      </div>

      {/* Body skeleton */}
      <div style={{ maxWidth: 1280, margin: '32px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 24 }}>
        {/* Sidebar */}
        <div className="card" style={{ padding: 24, height: 420 }}>
          <div className="skeleton" style={{ width: 120, height: 120, borderRadius: '50%', margin: '0 auto 24px' }} />
          <div className="skeleton skeleton-text" style={{ width: '80%', margin: '0 auto 12px' }} />
          <div className="skeleton skeleton-text" style={{ width: '60%', margin: '0 auto' }} />
        </div>
        {/* Main */}
        <div className="card" style={{ padding: 24 }}>
          <div className="skeleton" style={{ height: 40, marginBottom: 24, borderRadius: 8 }} />
          {[1, 2, 3].map(i => (
            <div key={i} className="card-sm" style={{ padding: 16, marginBottom: 12 }}>
              <div className="skeleton skeleton-text" style={{ width: '70%', marginBottom: 8 }} />
              <div className="skeleton skeleton-text" style={{ width: '40%' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
