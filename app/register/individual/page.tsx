'use client'
import { useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, ChevronRight, CheckCircle, Upload, X, FileText, Loader2 } from 'lucide-react'
import { COUNTRY_VERIFICATION_METHODS, VERIFICATION_METHOD_LABELS } from '@/lib/types'
import { createSupabaseBrowserClient, IS_DEMO_MODE, uploadDocument } from '@/lib/supabase'

const COUNTRIES = Object.keys(COUNTRY_VERIFICATION_METHODS)
type Step = 1 | 2 | 3 | 4
const STEPS = [
  { n: 1, label: 'Personal Info' },
  { n: 2, label: 'Account Type' },
  { n: 3, label: 'ID Verification' },
  { n: 4, label: 'Review' },
]

function IndividualRegisterForm() {
  const router = useRouter()
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
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [idFile, setIdFile] = useState<File | null>(null)
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function handleFileSelect(file: File) {
    if (file.size > 5 * 1024 * 1024) { setErrors(['File too large — max 5 MB.']); return }
    setIdFile(file)
    setErrors([])
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => setIdPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setIdPreview(null)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  function removeFile() {
    setIdFile(null); setIdPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function validateStep(s: Step): string[] {
    if (s === 1) {
      const errs: string[] = []
      if (!form.fullName.trim())   errs.push('Full name is required.')
      if (!form.phone.trim() && !form.email.trim()) errs.push('Phone or email is required.')
      if (!form.city.trim())       errs.push('City is required.')
      if (!form.profession.trim()) errs.push('Profession is required.')
      return errs
    }
    if (s === 3) {
      const errs: string[] = []
      if (!form.idNumber.trim())    errs.push('ID number is required.')
      if (!idFile)                  errs.push('Please upload your ID document.')
      if (!form.password.trim())    errs.push('Password is required.')
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

    if (!IS_DEMO_MODE && form.email && form.password) {
      try {
        const client = createSupabaseBrowserClient()

        // 1. Sign up with Supabase Auth
        const { data: authData, error: signUpError } = await client.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.fullName, role: 'individual' },
          },
        })

        if (signUpError) {
          setErrors([signUpError.message])
          setLoading(false)
          return
        }

        const userId = authData.user?.id
        if (!userId) {
          setErrors(['Account created — please check your email to verify before logging in.'])
          setLoading(false)
          setSubmitted(true)
          return
        }

        // 2. Upload ID document to Supabase Storage (stores path, not public URL)
        let documentUrl: string | null = null
        if (idFile) {
          try {
            documentUrl = await uploadDocument(client, userId, idFile, 'id-doc')
          } catch (uploadErr) {
            setErrors([uploadErr instanceof Error ? uploadErr.message : 'Document upload failed. Please try again.'])
            setLoading(false)
            return
          }
        }

        // 3. Insert profile row
        const { error: profileError } = await client.from('profiles').insert({
          id: userId,
          full_name: form.fullName,
          email: form.email,
          phone: form.phone || null,
          country: form.country,
          city: form.city || null,
          profession: form.profession || null,
          account_type: form.accountType,
          role: 'individual',
          verification_method: form.verificationMethod,
          id_number: form.idNumber || null,
          id_verification_status: 'pending',
          document_url: documentUrl,
          did: `did:trustnet:${userId}`,
          member_since: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        })

        if (profileError && !profileError.message.includes('duplicate')) {
          setErrors([profileError.message])
          setLoading(false)
          return
        }

        // 4. Insert a pending identity credential
        await client.from('credentials').insert({
          user_id: userId,
          type: 'identity',
          title: `${VERIFICATION_METHOD_LABELS[form.verificationMethod as keyof typeof VERIFICATION_METHOD_LABELS] || form.verificationMethod} Verification`,
          issuer_name: 'TrustNet Verification',
          issuer_type: 'government',
          provenance_weight: 0.98,
          status: 'pending',
          confidence: 0.9,
          document_url: documentUrl,
        })

      } catch (err) {
        setErrors([err instanceof Error ? err.message : 'An unexpected error occurred.'])
        setLoading(false)
        return
      }
    } else {
      // Demo mode — store full profile in sessionStorage
      if (form.email && form.password) {
        try {
          const profile = {
            email: form.email, password: form.password,
            name: form.fullName, fullName: form.fullName,
            phone: form.phone, country: form.country,
            city: form.city, profession: form.profession,
            accountType: form.accountType,
            role: 'individual' as const,
          }
          const existing = JSON.parse(sessionStorage.getItem('tn_demo_users') || '[]') as typeof profile[]
          const updated = existing.filter(u => u.email !== form.email)
          updated.push(profile)
          sessionStorage.setItem('tn_demo_users', JSON.stringify(updated))
        } catch { /* ignore */ }
      }
    }

    setLoading(false)
    setSubmitted(true)
  }

  const methods = COUNTRY_VERIFICATION_METHODS[form.country] || COUNTRY_VERIFICATION_METHODS['Other']

  // ── Submitted ─────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 520 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--risk-low-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle className="w-8 h-8" style={{ color: 'var(--risk-low)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 500, color: 'var(--text)', marginBottom: 14 }}>
            Registration submitted!
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 24 }}>
            Your identity verification is under review.
            {form.email && <> You&apos;ll receive a confirmation at <strong>{form.email}</strong>.</>}
          </p>

          {!IS_DEMO_MODE && (
            <div style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold-border)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, textAlign: 'left', fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6 }}>
              <strong>Next step:</strong> Check your email for a verification link from Supabase. Click it, then log in with your email and password.
            </div>
          )}

          {IS_DEMO_MODE && form.email && (
            <div style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold-border)', borderRadius: 10, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Your login credentials</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Email</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{form.email}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Password</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{'•'.repeat(form.password.length)}</strong>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-forest">Log In Now →</Link>
            <Link href="/dashboard" className="btn btn-outline-dark">Demo Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <header style={{ background: 'rgba(7,14,8,.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield className="w-4 h-4" style={{ color: '#fff' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: '#fff' }}>TrustNet</span>
          </Link>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>Individual Registration</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 48 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step > s.n ? 'var(--risk-low)' : step === s.n ? 'var(--forest)' : 'var(--surface-2)', color: step >= s.n ? '#fff' : 'var(--text-faint)', fontSize: 13, fontWeight: 600, transition: 'all .2s' }}>
                  {step > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
                </div>
                <span style={{ fontSize: 13, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? 'var(--text)' : 'var(--text-muted)' }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: step > s.n ? 'var(--forest-lt)' : 'var(--border)', margin: '0 8px', transition: 'background .2s' }} />
              )}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '40px 36px' }}>

          {/* Step 1 */}
          {step === 1 && (
            <div className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Personal Information</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>Basic details that will appear on your profile.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px,100%),1fr))', gap: 18 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label">Full Legal Name</label>
                  <input className="input" placeholder="As it appears on your ID" value={form.fullName} onChange={e => update('fullName', e.target.value)} />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input className="input" placeholder="+255 712 345 678" value={form.phone} onChange={e => update('phone', e.target.value)} />
                </div>
                <div>
                  <label className="label">Email Address <span style={{ color: 'var(--risk-high)' }}>*</span></label>
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

          {/* Step 2 */}
          {step === 2 && (
            <div className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Account Type</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>How are you primarily using TrustNet?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { value: 'job_seeker', label: 'Job Seeker', desc: 'Looking for employment. My profile helps employers verify my background.' },
                  { value: 'professional', label: 'Professional / Freelancer', desc: 'Offering services to clients. I need a portable verified reputation.' },
                ].map(opt => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 20px', borderRadius: 10, border: `2px solid ${form.accountType === opt.value ? 'var(--forest)' : 'var(--border)'}`, background: form.accountType === opt.value ? 'var(--forest-pale)' : 'var(--white)', cursor: 'pointer', transition: 'all .15s' }}>
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

          {/* Step 3 */}
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

              {/* File upload */}
              <div style={{ marginBottom: 24 }}>
                <label className="label">Upload ID Document <span style={{ color: 'var(--risk-high)' }}>*</span></label>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />

                {idFile ? (
                  <div style={{ border: '2px solid var(--forest-lt)', borderRadius: 10, overflow: 'hidden', background: 'var(--forest-pale)' }}>
                    {idPreview
                      ? <div style={{ height: 180, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={idPreview} alt="ID preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                        </div>
                      : <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', gap: 10 }}>
                          <FileText style={{ width: 28, height: 28, color: 'var(--forest-mid)' }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-mid)' }}>PDF document</span>
                        </div>
                    }
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{idFile.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(idFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button type="button" onClick={removeFile} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--risk-high)', background: 'var(--risk-high-bg)', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>
                        <X style={{ width: 12, height: 12 }} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    role="button" tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    style={{ border: `2px dashed ${dragOver ? 'var(--forest-mid)' : 'var(--border)'}`, borderRadius: 10, padding: '36px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'var(--forest-pale)' : 'var(--surface)', transition: 'border-color .15s, background .15s' }}
                  >
                    <Upload className="w-7 h-7 mx-auto mb-3" style={{ color: dragOver ? 'var(--forest-mid)' : 'var(--text-faint)' }} />
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-mid)', marginBottom: 4 }}>{dragOver ? 'Drop to upload' : 'Drop your ID here or click to browse'}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>JPG, PNG or PDF — max 5 MB</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px,100%),1fr))', gap: 16 }}>
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

          {/* Step 4 */}
          {step === 4 && (
            <div className="fade-in">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Review & Submit</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>Confirm your details before submitting.</p>
              <div style={{ background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 28 }}>
                {[
                  { label: 'Full Name',           value: form.fullName || '—' },
                  { label: 'Email',               value: form.email || '—' },
                  { label: 'Phone',               value: form.phone || '—' },
                  { label: 'Country',             value: form.country },
                  { label: 'City',                value: form.city || '—' },
                  { label: 'Profession',          value: form.profession || '—' },
                  { label: 'Account Type',        value: form.accountType === 'job_seeker' ? 'Job Seeker' : 'Professional / Freelancer' },
                  { label: 'Verification',        value: VERIFICATION_METHOD_LABELS[form.verificationMethod as keyof typeof VERIFICATION_METHOD_LABELS] || form.verificationMethod },
                  { label: 'ID Document',         value: idFile ? idFile.name : '—' },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{ display: 'flex', padding: '13px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--border-lt)' : 'none', gap: 16 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 160, flexShrink: 0 }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {row.label === 'ID Document' && idFile && <CheckCircle style={{ width: 13, height: 13, color: 'var(--risk-low)' }} />}
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, cursor: 'pointer' }}>
                <input type="checkbox" style={{ marginTop: 2, accentColor: 'var(--forest)' }} />
                I confirm this information is accurate and agree to TrustNet&apos;s{' '}
                <Link href="/terms" style={{ color: 'var(--forest-mid)', textDecoration: 'none' }}>Terms of Service</Link>{' '}
                and{' '}
                <Link href="/privacy" style={{ color: 'var(--forest-mid)', textDecoration: 'none' }}>Privacy Policy</Link>.
              </label>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <ul style={{ margin: '16px 0 0', padding: '12px 16px', background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high)', borderRadius: 8, listStyle: 'disc', paddingLeft: 32 }}>
              {errors.map((e, i) => <li key={i} style={{ fontSize: 13, color: 'var(--risk-high)', lineHeight: 1.6 }}>{e}</li>)}
            </ul>
          )}

          {/* Nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            {step > 1
              ? <button className="btn btn-outline-dark" onClick={() => { setErrors([]); setStep(s => (s - 1) as Step) }}>← Back</button>
              : <Link href="/register" className="btn btn-outline-dark">← Choose type</Link>
            }
            {step < 4
              ? <button className="btn btn-forest" onClick={handleContinue}>Continue <ChevronRight className="w-4 h-4" /></button>
              : <button className="btn btn-gold" onClick={handleSubmit} disabled={loading} style={{ opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Submitting…' : 'Submit Registration →'}
                </button>
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
