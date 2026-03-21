import {
  User, Company, Credential, TrustCheck, FinancialInstitution,
  Rating, ChangeRequest,
} from './types'

// ─── Financial Institutions ───────────────────────────────────────────────────
export const financialInstitutions: FinancialInstitution[] = [
  { id: 'fi-1',  name: 'Bank of Tanzania',       type: 'central_bank',    country: 'Tanzania', verified: true,  provenanceWeight: 1.00 },
  { id: 'fi-2',  name: 'Central Bank of Kenya',  type: 'central_bank',    country: 'Kenya',    verified: true,  provenanceWeight: 1.00 },
  { id: 'fi-3',  name: 'CRDB Bank',              type: 'commercial_bank', country: 'Tanzania', verified: true,  provenanceWeight: 0.95 },
  { id: 'fi-4',  name: 'NMB Bank',               type: 'commercial_bank', country: 'Tanzania', verified: true,  provenanceWeight: 0.95 },
  { id: 'fi-5',  name: 'Equity Bank Kenya',      type: 'commercial_bank', country: 'Kenya',    verified: true,  provenanceWeight: 0.95 },
  { id: 'fi-6',  name: 'Standard Chartered',     type: 'commercial_bank', country: 'Tanzania', verified: true,  provenanceWeight: 0.95 },
  { id: 'fi-7',  name: 'FINCA Tanzania',         type: 'microfinance',    country: 'Tanzania', verified: true,  provenanceWeight: 0.80 },
  { id: 'fi-8',  name: 'BRAC Tanzania',          type: 'microfinance',    country: 'Tanzania', verified: true,  provenanceWeight: 0.80 },
  { id: 'fi-9',  name: 'Mwalimu SACCO',          type: 'credit_union',    country: 'Tanzania', verified: true,  provenanceWeight: 0.70 },
  { id: 'fi-10', name: 'Polisi SACCO',           type: 'credit_union',    country: 'Tanzania', verified: true,  provenanceWeight: 0.70 },
  { id: 'fi-11', name: 'Jubilee Insurance',      type: 'insurance',       country: 'Tanzania', verified: true,  provenanceWeight: 0.65 },
  { id: 'fi-12', name: 'AAR Insurance',          type: 'insurance',       country: 'Kenya',    verified: true,  provenanceWeight: 0.65 },
  { id: 'fi-13', name: 'M-Pesa (Vodacom TZ)',    type: 'mobile_money',    country: 'Tanzania', verified: true,  provenanceWeight: 0.60 },
  { id: 'fi-14', name: 'Airtel Money',           type: 'mobile_money',    country: 'Tanzania', verified: true,  provenanceWeight: 0.60 },
  { id: 'fi-15', name: 'M-Pesa (Safaricom KE)',  type: 'mobile_money',    country: 'Kenya',    verified: true,  provenanceWeight: 0.60 },
]

// ─── Users ────────────────────────────────────────────────────────────────────
export const users: User[] = [
  {
    id: 'u-admin', did: 'did:trustnet:admin', phone: '+255700000000',
    email: 'admin@trustnet.co.tz', fullName: 'TrustNet Admin', profession: 'Platform Administrator',
    location: 'Dar es Salaam', country: 'Tanzania', accountType: 'professional',
    idVerificationStatus: 'verified', trustScore: 1000, scoreConfidence: 'high',
    role: 'admin', createdAt: '2024-01-01', memberSince: 'Jan 2024',
  },
  {
    id: 'u-1', did: 'did:trustnet:amina-hassan-tz', phone: '+255712345001',
    email: 'amina@email.com', fullName: 'Amina Hassan', profession: 'UX Designer',
    location: 'Dar es Salaam', country: 'Tanzania', accountType: 'professional',
    idVerificationStatus: 'verified', trustScore: 842, scoreConfidence: 'high',
    role: 'individual', bio: 'Senior UX designer with 7 years building digital products across East Africa.',
    createdAt: '2024-03-15', memberSince: 'Mar 2024',
  },
  {
    id: 'u-2', did: 'did:trustnet:joseph-mwangi-ke', phone: '+254722345002',
    email: 'joseph@email.com', fullName: 'Joseph Mwangi', profession: 'Full-Stack Developer',
    location: 'Nairobi', country: 'Kenya', accountType: 'professional',
    idVerificationStatus: 'verified', trustScore: 671, scoreConfidence: 'medium',
    role: 'individual', bio: 'React/Node developer. Open source contributor. Building for African markets.',
    createdAt: '2024-05-10', memberSince: 'May 2024',
  },
  {
    id: 'u-3', did: 'did:trustnet:fatuma-omar-tz', phone: '+255712345003',
    email: 'fatuma@email.com', fullName: 'Fatuma Omar', profession: 'Project Manager',
    location: 'Zanzibar', country: 'Tanzania', accountType: 'professional',
    idVerificationStatus: 'verified', trustScore: 755, scoreConfidence: 'high',
    role: 'individual', bio: 'PMP-certified project manager. 5+ years in infrastructure and fintech projects.',
    createdAt: '2024-04-01', memberSince: 'Apr 2024',
  },
  {
    id: 'u-4', did: 'did:trustnet:ibrahim-said-tz', phone: '+255712345004',
    email: 'ibrahim@email.com', fullName: 'Ibrahim Said', profession: 'Graphic Designer',
    location: 'Arusha', country: 'Tanzania', accountType: 'job_seeker',
    idVerificationStatus: 'pending', trustScore: 312, scoreConfidence: 'low',
    role: 'individual', createdAt: '2025-01-20', memberSince: 'Jan 2025',
  },
  {
    id: 'u-5', did: 'did:trustnet:grace-john-tz', phone: '+255712345005',
    email: 'grace@email.com', fullName: 'Grace John', profession: 'Financial Analyst',
    location: 'Dar es Salaam', country: 'Tanzania', accountType: 'professional',
    idVerificationStatus: 'verified', trustScore: 589, scoreConfidence: 'medium',
    role: 'individual', bio: 'CFA candidate. Specializing in SME lending and credit risk in East Africa.',
    createdAt: '2024-07-12', memberSince: 'Jul 2024',
  },
  {
    id: 'u-6', did: 'did:trustnet:david-omondi-ke', phone: '+254722345006',
    email: 'david@email.com', fullName: 'David Omondi', profession: 'Data Scientist',
    location: 'Nairobi', country: 'Kenya', accountType: 'professional',
    idVerificationStatus: 'verified', trustScore: 720, scoreConfidence: 'high',
    role: 'individual', bio: 'ML engineer specializing in NLP and fintech data pipelines.',
    createdAt: '2024-06-05', memberSince: 'Jun 2024',
  },
]

// ─── Companies ────────────────────────────────────────────────────────────────
export const companies: Company[] = [
  {
    id: 'co-1', ownerUserId: 'u-admin',
    businessName: 'Simba Tech Solutions',
    tinNumber: 'TIN-100-111-222', industry: 'Technology',
    country: 'Tanzania', address: '14 Samora Avenue, Dar es Salaam',
    contactPhone: '+255222100001', contactEmail: 'info@simbatech.co.tz',
    website: 'simbatech.co.tz',
    description: 'East Africa\'s leading software development firm, specializing in fintech and agritech solutions.',
    verificationStatus: 'verified', subscriptionPlan: 'pro',
    checksRemaining: 47, checksUsed: 28, foundedAt: '2019-03-01', memberSince: 'Mar 2019',
  },
  {
    id: 'co-2', ownerUserId: 'u-3',
    businessName: 'Kilimo Digital Ltd',
    tinNumber: 'TIN-200-333-444', industry: 'Agritech',
    country: 'Tanzania', address: '22 Uhuru Street, Dodoma',
    contactPhone: '+255222200002', contactEmail: 'hello@kilimo.tz',
    website: 'kilimo.tz',
    description: 'Digital platforms connecting smallholder farmers to markets, inputs and financial services.',
    verificationStatus: 'verified', subscriptionPlan: 'basic',
    checksRemaining: 18, checksUsed: 7, foundedAt: '2021-08-15', memberSince: 'Aug 2021',
  },
  {
    id: 'co-3', ownerUserId: 'u-2',
    businessName: 'Savanna Consulting Group',
    tinNumber: 'KRA-300-555-666', industry: 'Management Consulting',
    country: 'Kenya', address: 'Westlands, Nairobi',
    contactPhone: '+254722300003', contactEmail: 'contact@savanna.co.ke',
    website: 'savanna.co.ke',
    description: 'Strategic consulting for African enterprises entering digital transformation.',
    verificationStatus: 'verified', subscriptionPlan: 'enterprise',
    checksRemaining: 200, checksUsed: 54, foundedAt: '2020-01-10', memberSince: 'Jan 2020',
  },
  {
    id: 'co-4', ownerUserId: 'u-4',
    businessName: 'Bora Creative Studio',
    tinNumber: 'TIN-400-777-888', industry: 'Creative Agency',
    country: 'Tanzania', address: 'Arusha City Centre',
    contactPhone: '+255712400004', contactEmail: 'hello@boracreative.tz',
    description: 'Brand strategy, design and digital marketing for ambitious African brands.',
    verificationStatus: 'pending', subscriptionPlan: 'free',
    checksRemaining: 3, checksUsed: 0, foundedAt: '2024-11-01', memberSince: 'Nov 2024',
  },
]

// ─── Credentials ──────────────────────────────────────────────────────────────
export const credentials: Credential[] = [
  // Amina Hassan (u-1) — high score
  { id: 'cr-1',  subjectUserId: 'u-1', issuerUserId: 'u-admin',      credentialType: 'identity',     title: 'NIDA Verified Identity',           claim: { nida: 'NIDA-1234-5678', verified: true },          proofHash: 'sha256:abc001', confidence: 0.98, status: 'active', issuedAt: '2025-09-01' },
  { id: 'cr-2',  subjectUserId: 'u-1', issuerInstitutionId: 'fi-3',  credentialType: 'financial',    title: 'CRDB Bank — Account Standing',     claim: { accountAge: '6y', avgBalance: 'TZS 4.2M' },       proofHash: 'sha256:abc002', confidence: 0.92, status: 'active', issuedAt: '2025-10-15' },
  { id: 'cr-3',  subjectUserId: 'u-1', issuerCompanyId: 'co-1',      credentialType: 'work_history', title: 'Simba Tech — Senior Designer',     claim: { role: 'Senior UX Designer', duration: '2y 3m' },   proofHash: 'sha256:abc003', confidence: 0.95, status: 'active', issuedAt: '2025-08-01' },
  { id: 'cr-4',  subjectUserId: 'u-1', issuerUserId: 'u-2',          credentialType: 'endorsement',  title: 'Joseph Mwangi — Endorsement',      claim: { skill: 'UI/UX Design' },                           proofHash: 'sha256:abc004', confidence: 0.85, status: 'active', issuedAt: '2025-11-01' },
  { id: 'cr-5',  subjectUserId: 'u-1', issuerUserId: 'u-admin',      credentialType: 'skill',        title: 'Figma Certified Professional',     claim: { level: 'Advanced' },                               proofHash: 'sha256:abc005', confidence: 0.90, status: 'active', issuedAt: '2025-07-20' },
  { id: 'cr-6',  subjectUserId: 'u-1', issuerInstitutionId: 'fi-13', credentialType: 'financial',    title: 'M-Pesa — Payment History',         claim: { transactions: 240, reliability: '99.2%' },         proofHash: 'sha256:abc006', confidence: 0.78, status: 'active', issuedAt: '2025-10-01' },
  // Joseph Mwangi (u-2)
  { id: 'cr-7',  subjectUserId: 'u-2', issuerUserId: 'u-admin',      credentialType: 'identity',     title: 'Huduma Namba Verified',            claim: { huduma: 'HN-5678-9012' },                          proofHash: 'sha256:def001', confidence: 0.97, status: 'active', issuedAt: '2025-06-01' },
  { id: 'cr-8',  subjectUserId: 'u-2', issuerInstitutionId: 'fi-5',  credentialType: 'financial',    title: 'Equity Bank Kenya — Account',      claim: { accountAge: '3y' },                                proofHash: 'sha256:def002', confidence: 0.88, status: 'active', issuedAt: '2025-08-10' },
  { id: 'cr-9',  subjectUserId: 'u-2', issuerCompanyId: 'co-3',      credentialType: 'work_history', title: 'Savanna Consulting — Dev Lead',    claim: { role: 'Lead Developer', duration: '1y 6m' },       proofHash: 'sha256:def003', confidence: 0.90, status: 'active', issuedAt: '2025-05-15' },
  // Fatuma Omar (u-3)
  { id: 'cr-10', subjectUserId: 'u-3', issuerUserId: 'u-admin',      credentialType: 'identity',     title: 'NIDA Verified Identity',           claim: { nida: 'NIDA-7890-1234' },                          proofHash: 'sha256:ghi001', confidence: 0.98, status: 'active', issuedAt: '2025-04-01' },
  { id: 'cr-11', subjectUserId: 'u-3', issuerInstitutionId: 'fi-4',  credentialType: 'financial',    title: 'NMB Bank — Account Standing',      claim: { accountAge: '4y' },                                proofHash: 'sha256:ghi002', confidence: 0.91, status: 'active', issuedAt: '2025-10-01' },
  { id: 'cr-12', subjectUserId: 'u-3', issuerCompanyId: 'co-1',      credentialType: 'work_history', title: 'Simba Tech — Project Manager',     claim: { role: 'Senior PM', duration: '3y', delivered: 12 }, proofHash: 'sha256:ghi003', confidence: 0.94, status: 'active', issuedAt: '2025-09-20' },
  { id: 'cr-13', subjectUserId: 'u-3', issuerUserId: 'u-1',          credentialType: 'endorsement',  title: 'Amina Hassan — Endorsement',       claim: { skill: 'Project Delivery' },                       proofHash: 'sha256:ghi004', confidence: 0.87, status: 'active', issuedAt: '2025-11-05' },
  // Ibrahim Said (u-4) — pending
  { id: 'cr-14', subjectUserId: 'u-4', issuerUserId: 'u-admin',      credentialType: 'identity',     title: 'NIDA Verification (Pending)',      claim: { status: 'under_review' },                          proofHash: 'sha256:jkl001', confidence: 0.50, status: 'pending', issuedAt: '2026-01-20' },
  // Grace John (u-5)
  { id: 'cr-15', subjectUserId: 'u-5', issuerUserId: 'u-admin',      credentialType: 'identity',     title: 'NIDA Verified Identity',           claim: { nida: 'NIDA-2345-6789' },                          proofHash: 'sha256:mno001', confidence: 0.97, status: 'active', issuedAt: '2025-07-01' },
  { id: 'cr-16', subjectUserId: 'u-5', issuerInstitutionId: 'fi-3',  credentialType: 'financial',    title: 'CRDB Bank — Savings Account',      claim: { accountAge: '2y' },                                proofHash: 'sha256:mno002', confidence: 0.85, status: 'active', issuedAt: '2025-09-15' },
  // David Omondi (u-6)
  { id: 'cr-17', subjectUserId: 'u-6', issuerUserId: 'u-admin',      credentialType: 'identity',     title: 'Huduma Namba Verified',            claim: { huduma: 'HN-1111-2222' },                          proofHash: 'sha256:pqr001', confidence: 0.97, status: 'active', issuedAt: '2025-06-10' },
  { id: 'cr-18', subjectUserId: 'u-6', issuerInstitutionId: 'fi-5',  credentialType: 'financial',    title: 'Equity Bank — Account',            claim: { accountAge: '4y' },                                proofHash: 'sha256:pqr002', confidence: 0.90, status: 'active', issuedAt: '2025-08-20' },
  { id: 'cr-19', subjectUserId: 'u-6', issuerCompanyId: 'co-3',      credentialType: 'work_history', title: 'Savanna Consulting — Data Lead',   claim: { role: 'Data Science Lead', duration: '2y' },       proofHash: 'sha256:pqr003', confidence: 0.93, status: 'active', issuedAt: '2025-07-01' },
  { id: 'cr-20', subjectUserId: 'u-6', issuerUserId: 'u-2',          credentialType: 'endorsement',  title: 'Joseph Mwangi — Endorsement',      claim: { skill: 'Machine Learning' },                       proofHash: 'sha256:pqr004', confidence: 0.84, status: 'active', issuedAt: '2025-10-15' },
]

// ─── Trust Checks ─────────────────────────────────────────────────────────────
export const trustChecks: TrustCheck[] = [
  { id: 'tc-1', requesterCompanyId: 'co-1', subjectUserId: 'u-1', consentStatus: 'granted', scoreAtCheck: 842, riskTier: 'low',    credentialsShared: ['cr-1','cr-2','cr-3'], createdAt: '2025-11-20' },
  { id: 'tc-5', requesterCompanyId: 'co-2', subjectUserId: 'u-1', consentStatus: 'pending',                                        credentialsShared: [],                      createdAt: '2026-03-18' },
  { id: 'tc-2', requesterCompanyId: 'co-1', subjectUserId: 'u-2', consentStatus: 'granted', scoreAtCheck: 671, riskTier: 'medium', credentialsShared: ['cr-7','cr-8'],        createdAt: '2025-11-18' },
  { id: 'tc-3', requesterCompanyId: 'co-1', subjectUserId: 'u-5', consentStatus: 'pending',                                       credentialsShared: [],                      createdAt: '2025-12-01' },
  { id: 'tc-4', requesterCompanyId: 'co-3', subjectUserId: 'u-6', consentStatus: 'granted', scoreAtCheck: 720, riskTier: 'low',    credentialsShared: ['cr-17','cr-18','cr-19'], createdAt: '2025-10-10' },
]

// ─── Ratings ──────────────────────────────────────────────────────────────────
export const ratings: Rating[] = [
  { id: 'r-1', raterId: 'u-2', raterName: 'Joseph Mwangi',  targetId: 'u-1',  targetType: 'user',    stars: 5, comment: 'Amina delivers exceptional work every time. Highly professional.', createdAt: '2025-11-25' },
  { id: 'r-2', raterId: 'u-3', raterName: 'Fatuma Omar',    targetId: 'u-1',  targetType: 'user',    stars: 5, comment: 'Great collaborator. Always on time.', createdAt: '2025-10-30' },
  { id: 'r-3', raterId: 'u-1', raterName: 'Amina Hassan',   targetId: 'u-2',  targetType: 'user',    stars: 4, comment: 'Solid developer, communicates well.', createdAt: '2025-09-15' },
  { id: 'r-4', raterId: 'u-6', raterName: 'David Omondi',   targetId: 'u-3',  targetType: 'user',    stars: 5, comment: 'Best PM I have ever worked with.', createdAt: '2025-11-01' },
  { id: 'r-5', raterId: 'u-1', raterName: 'Amina Hassan',   targetId: 'co-1', targetType: 'company', stars: 5, comment: 'Professional, pays on time, great culture.', createdAt: '2025-11-10' },
  { id: 'r-6', raterId: 'u-2', raterName: 'Joseph Mwangi',  targetId: 'co-1', targetType: 'company', stars: 4, comment: 'Good company to work with. Structured processes.', createdAt: '2025-10-05' },
  { id: 'r-7', raterId: 'u-5', raterName: 'Grace John',     targetId: 'co-2', targetType: 'company', stars: 4, comment: 'Innovative team, flexible working arrangements.', createdAt: '2025-09-20' },
  { id: 'r-8', raterId: 'u-1', raterName: 'Amina Hassan',   targetId: 'u-6',  targetType: 'user',    stars: 4, comment: 'Sharp analytical mind, very collaborative.', createdAt: '2025-10-22' },
]

// ─── Change Requests ──────────────────────────────────────────────────────────
export const changeRequests: ChangeRequest[] = [
  {
    id: 'chg-1', companyId: 'co-2', companyName: 'Kilimo Digital Ltd',
    requestedBy: 'u-3', field: 'business_name',
    currentValue: 'Kilimo Digital Ltd', requestedValue: 'Kilimo Digital Africa Ltd',
    reason: 'We have expanded operations to Kenya and Uganda and updated our legal name.',
    status: 'pending', createdAt: '2026-03-10',
  },
  {
    id: 'chg-2', companyId: 'co-1', companyName: 'Simba Tech Solutions',
    requestedBy: 'u-admin', field: 'contact_phone',
    currentValue: '+255222100001', requestedValue: '+255222100099',
    reason: 'New office line installed after building relocation.',
    status: 'approved', createdAt: '2026-02-20', resolvedAt: '2026-02-22', resolvedBy: 'u-admin',
  },
]

// ─── Pending Verifications ────────────────────────────────────────────────────
export const pendingVerifications = [
  { id: 'pv-1', name: 'Ibrahim Said',         type: 'individual', document: 'NIDA Application — TZ-202601-4892',      submittedAt: '2026-01-20' },
  { id: 'pv-2', name: 'Bora Creative Studio', type: 'business',   document: 'Business Registration — BRELA/2024/11234', submittedAt: '2026-01-15' },
]
