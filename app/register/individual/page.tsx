'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Shield, ChevronRight, CheckCircle, Upload } from 'lucide-react'
import { COUNTRY_VERIFICATION_METHODS, VERIFICATION_METHOD_LABELS } from '@/lib/types'

const COUNTRIES = Object.keys(COUNTRY_VERIFICATION_METHODS)

type Step = 1 | 2 | 3 | 4

const STEPS = [
  { n: 1, label: 'Personal Info' },
  { n: 2, label: 'Account Type' },
  { n: 3, label: 'ID Verification' },
  { n: 4, label: 'Review' },
]

function IndividualRegisterForm() {
  const params = useSearchParams()
  const accountTypeParam = params.get('type') || 'professional'
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', country: 'Tanzania',
    city: '', profession: '',
    accountType: accountTypeParam as 'job_seeker' | 'professional',
    verificationMethod: 'nida',
    idNumber: '', password: '', confirmPassword: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const methods = COUNTRY_VERIFICATION_METHODS[form.country] || COUNTRY_VERIFICATION_METHODS['Other']

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--risk-low-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle className="w-8 h-8" style={{ color: 'var(--risk-low)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 500, color: 'var(--text)', marginBottom: 14 }}>
            Registration submitted!
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 32 }}>
            Your identity verification is under review. You'll receive a confirmation on <strong>{form.email || form.phone}</strong> within 24–48 hours.
          </p>
          <Link href="/dashboard" className="btn btn-forest" style={{ marginRight: 12 }}>Go to Dashboard</Link>
          <Link href="/" className="btn btn-outline-dark">Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      {/* Header */}
      <header style={{ background: 'rgba(7,14,8,.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield className="w-4 h-4" style={{ color: '#fff' }} /></div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: '#fff' }}>TrustNet</span>
          </Link>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>Individual Registration</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 48 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step > s.n ? 'var(--risk-low)' : step === s.n ? 'var(--forest)' : 'var(--surface-2)',
                  color: step >= s.n ? '#fff' : 'var(--text-faint)',
                  fontSize: 13, fontWeight: 600, transition: 'all .2s',
                }}>
                  {step > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
                </div>
                <span style={{ fontSize: 13, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? 'var(--text)' : 'var(--text-muted)', display: 'none' }} className="sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: step > s.n ? 'var(--forest-lt)' : 'var(--border)', margin: '0 8px', transition: 'background .2s' }} />
              )}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '40px 36px' }}>
          {/* Step 1 — Personal Info */}
          {step === 1 && (
            <div className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Personal Information</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>Basic details that will appear on your profile.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">Full Legal Name</label>
                  <input className="input" placeholder="As it appears on your ID" value={form.fullName} onChange={e => update('fullName', e.target.value)} />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input className="input" placeholder="+255 712 345 678" value={form.phone} onChange={e => update('phone', e.target.value)} />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input className="input" type="email" placeholder="you@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
                </div>
                <div>
                  <label className="label">Country</label>
                  <div style={{ position: 'relative' }}>
                    <select className="select" value={form.country} onChange={e => { update('country', e.target.value); update('verificationMethod', COUNTRY_VERIFICATION_METHODS[e.target.value]?.[0] || 'national_id') }}>
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronRight className="w-4 h-4" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  </div>
                </div>
                <div>
                  <label className="label">City / Town</label>
                  <input className="input" placeholder="Dar es Salaam" value={form.city} onChange={e => update('city', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">Profession / Occupation</label>
                  <input className="input" placeholder="e.g. UX Designer, Software Engineer, Accountant" value={form.profession} onChange={e => update('profession', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Account type */}
          {step === 2 && (
            <div className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Account Type</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>How are you primarily using TrustNet?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { value: 'job_seeker', label: 'Job Seeker', desc: 'Looking for employment. My profile helps employers verify my background.' },
                  { value: 'professional', label: 'Professional / Freelancer', desc: 'Offering services to clients. I need a portable verified reputation.' },
                ] .map(opt => (
                  <label key={opt.value} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 20px',
                    borderRadius: 10, border: `2px solid ${form.accountType === opt.value ? 'var(--forest)' : 'var(--border)'}`,
                    background: form.accountType === opt.value ? 'var(--forest-pale)' : 'var(--white)',
                    cursor: 'pointer', transition: 'all .15s',
                  }}>
                    <input type="radio" name="accountType" value={opt.value} checked={form.accountType === opt.value} onChange={() => update('accountType', opt.value)} style={{ marginTop: 3, accentColor: 'var(--forest)' }} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{opt.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — ID Verification */}
          {step === 3 && (
            <div className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Identity Verification</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>Select the verification method available in <strong>{form.country}</strong>.</p>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', marginBottom: 28, fontSize: 13, color: 'var(--text-muted)' }}>
                Your ID document is reviewed by TrustNet admins within 24–48 hours. Your details are never sold or shared.
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label">Verification Method</label>
                <div style={{ position: 'relative' }}>
                  <select className="select" value={form.verificationMethod} onChange={e => update('verificationMethod', e.target.value)}>
                    {methods.map(m => <option key={m} value={m}>{VERIFICATION_METHOD_LABELS[m]}</option>)}
                  </select>
                  <ChevronRight className="w-4 h-4" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label">ID / Reference Number</label>
                <input className="input" placeholder="Enter your ID number" value={form.idNumber} onChange={e => update('idNumber', e.target.value)} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label">Upload ID Document</label>
                <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: 'var(--surface)' }}>
                  <Upload className="w-6 h-6 mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-mid)' }}>Drop your ID here or click to browse</p>
                  <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>JPG, PNG or PDF — max 5 MB</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="label">Password</label>
                  <input className="input" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={e => update('password', e.target.value)} />
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input className="input" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <div className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Review & Submit</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>Review your details before submitting.</p>
              <div style={{ background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 28 }}>
                {[
                  { label: 'Full Name', value: form.fullName || '—' },
                  { label: 'Phone', value: form.phone || '—' },
                  { label: 'Email', value: form.email || '—' },
                  { label: 'Country', value: form.country },
                  { label: 'City', value: form.city || '—' },
                  { label: 'Profession', value: form.profession || '—' },
                  { label: 'Account Type', value: form.accountType === 'job_seeker' ? 'Job Seeker' : 'Professional / Freelancer' },
                  { label: 'Verification Method', value: VERIFICATION_METHOD_LABELS[form.verificationMethod as keyof typeof VERIFICATION_METHOD_LABELS] || form.verificationMethod },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{ display: 'flex', padding: '13px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--border-lt)' : 'none', gap: 16 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 160, flexShrink: 0 }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, cursor: 'pointer' }}>
                <input type="checkbox" style={{ marginTop: 2, accentColor: 'var(--forest)' }} />
                I confirm the information above is accurate and I agree to TrustNet's Terms of Service and Privacy Policy.
              </label>
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            {step > 1
              ? <button className="btn btn-outline-dark" onClick={() => setStep(s => (s - 1) as Step)}>← Back</button>
              : <Link href="/register" className="btn btn-outline-dark">← Choose type</Link>
            }
            {step < 4
              ? <button className="btn btn-forest" onClick={() => setStep(s => (s + 1) as Step)}>Continue <ChevronRight className="w-4 h-4" /></button>
              : <button className="btn btn-gold" onClick={() => setSubmitted(true)}>Submit Registration →</button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default function IndividualRegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--surface)' }} />}>
      <IndividualRegisterForm />
    </Suspense>
  )
}
