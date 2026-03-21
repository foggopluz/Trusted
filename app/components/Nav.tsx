'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Shield, Menu, X } from 'lucide-react'

interface NavProps {
  transparent?: boolean // if true, starts transparent (for hero pages)
}

export default function Nav({ transparent = false }: NavProps) {
  const path = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!transparent) return
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transparent])

  const isTransparent = transparent && !scrolled

  const navLinks = [
    { href: '/lookup',   label: 'Lookup' },
    { href: '/dashboard', label: 'My Account' },
    { href: '/admin',    label: 'Admin' },
  ]

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: isTransparent ? 'transparent' : 'rgba(7,14,8,.97)',
        borderBottom: isTransparent ? 'none' : '1px solid rgba(255,255,255,.08)',
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

        {/* Desktop CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="btn btn-sm btn-outline-white">
            Log In
          </Link>
          <Link href="/register" className="btn btn-sm btn-gold">
            Register Free
          </Link>
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
            <Link href="/login" className="btn btn-sm btn-outline-white" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
              Log In
            </Link>
            <Link href="/register" className="btn btn-sm btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
              Register Free
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
