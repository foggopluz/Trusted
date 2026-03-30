'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { RatingDisplay } from '@/components/StarRating'
import { credentials, ratings } from '@/lib/store'
import { computeScore } from '@/lib/scoring'
import { Building2, Search, CheckCircle, Clock } from 'lucide-react'

type TypeFilter = 'all' | 'individual' | 'business'

// These types mirror only the fields we actually use from the API responses.
interface UserResult {
  id: string
  fullName: string
  profession: string
  location: string
  country: string
  role: string
  idVerificationStatus: string
}

interface CompanyResult {
  id: string
  businessName: string
  industry: string
  country: string
  foundedAt: string
  memberSince: string
  verificationStatus: string
}

function getScoreColor(score: number) {
  if (score >= 700) return 'var(--risk-low)'
  if (score >= 450) return 'var(--risk-med)'
  return 'var(--risk-high)'
}

function getRiskBadgeStyle(tier: string) {
  if (tier === 'low') return { background: 'var(--risk-low-bg)', color: 'var(--risk-low)' }
  if (tier === 'medium') return { background: 'var(--risk-med-bg)', color: 'var(--risk-med)' }
  return { background: 'var(--risk-high-bg)', color: 'var(--risk-high)' }
}

function avgRating(targetId: string, targetType: 'user' | 'company') {
  const rs = ratings.filter(r => r.targetId === targetId && r.targetType === targetType)
  if (rs.length === 0) return { avg: 0, count: 0 }
  const avg = rs.reduce((sum, r) => sum + r.stars, 0) / rs.length
  return { avg, count: rs.length }
}

function monthsSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 30))
}

function companyScore(foundedAt: string, verified: boolean): { score: number; riskTier: 'low' | 'medium' | 'high' } {
  const months = monthsSince(foundedAt)
  const s = verified
    ? Math.round(650 + Math.min((months / 36) * 250, 250))
    : Math.round(200 + Math.min((months / 36) * 150, 150))
  const riskTier: 'low' | 'medium' | 'high' = s >= 700 ? 'low' : s >= 450 ? 'medium' : 'high'
  return { score: s, riskTier }
}

// Static country list for the filter dropdown — kept lightweight so we don't
// fetch all records just to populate a <select>.
const KNOWN_COUNTRIES = [
  'Australia', 'Canada', 'France', 'Germany', 'India', 'Kenya',
  'Nigeria', 'South Africa', 'Tanzania', 'Uganda', 'United Kingdom',
  'United States',
].sort()

function LookupContent() {
  const searchParams = useSearchParams()

  const [query, setQuery]           = useState(() => searchParams.get('q') ?? '')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [country, setCountry]       = useState('')
  const [searched, setSearched]     = useState(() => !!(searchParams.get('q')))
  const [resultTab, setResultTab]   = useState<'people' | 'businesses'>('people')

  const [people, setPeople]         = useState<UserResult[]>([])
  const [bizList, setBizList]       = useState<CompanyResult[]>([])
  const [loading, setLoading]       = useState(false)

  // Re-sync if the URL param changes (e.g. back-navigation)
  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    setQuery(q)
    if (q) setSearched(true)
  }, [searchParams])

  const fetchResults = useCallback(async (q: string, country: string, type: TypeFilter) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q)       params.set('q', q)
      if (country) params.set('country', country)

      const fetchPeople = type !== 'business'
      const fetchBiz    = type !== 'individual'

      const [usersRes, companiesRes] = await Promise.all([
        fetchPeople
          ? fetch(`/api/users?${params.toString()}`).then(r => r.json())
          : Promise.resolve({ users: [] }),
        fetchBiz
          ? fetch(`/api/companies?${params.toString()}`).then(r => r.json())
          : Promise.resolve({ companies: [] }),
      ])

      setPeople(
        (usersRes.users ?? []).filter((u: UserResult) => u.role === 'individual')
      )
      setBizList(companiesRes.companies ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  // Run a fetch whenever the user commits a search
  function handleSearch() {
    setSearched(true)
    if (typeFilter === 'business') setResultTab('businesses')
    else setResultTab('people')
    fetchResults(query, country, typeFilter)
  }

  // Also fetch on initial load if there's a URL param
  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    if (q) fetchResults(q, '', 'all')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleClear() {
    setQuery('')
    setCountry('')
    setTypeFilter('all')
    setSearched(false)
    setPeople([])
    setBizList([])
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', paddingTop: 64 }}>
      <Nav />

      {/* Hero search section */}
      <div style={{ background: 'var(--forest)', paddingTop: 56, paddingBottom: 56 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: 36 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>
              Find anyone on TrustNet
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.65)', maxWidth: 540, margin: '0 auto' }}>
              Search verified individuals and businesses. View trust scores, credentials, and community ratings — all public.
            </p>
          </div>

          {/* Search bar */}
          <div className="fade-up fade-up-1" style={{ display: 'flex', gap: 10, maxWidth: 800, margin: '0 auto', background: '#fff', borderRadius: 12, padding: 8, boxShadow: '0 8px 32px rgba(0,0,0,.15)' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search style={{ width: 16, height: 16, position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Name, profession, company…"
                style={{ width: '100%', padding: '10px 14px 10px 40px', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text)', background: 'transparent', fontFamily: 'var(--font-body)' }}
              />
            </div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as TypeFilter)}
              className="select"
              style={{ width: 140, border: 'none', background: 'var(--surface)', borderRadius: 8 }}
            >
              <option value="all">All Types</option>
              <option value="individual">Individuals</option>
              <option value="business">Businesses</option>
            </select>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="select"
              style={{ width: 140, border: 'none', background: 'var(--surface)', borderRadius: 8 }}
            >
              <option value="">All Countries</option>
              {KNOWN_COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              className="btn btn-gold"
              style={{ flexShrink: 0 }}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* Result tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div className="tab-bar" style={{ display: 'inline-flex' }}>
            <button
              onClick={() => setResultTab('people')}
              className={`tab-btn${resultTab === 'people' ? ' active' : ''}`}
            >
              People {searched ? `(${people.length})` : ''}
            </button>
            <button
              onClick={() => setResultTab('businesses')}
              className={`tab-btn${resultTab === 'businesses' ? ' active' : ''}`}
            >
              Businesses {searched ? `(${bizList.length})` : ''}
            </button>
          </div>
          {(query || country || typeFilter !== 'all') && (
            <button
              onClick={handleClear}
              style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Clear filters
            </button>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 15 }}>Searching…</p>
          </div>
        )}

        {/* People results */}
        {!loading && resultTab === 'people' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {people.map(user => {
              const userCreds = credentials.filter(c => c.subjectUserId === user.id)
              const score = computeScore(userCreds)
              const { avg, count } = avgRating(user.id, 'user')
              const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)

              return (
                <div key={user.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--gold-lt)' }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{user.fullName}</span>
                        {user.idVerificationStatus === 'verified' && (
                          <span className="badge badge-forest" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                            <CheckCircle style={{ width: 10, height: 10 }} /> Verified
                          </span>
                        )}
                        {user.idVerificationStatus === 'pending' && (
                          <span className="badge" style={{ background: 'var(--risk-med-bg)', color: 'var(--risk-med)', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                            <Clock style={{ width: 10, height: 10 }} /> Pending
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0' }}>{user.profession}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>{user.location}, {user.country}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <span className="stat-num" style={{ color: getScoreColor(score.score), fontSize: 28 }}>{score.score}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 4 }}>/ 1000</span>
                    </div>
                    <span className="badge" style={getRiskBadgeStyle(score.riskTier)}>
                      {score.riskTier} risk
                    </span>
                  </div>

                  {count > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <RatingDisplay avg={avg} count={count} size={14} />
                    </div>
                  )}

                  <Link
                    href={`/profile/${user.id}`}
                    className="btn btn-outline-dark btn-sm"
                    style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
                  >
                    View Profile
                  </Link>
                </div>
              )
            })}
            {searched && people.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
                <Search style={{ width: 40, height: 40, margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ fontSize: 15 }}>No individuals match your search</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Try adjusting filters or broadening your query</p>
              </div>
            )}
          </div>
        )}

        {/* Business results */}
        {!loading && resultTab === 'businesses' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {bizList.map(company => {
              const { score: cscore, riskTier } = companyScore(company.foundedAt, company.verificationStatus === 'verified')
              const { avg, count } = avgRating(company.id, 'company')
              const memberYear = company.memberSince

              return (
                <div key={company.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--gold-pale)', border: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 style={{ width: 22, height: 22, color: 'var(--gold)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{company.businessName}</span>
                        {company.verificationStatus === 'verified' && (
                          <span className="badge badge-forest" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                            <CheckCircle style={{ width: 10, height: 10 }} /> Verified
                          </span>
                        )}
                        {company.verificationStatus === 'pending' && (
                          <span className="badge" style={{ background: 'var(--risk-med-bg)', color: 'var(--risk-med)', fontSize: 10 }}>Pending</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0' }}>{company.industry}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>{company.country} · Since {memberYear}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <span className="stat-num" style={{ color: getScoreColor(cscore), fontSize: 28 }}>{cscore}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 4 }}>/ 1000</span>
                    </div>
                    <span className="badge" style={getRiskBadgeStyle(riskTier)}>
                      {riskTier} risk
                    </span>
                  </div>

                  {count > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <RatingDisplay avg={avg} count={count} size={14} />
                    </div>
                  )}

                  <Link
                    href={`/business/${company.id}`}
                    className="btn btn-outline-dark btn-sm"
                    style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
                  >
                    View Profile
                  </Link>
                </div>
              )
            })}
            {searched && bizList.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
                <Building2 style={{ width: 40, height: 40, margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ fontSize: 15 }}>No businesses match your search</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Try adjusting filters or broadening your query</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function LookupPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Loading…</p>
      </div>
    }>
      <LookupContent />
    </Suspense>
  )
}
