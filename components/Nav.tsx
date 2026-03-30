'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Shield, Menu, X, LogOut, User } from 'lucide-react'
import { IS_DEMO_MODE, createSupabaseBrowserClient } from '@/lib/supabase'

interface NavProps {
  transparent?: boolean // if true, starts transparent (for hero pages)
}

export default function Nav({ transparent = false }: NavProps) {
  const path   = usePathname()
  const router = useRouter()
  const [scrolled,   setScrolled]   = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInitials, setUserInitials] = useState('')
  const [userName,     setUserName]     = useState('')

  useEffect(() => {
    if (!transparent) return
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transparent])

  // Detect auth state
  useEffect(() => {
    function applySession(name: string) {
      setIsLoggedIn(true)
      setUserName(name)
      const parts = name.trim().split(/\s+/)
      setUserInitials(parts.map(p => p[0]).join('').slice(0, 2).toUpperCase())
    }

    // Check real Supabase session
    if (!IS_DEMO_MODE) {
      const client = createSupabaseBrowserClient()
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const user = session.user
          const name = (user.user_metadata?.full_name as string | undefined) || user.email || 'Me'
          applySession(name)
        }
      }).catch(() => undefined)
    }
  }, [path]) // re-run on route change so it updates after login/logout

  function handleSignOut() {
    // Clear demo session
    try { sessionStorage.removeItem('tn_current_user') } catch { /* ignore */ }
    // Clear Supabase session
    if (!IS_DEMO_MODE) {
      createSupabaseBrowserClient().auth.signOut().catch(() => undefined)
    }
    setIsLoggedIn(false)
    setMenuOpen(false)
    router.push('/')
  }

  const isTransparent = transparent && !scrolled

  const navLinks = [
    { href: '/lookup',    label: 'Lookup' },
    { href: '/dashboard', label: 'My Account' },
    { href: '/admin',     label: 'Admin' },
  ]

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background:    isTransparent ? 'transparent' : 'rgba(7,14,8,.97)',
        borderBottom:  isTransparent ? 'none' : '1px solid rgba(255,255,255,.08)',
        backdropFilter: isTransparent ? 'none' : 'blur(12px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--gold)', color: '#fff' }}>
            <Shield className="w-4 h-4" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: '#fff', letterSpacing: '-0.03em' }}>
            TrustNet
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(l => {
            const active = path === l.href || path.startsWith(l.href + '/')
            return (
              <Link key={l.href} href={l.href}
                style={{
                  fontSize: 14, fontWeight: 500,
                  color: active ? '#fff' : 'rgba(255,255,255,.55)',
                  transition: 'color .15s',
                  textDecoration: 'none',
                  borderBottom: active ? '1.5px solid var(--gold)' : '1.5px solid transparent',
                  paddingBottom: 2,
                }}>
                {l.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop CTA buttons — auth-aware */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* User avatar chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--gold)', color: 'var(--dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {userInitials}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.75)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userName}
                </span>
              </div>
              <Link href="/dashboard" className="btn btn-sm btn-outline-white" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <User style={{ width: 13, height: 13 }} /> Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="btn btn-sm"
                style={{ background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.75)', border: '1px solid rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <LogOut style={{ width: 13, height: 13 }} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-sm btn-outline-white">
                Log In
              </Link>
              <Link href="/register" className="btn btn-sm btn-gold">
                Register Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(v => !v)}
          style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden slide-down"
          style={{ background: 'rgba(7,14,8,.98)', borderTop: '1px solid rgba(255,255,255,.08)', padding: '16px 24px 24px' }}>
          <nav className="flex flex-col gap-1 mb-4">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,.8)', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.06)', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex gap-3">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="btn btn-sm btn-outline-white" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.75)', border: '1px solid rgba(255,255,255,.15)' }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-sm btn-outline-white" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
                  Log In
                </Link>
                <Link href="/register" className="btn btn-sm btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
                  Register Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
