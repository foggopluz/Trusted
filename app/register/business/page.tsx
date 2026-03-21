'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Shield, ChevronRight, CheckCircle, Upload } from 'lucide-react'
import { COUNTRY_VERIFICATION_METHODS } from '@/lib/types'

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
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--risk-low-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle className="w-8 h-8" style={{ color: 'var(--risk-low)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 500, color: 'var(--text)', marginBottom: 14 }}>Business application submitted!</h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 32 }}>
            Your business registration is under review. Our team will verify your documents and activate your account within 2–5 business days.
          </p>
          <Link href="/business/dashboard" className="btn btn-forest" style={{ marginRight: 12 }}>Business Portal</Link>
          <Link href="/" className="btn btn-outline-dark">Back to Home</Link>
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
        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 48 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step > s.n ? 'var(--risk-low)' : step === s.n ? 'var(--gold)' : 'var(--surface-2)', color: step >= s.n ? '#fff' : 'var(--text-faint)', fontSize: 13, fontWeight: 600, transition: 'all .2s' }}>
                  {step > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
                </div>
                <span style={{ fontSize: 13, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? 'var(--text)' : 'var(--text-muted)', display: 'none' }} className="sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: step > s.n ? 'var(--gold)' : 'var(--border)', margin: '0 8px', transition: 'background .2s' }} />
              )}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '40px 36px' }}>
          {step === 1 && (
            <div className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Business Information</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>Your company's public-facing information.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">Legal Business Name</label>
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
                  <label className="label">City</label>
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
                Business registration numbers are verified against official government registries. This process may take 2–5 business days.
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
                  <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: 'var(--surface)' }}>
                    <Upload className="w-6 h-6 mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-mid)' }}>Drop certificate here or click to browse</p>
                    <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>PDF, JPG, PNG — max 10 MB</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Contact Person</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>The authorised representative for this account.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">Full Name</label>
                  <input className="input" placeholder="Director or authorised representative" value={form.contactName} onChange={e => update('contactName', e.target.value)} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" placeholder="+255 712 …" value={form.contactPhone} onChange={e => update('contactPhone', e.target.value)} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="director@company.com" value={form.contactEmail} onChange={e => update('contactEmail', e.target.value)} />
                </div>
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

          {step === 4 && (
            <div className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Review & Submit</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>Confirm all details before submitting for verification.</p>
              <div style={{ background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 28 }}>
                {[
                  { label: 'Business Name', value: form.businessName || '—' },
                  { label: 'Industry', value: form.industry },
                  { label: 'Country', value: form.country },
                  { label: 'City', value: form.city || '—' },
                  { label: 'Address', value: form.address || '—' },
                  { label: 'TIN', value: form.tinNumber || '—' },
                  { label: 'Reg. Number', value: form.registrationNumber || '—' },
                  { label: 'Contact Name', value: form.contactName || '—' },
                  { label: 'Contact Phone', value: form.contactPhone || '—' },
                  { label: 'Contact Email', value: form.contactEmail || '—' },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{ display: 'flex', padding: '12px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--border-lt)' : 'none', gap: 16 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 160, flexShrink: 0 }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, cursor: 'pointer' }}>
                <input type="checkbox" style={{ marginTop: 2, accentColor: 'var(--gold)' }} />
                I am an authorised representative of this business and confirm all information is accurate. I agree to TrustNet's Terms of Service.
              </label>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            {step > 1
              ? <button className="btn btn-outline-dark" onClick={() => setStep(s => (s - 1) as Step)}>← Back</button>
              : <Link href="/register" className="btn btn-outline-dark">← Account types</Link>
            }
            {step < 4
              ? <button className="btn btn-gold" onClick={() => setStep(s => (s + 1) as Step)}>Continue <ChevronRight className="w-4 h-4" /></button>
              : <button className="btn btn-gold" onClick={() => setSubmitted(true)}>Submit Application →</button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
