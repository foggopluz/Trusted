'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { IS_DEMO_MODE, createSupabaseBrowserClient } from '@/lib/supabase'
import { users } from '@/lib/store'
import { CheckCircle, Loader2, User } from 'lucide-react'

const DEMO_USER_ID = 'u-1'

export default function ProfileEditPage() {
  const router = useRouter()
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [userId,   setUserId]   = useState<string | null>(null)

  const demoUser = users.find(u => u.id === DEMO_USER_ID)!

  const [bio,        setBio]        = useState(demoUser.bio ?? '')
  const [profession, setProfession] = useState(demoUser.profession)
  const [city,       setCity]       = useState(demoUser.location)

  useEffect(() => {
    if (IS_DEMO_MODE) {
      setLoading(false)
      return
    }
    const client = createSupabaseBrowserClient()
    client.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login?next=/profile/edit'); return }
      setUserId(user.id)
      const { data } = await client.from('profiles').select('bio,profession,city').eq('id', user.id).single()
      if (data) {
        setBio(data.bio ?? '')
        setProfession(data.profession ?? '')
        setCity(data.city ?? '')
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (!IS_DEMO_MODE && userId) {
        const client = createSupabaseBrowserClient()
        await client.from('profiles').update({ bio, profession, city }).eq('id', userId)
      }
    } catch { /* ignore */ }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)', paddingTop: 64 }}>
        <Nav />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 120 }}>
          <Loader2 style={{ width: 32, height: 32, color: 'var(--forest-mid)', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', paddingTop: 64 }}>
      <Nav />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>

        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <User style={{ width: 20, height: 20, color: 'var(--forest-mid)' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
            Edit Profile
          </h1>
        </div>

        <form onSubmit={handleSave} className="card fade-up fade-up-1" style={{ padding: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div>
              <label className="label">Bio</label>
              <textarea
                className="input"
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                placeholder="Tell others about yourself…"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div>
              <label className="label">Profession / Title</label>
              <input
                className="input"
                value={profession}
                onChange={e => setProfession(e.target.value)}
                placeholder="e.g. UX Designer"
              />
            </div>

            <div>
              <label className="label">City</label>
              <input
                className="input"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Dar es Salaam"
              />
            </div>

            <div style={{ paddingTop: 8, borderTop: '1px solid var(--border-lt)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="submit"
                  className="btn btn-forest"
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {saving
                    ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> Saving…</>
                    : saved
                      ? <><CheckCircle style={{ width: 15, height: 15 }} /> Saved!</>
                      : 'Save Changes'
                  }
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => router.back()}
                >
                  Cancel
                </button>
              </div>
              {IS_DEMO_MODE && (
                <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 10 }}>
                  Demo mode — changes are saved in memory and reset on page refresh.
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
