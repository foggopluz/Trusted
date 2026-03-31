// ─── Transactional Email via Resend ───────────────────────────────────────────
// Set RESEND_API_KEY in your environment to enable.
// Without it, emails are logged to console only (dev/demo mode).
//
// Sign up at https://resend.com — free tier: 100 emails/day.
// Add your verified sending domain and update FROM_ADDRESS below.

function escHtml(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_ADDRESS   = process.env.EMAIL_FROM ?? 'TrustNet <noreply@trustnet.app>'
const IS_EMAIL_ENABLED = !!RESEND_API_KEY

interface EmailPayload {
  to: string
  subject: string
  html: string
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!IS_EMAIL_ENABLED) {
    console.log(`[email] (no RESEND_API_KEY) → ${payload.to} | ${payload.subject}`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    FROM_ADDRESS,
      to:      payload.to,
      subject: payload.subject,
      html:    payload.html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[email] Resend error: ${res.status} ${body}`)
    // Do not throw — email failure should never crash the main flow
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function base(content: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1b5e3b;padding:24px 32px">
        <span style="color:#f0c040;font-size:20px;font-weight:800;letter-spacing:-.5px">TrustNet</span>
      </div>
      <div style="padding:32px">
        ${content}
      </div>
      <div style="padding:16px 32px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center">
        TrustNet · East Africa Trust Verification Platform
      </div>
    </div>
  `
}

// Trust check request notification → sent to the individual being checked
export async function sendTrustCheckRequest(opts: {
  toEmail: string
  toName: string
  businessName: string
  dashboardUrl: string
}): Promise<void> {
  await sendEmail({
    to: opts.toEmail,
    subject: `${escHtml(opts.businessName)} has requested a trust check`,
    html: base(`
      <h2 style="color:#111827;font-size:20px;margin:0 0 12px">Trust check requested</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px">
        Hi <strong>${escHtml(opts.toName)}</strong>,<br><br>
        <strong>${escHtml(opts.businessName)}</strong> has requested access to your TrustNet profile.
        You can approve or deny this request from your dashboard.
      </p>
      <a href="${opts.dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#1b5e3b;color:#f0c040;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
        Review Request →
      </a>
    `),
  })
}

// Verification approved → sent to individual or business
export async function sendVerificationApproved(opts: {
  toEmail: string
  toName: string
  dashboardUrl: string
}): Promise<void> {
  await sendEmail({
    to: opts.toEmail,
    subject: 'Your TrustNet profile has been verified ✓',
    html: base(`
      <h2 style="color:#111827;font-size:20px;margin:0 0 12px">You&apos;re verified!</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px">
        Hi <strong>${escHtml(opts.toName)}</strong>,<br><br>
        Your identity has been successfully verified on TrustNet.
        Your TrustScore is now live and businesses can view your verified profile.
      </p>
      <a href="${opts.dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#1b5e3b;color:#f0c040;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
        View Your Profile →
      </a>
    `),
  })
}

// Verification rejected → sent to individual or business
export async function sendVerificationRejected(opts: {
  toEmail: string
  toName: string
  note?: string
  dashboardUrl: string
}): Promise<void> {
  await sendEmail({
    to: opts.toEmail,
    subject: 'Your TrustNet verification needs attention',
    html: base(`
      <h2 style="color:#111827;font-size:20px;margin:0 0 12px">Verification not approved</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px">
        Hi <strong>${escHtml(opts.toName)}</strong>,<br><br>
        Unfortunately, we were unable to verify your profile at this time.
      </p>
      ${opts.note ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;margin-bottom:20px;font-size:14px;color:#991b1b">${escHtml(opts.note)}</div>` : ''}
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 20px">
        Please re-submit with clearer documentation or contact support if you believe this is an error.
      </p>
      <a href="${opts.dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#1b5e3b;color:#f0c040;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
        Go to Dashboard →
      </a>
    `),
  })
}

// New credential issued → sent to subject
export async function sendCredentialIssued(opts: {
  toEmail: string
  toName: string
  credentialTitle: string
  issuerName: string
  credentialsUrl: string
}): Promise<void> {
  await sendEmail({
    to: opts.toEmail,
    subject: `New credential issued: ${opts.credentialTitle}`,
    html: base(`
      <h2 style="color:#111827;font-size:20px;margin:0 0 12px">New credential on your profile</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px">
        Hi <strong>${escHtml(opts.toName)}</strong>,<br><br>
        <strong>${escHtml(opts.issuerName)}</strong> has issued a new credential to your TrustNet profile:
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;margin-bottom:20px;font-size:15px;font-weight:600;color:#166534">
        ${escHtml(opts.credentialTitle)}
      </div>
      <a href="${opts.credentialsUrl}" style="display:inline-block;padding:12px 24px;background:#1b5e3b;color:#f0c040;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
        View Credentials →
      </a>
    `),
  })
}

// Dispute resolved → sent to filer
export async function sendDisputeResolved(opts: {
  toEmail: string
  toName: string
  action: 'resolved' | 'dismissed'
  resolutionNote?: string
  dashboardUrl: string
}): Promise<void> {
  const resolved = opts.action === 'resolved'
  await sendEmail({
    to: opts.toEmail,
    subject: `Your credential dispute has been ${resolved ? 'resolved' : 'dismissed'}`,
    html: base(`
      <h2 style="color:#111827;font-size:20px;margin:0 0 12px">Dispute ${resolved ? 'resolved' : 'dismissed'}</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px">
        Hi <strong>${escHtml(opts.toName)}</strong>,<br><br>
        Your credential dispute has been <strong>${resolved ? 'resolved' : 'dismissed'}</strong> by the TrustNet admin team.
      </p>
      ${opts.resolutionNote ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin-bottom:20px;font-size:14px;color:#374151">${escHtml(opts.resolutionNote)}</div>` : ''}
      <a href="${opts.dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#1b5e3b;color:#f0c040;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
        View Dashboard →
      </a>
    `),
  })
}
