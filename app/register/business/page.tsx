'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { Shield, ChevronRight, CheckCircle, Upload, X, FileText, Loader2 } from 'lucide-react'
import { COUNTRY_VERIFICATION_METHODS } from '@/lib/types'
import { createSupabaseBrowserClient, IS_DEMO_MODE, uploadDocument } from '@/lib/supabase'

const COUNTRIES = Object.keys(COUNTRY_VERIFICATION_METHODS)
type Step = 1 | 2 | 3 | 4
const STEPS = [
  { n: 1, label: 'Business Info' },
  { n: 2, label: 'Registration' },
  { n: 3, label: 'Contact Person' },
  { n: 4, label: 'Review' },
]
const INDUSTRIES = [
  'Technology', 'Agritech', 'Fintech', 'Healthcare', 'Education', 'Retail',
  'Logistics', 'Construction', 'Consulting', 'Creative Agency', 'Manufacturing', 'Other',
]

export default function BusinessRegisterPage() {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState({
    businessName: '', industry: 'Technology', country: 'Tanzania', city: '', address: '',
    website: '', description: '',
    tinNumber: '', registrationNumber: '',
    contactName: '', contactPhone: '', contactEmail: '',
    password: '', confirmPassword: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Certificate upload
  const certInputRef = useRef<HTMLInputElement>(null)
  const [certFile, setCertFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function handleFileSelect(file: File) {
    if (file.size > 10 * 1024 * 1024) { setErrors(['File too large — max 10 MB.']); return }
    setCertFile(file)
    setErrors([])
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  function validateStep(s: Step): string[] {
    if (s === 1) {
      const errs: string[] = []
      if (!form.businessName.trim()) errs.push('Business name is required.')
      if (!form.city.trim()) errs.push('City is required.')
      return errs
    }
    if (s === 3) {
      const errs: string[] = []
      if (!form.contactName.trim()) errs.push('Contact name is required.')
      if (!form.contactEmail.trim()) errs.push('Contact email is required.')
      if (!form.password.trim()) errs.push('Password is required.')
      if (form.password.length < 8) errs.push('Password must be at least 8 characters.')
      if (form.password !== form.confirmPassword) errs.push('Passwords do not match.')
      return errs
    }
    return []
  }

  function handleContinue() {
    const errs = validateStep(step)
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    setStep(s => (s + 1) as Step)
  }

  async function handleSubmit() {
    setLoading(true)
    setErrors([])

    if (!IS_DEMO_MODE && form.contactEmail && form.password) {
      try {
        const client = createSupabaseBrowserClient()

        // 1. Sign up with Supabase Auth
        const { data: authData, error: signUpError } = await client.auth.signUp({
          email: form.contactEmail,
          password: form.password,
          options: {
            data: { full_name: form.contactName, role: 'business' },
          },
        })

        if (signUpError) { setErrors([signUpError.message]); setLoading(false); return }

        const userId = authData.user?.id
        if (!userId) {
          setSubmitted(true)
          setLoading(false)
          return
        }

        // 2. Upload certificate (stores path, not public URL)
        let certUrl: string | null = null
        if (certFile) {
          try {
            certUrl = await uploadDocument(client, userId, certFile, 'incorporation-cert')
          } catch (uploadErr) {
            setErrors([uploadErr instanceof Error ? uploadErr.message : 'Certificate upload failed. Please try again.'])
            setLoading(false)
            return
          }
        }

        // 3. Insert profile
        const { error: profileError } = await client.from('profiles').insert({
          id: userId,
          full_name: form.contactName,
          email: form.contactEmail,
          phone: form.contactPhone || null,
          country: form.country,
          city: form.city || null,
          account_type: 'business',
          role: 'business',
          id_verification_status: 'pending',
          did: `did:trustnet:${userId}`,
          member_since: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        })

        if (profileError && !profileError.message.includes('duplicate')) {
          setErrors([profileError.message]); setLoading(false); return
        }

        // 4. Insert company
        const { error: companyError } = await client.from('companies').insert({
          owner_id: userId,
          business_name: form.businessName,
          industry: form.industry || null,
          country: form.country,
          city: form.city || null,
          address: form.address || null,
          website: form.website || null,
          description: form.description || null,
          tin_number: form.tinNumber || null,
          registration_number: form.registrationNumber || null,
          contact_name: form.contactName,
          contact_phone: form.contactPhone || null,
          contact_email: form.contactEmail,
          verification_status: 'pending',
          checks_remaining: 10,
          checks_used: 0,
          subscription_plan: 'starter',
        })

        if (companyError) {
          setErrors([companyError.message]); setLoading(false); return
        }

      } catch (err) {
        setErrors([err instanceof Error ? err.message : 'An unexpected error occurred.'])
        setLoading(false)
        return
      }
    } else {
      // Demo mode — store full profile in sessionStorage
      if (form.contactEmail && form.password) {
        try {
          const profile = {
            email: form.contactEmail, password: form.password,
            name: form.contactName, fullName: form.contactName,
            phone: form.contactPhone, country: form.country,
            city: '', profession: 'Business Owner',
            accountType: 'business' as const,
            role: 'business' as const,
            businessName: form.businessName,
            industry: form.industry,
          }
          const existing = JSON.parse(sessionStorage.getItem('tn_demo_users') || '[]') as typeof profile[]
          const updated = existing.filter(u => u.email !== form.contactEmail)
          updated.push(profile)
          sessionStorage.setItem('tn_demo_users', JSON.stringify(updated))
        } catch { /* ignore */ }
      }
    }

    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 520 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--risk-low-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle className="w-8 h-8" style={{ color: 'var(--risk-low)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 500, color: 'var(--text)', marginBottom: 14 }}>Application submitted!</h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 24 }}>
            Your business registration is under review. Our team will verify your documents and activate your account within 2–5 business days.
          </p>
          {!IS_DEMO_MODE && (
            <div style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold-border)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, textAlign: 'left', fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6 }}>
              <strong>Next step:</strong> Check your email for a verification link, then log in with {form.contactEmail} and your chosen password.
            </div>
          )}
          {IS_DEMO_MODE && form.contactEmail && (
            <div style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold-border)', borderRadius: 10, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Your login credentials</p>
              <div style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email</span>
                <strong style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{form.contactEmail}</strong>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-gold">Log In Now →</Link>
            <Link href="/business/dashboard" className="btn btn-outline-dark">Demo Business Portal</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <header style={{ background: 'rgba(7,14,8,.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield className="w-4 h-4" style={{ color: '#fff' }} /></div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: '#fff' }}>TrustNet</span>
          </Link>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>Business Registration</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 48 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step > s.n ? 'var(--risk-low)' : step === s.n ? 'var(--gold)' : 'var(--surface-2)', color: step >= s.n ? '#fff' : 'var(--text-faint)', fontSize: 13, fontWeight: 600, transition: 'all .2s' }}>
                  {step > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
                </div>
                <span style={{ fontSize: 13, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? 'var(--text)' : 'var(--text-muted)' }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: step > s.n ? 'var(--gold)' : 'var(--border)', margin: '0 8px', transition: 'background .2s' }} />}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '40px 36px' }}>

          {step === 1 && (
            <div className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Business Information</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>Your company&apos;s public-facing information.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px,100%),1fr))', gap: 18 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">Legal Business Name <span style={{ color: 'var(--risk-high)' }}>*</span></label>
                  <input className="input" placeholder="As registered with authorities" value={form.businessName} onChange={e => update('businessName', e.target.value)} />
                </div>
                <div>
                  <label className="label">Industry</label>
                  <div style={{ position: 'relative' }}>
                    <select className="select" value={form.industry} onChange={e => update('industry', e.target.value)}>
                      {INDUSTRIES.map(ind => <option key={ind}>{ind}</option>)}
                    </select>
                    <ChevronRight className="w-4 h-4" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  </div>
                </div>
                <div>
                  <label className="label">Country of Registration</label>
                  <div style={{ position: 'relative' }}>
                    <select className="select" value={form.country} onChange={e => update('country', e.target.value)}>
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronRight className="w-4 h-4" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  </div>
                </div>
                <div>
                  <label className="label">City <span style={{ color: 'var(--risk-high)' }}>*</span></label>
                  <input className="input" placeholder="Dar es Salaam" value={form.city} onChange={e => update('city', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">Physical Address</label>
                  <input className="input" placeholder="Street address" value={form.address} onChange={e => update('address', e.target.value)} />
                </div>
                <div>
                  <label className="label">Website (optional)</label>
                  <input className="input" placeholder="yourcompany.com" value={form.website} onChange={e => update('website', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">Business Description</label>
                  <textarea className="input" rows={3} placeholder="Briefly describe what your business does…" value={form.description} onChange={e => update('description', e.target.value)} style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Business Registration</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>Verification documents for <strong>{form.country}</strong>.</p>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', marginBottom: 28, fontSize: 13, color: 'var(--text-muted)' }}>
                Business registration numbers are verified against official government registries. This may take 2–5 business days.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label className="label">TIN — Tax Identification Number</label>
                  <input className="input" placeholder="TIN number" value={form.tinNumber} onChange={e => update('tinNumber', e.target.value)} />
                </div>
                <div>
                  <label className="label">Business Registration / CAC Number</label>
                  <input className="input" placeholder="Registration number from BRELA / CAC / Registrar" value={form.registrationNumber} onChange={e => update('registrationNumber', e.target.value)} />
                </div>
                <div>
                  <label className="label">Upload Certificate of Incorporation</label>
                  <input ref={certInputRef} type="file" accept="image/jpeg,image/png,application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
                  {certFile ? (
                    <div style={{ border: '2px solid var(--gold)', borderRadius: 10, padding: '12px 16px', background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText style={{ width: 20, height: 20, color: 'var(--gold)' }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{certFile.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(certFile.size / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setCertFile(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--risk-high)', background: 'var(--risk-high-bg)', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>
                        <X style={{ width: 12, height: 12 }} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div
                      role="button" tabIndex={0}
                      onClick={() => certInputRef.current?.click()}
                      onKeyDown={e => e.key === 'Enter' && certInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      style={{ border: `2px dashed ${dragOver ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 10, padding: '36px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'var(--gold-pale)' : 'var(--surface)', transition: 'all .15s' }}
                    >
                      <Upload className="w-7 h-7 mx-auto mb-3" style={{ color: dragOver ? 'var(--gold)' : 'var(--text-faint)' }} />
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-mid)', marginBottom: 4 }}>{dragOver ? 'Drop to upload' : 'Drop certificate here or click to browse'}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>PDF, JPG, PNG — max 10 MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Contact Person</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>The authorised representative for this account.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px,100%),1fr))', gap: 18 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">Full Name <span style={{ color: 'var(--risk-high)' }}>*</span></label>
                  <input className="input" placeholder="Director or authorised representative" value={form.contactName} onChange={e => update('contactName', e.target.value)} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" placeholder="+255 712 …" value={form.contactPhone} onChange={e => update('contactPhone', e.target.value)} />
                </div>
                <div>
                  <label className="label">Email <span style={{ color: 'var(--risk-high)' }}>*</span></label>
                  <input className="input" type="email" placeholder="director@company.com" value={form.contactEmail} onChange={e => update('contactEmail', e.target.value)} />
                </div>
                <div>
                  <label className="label">Password <span style={{ color: 'var(--risk-high)' }}>*</span></label>
                  <input className="input" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={e => update('password', e.target.value)} />
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input className="input" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Review & Submit</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>Confirm all details before submitting for verification.</p>
              <div style={{ background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 28 }}>
                {[
                  { label: 'Business Name',  value: form.businessName || '—' },
                  { label: 'Industry',       value: form.industry },
                  { label: 'Country',        value: form.country },
                  { label: 'City',           value: form.city || '—' },
                  { label: 'Address',        value: form.address || '—' },
                  { label: 'TIN',            value: form.tinNumber || '—' },
                  { label: 'Reg. Number',    value: form.registrationNumber || '—' },
                  { label: 'Contact Name',   value: form.contactName || '—' },
                  { label: 'Contact Email',  value: form.contactEmail || '—' },
                  { label: 'Certificate',    value: certFile ? certFile.name : 'Not uploaded' },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{ display: 'flex', padding: '12px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--border-lt)' : 'none', gap: 16 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 160, flexShrink: 0 }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {row.label === 'Certificate' && certFile && <CheckCircle style={{ width: 13, height: 13, color: 'var(--risk-low)' }} />}
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, cursor: 'pointer' }}>
                <input type="checkbox" style={{ marginTop: 2, accentColor: 'var(--gold)' }} />
                I am an authorised representative of this business and confirm all information is accurate. I agree to TrustNet&apos;s{' '}
                <Link href="/terms" style={{ color: 'var(--forest-mid)', textDecoration: 'none' }}>Terms of Service</Link>.
              </label>
            </div>
          )}

          {errors.length > 0 && (
            <ul style={{ margin: '16px 0 0', padding: '12px 16px', background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high)', borderRadius: 8, listStyle: 'disc', paddingLeft: 32 }}>
              {errors.map((e, i) => <li key={i} style={{ fontSize: 13, color: 'var(--risk-high)', lineHeight: 1.6 }}>{e}</li>)}
            </ul>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            {step > 1
              ? <button className="btn btn-outline-dark" onClick={() => { setErrors([]); setStep(s => (s - 1) as Step) }}>← Back</button>
              : <Link href="/register" className="btn btn-outline-dark">← Account types</Link>
            }
            {step < 4
              ? <button className="btn btn-gold" onClick={handleContinue}>Continue <ChevronRight className="w-4 h-4" /></button>
              : <button className="btn btn-gold" onClick={handleSubmit} disabled={loading} style={{ opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Submitting…' : 'Submit Application →'}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
