// ─── Internationalisation ─────────────────────────────────────────────────────
//
// Lightweight dictionary-based i18n. No external package required.
// Language preference is stored in localStorage under the key "trustnet_lang".
//
// Supported locales: en (English), sw (Swahili), fr (French)
//
// Usage:
//   const { t, lang, setLang } = useLanguage()
//   t('nav.dashboard')   // → "Dashboard" | "Dashibodi" | "Tableau de bord"

export type Locale = 'en' | 'sw' | 'fr'

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  sw: 'Kiswahili',
  fr: 'Français',
}

export const LOCALES: Locale[] = ['en', 'sw', 'fr']

// ─── Translation dictionary ───────────────────────────────────────────────────

type Dict = typeof EN
type DotPaths<T, Prefix extends string = ''> =
  T extends string
    ? Prefix
    : { [K in keyof T]: K extends string
        ? DotPaths<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
        : never
      }[keyof T]

export type TKey = DotPaths<Dict>

const EN = {
  nav: {
    dashboard:    'Dashboard',
    credentials:  'Credentials',
    profile:      'Profile',
    lookup:       'Lookup',
    admin:        'Admin',
    logout:       'Sign Out',
    login:        'Sign In',
    register:     'Register',
    business:     'Business',
  },
  score: {
    title:        'TrustScore',
    outOf:        '/ 1000',
    low:          'Low Risk',
    medium:       'Medium Risk',
    high:         'High Risk',
    noData:       'No score yet',
    lastUpdated:  'Updated',
  },
  credentials: {
    title:        'Credentials',
    add:          'Add Credential',
    none:         'No credentials yet',
    pending:      'Pending',
    approved:     'Approved',
    rejected:     'Rejected',
    expired:      'Expired',
    issuer:       'Issuer',
    issued:       'Issued',
    expires:      'Expires',
    type:         {
      identity:     'Identity',
      financial:    'Financial',
      work_history: 'Employment',
      endorsement:  'Endorsement',
      skill:        'Skill',
    },
  },
  trustChecks: {
    title:        'Trust Checks',
    request:      'Request Check',
    pending:      'Awaiting your response',
    granted:      'Access granted',
    denied:       'Access denied',
    grant:        'Grant Access',
    deny:         'Deny Access',
  },
  common: {
    loading:      'Loading…',
    save:         'Save',
    cancel:       'Cancel',
    confirm:      'Confirm',
    delete:       'Delete',
    edit:         'Edit',
    close:        'Close',
    back:         'Back',
    next:         'Next',
    submit:       'Submit',
    success:      'Success',
    error:        'Something went wrong',
    required:     'Required',
    optional:     'Optional',
    search:       'Search',
    filter:       'Filter',
    noResults:    'No results found',
    seeAll:       'See all',
    viewProfile:  'View Profile',
  },
  auth: {
    signIn:       'Sign In',
    signUp:       'Sign Up',
    email:        'Email',
    password:     'Password',
    forgot:       'Forgot password?',
    reset:        'Reset Password',
    orContinue:   'or continue with',
    noAccount:    "Don't have an account?",
    hasAccount:   'Already have an account?',
  },
  privacy: {
    title:        'Privacy Settings',
    public:       'Public',
    verified:     'Verified users only',
    private:      'Only me',
    score:        'TrustScore visibility',
    credentials:  'Credentials visibility',
    contacts:     'Contact info visibility',
    location:     'Location visibility',
    profession:   'Profession visibility',
    endorsements: 'Endorsements visibility',
  },
}

const SW: Dict = {
  nav: {
    dashboard:    'Dashibodi',
    credentials:  'Hati',
    profile:      'Wasifu',
    lookup:       'Tafuta',
    admin:        'Msimamizi',
    logout:       'Toka',
    login:        'Ingia',
    register:     'Jiandikishe',
    business:     'Biashara',
  },
  score: {
    title:        'Alama ya Uaminifu',
    outOf:        '/ 1000',
    low:          'Hatari Ndogo',
    medium:       'Hatari ya Kati',
    high:         'Hatari Kubwa',
    noData:       'Bado hakuna alama',
    lastUpdated:  'Imesasishwa',
  },
  credentials: {
    title:        'Hati',
    add:          'Ongeza Hati',
    none:         'Bado hakuna hati',
    pending:      'Inasubiri',
    approved:     'Imekubaliwa',
    rejected:     'Imekataliwa',
    expired:      'Imeisha',
    issuer:       'Mtoa Hati',
    issued:       'Ilitolewa',
    expires:      'Inaisha',
    type: {
      identity:     'Utambulisho',
      financial:    'Fedha',
      work_history: 'Ajira',
      endorsement:  'Idhini',
      skill:        'Ujuzi',
    },
  },
  trustChecks: {
    title:        'Ukaguzi wa Uaminifu',
    request:      'Omba Ukaguzi',
    pending:      'Inasubiri jibu lako',
    granted:      'Ruhusa imetolewa',
    denied:       'Ruhusa imekataliwa',
    grant:        'Toa Ruhusa',
    deny:         'Kataa Ruhusa',
  },
  common: {
    loading:      'Inapakia…',
    save:         'Hifadhi',
    cancel:       'Ghairi',
    confirm:      'Thibitisha',
    delete:       'Futa',
    edit:         'Hariri',
    close:        'Funga',
    back:         'Rudi',
    next:         'Endelea',
    submit:       'Wasilisha',
    success:      'Imefanikiwa',
    error:        'Hitilafu imetokea',
    required:     'Inahitajika',
    optional:     'Si lazima',
    search:       'Tafuta',
    filter:       'Chuja',
    noResults:    'Hakuna matokeo',
    seeAll:       'Ona yote',
    viewProfile:  'Ona Wasifu',
  },
  auth: {
    signIn:       'Ingia',
    signUp:       'Jiandikishe',
    email:        'Barua pepe',
    password:     'Nywila',
    forgot:       'Umesahau nywila?',
    reset:        'Rejesha Nywila',
    orContinue:   'au endelea na',
    noAccount:    'Huna akaunti?',
    hasAccount:   'Una akaunti tayari?',
  },
  privacy: {
    title:        'Mipangilio ya Faragha',
    public:       'Wazi kwa wote',
    verified:     'Watumiaji waliothibitishwa tu',
    private:      'Mimi tu',
    score:        'Mwonekano wa Alama ya Uaminifu',
    credentials:  'Mwonekano wa Hati',
    contacts:     'Mwonekano wa Mawasiliano',
    location:     'Mwonekano wa Mahali',
    profession:   'Mwonekano wa Kazi',
    endorsements: 'Mwonekano wa Idhini',
  },
}

const FR: Dict = {
  nav: {
    dashboard:    'Tableau de bord',
    credentials:  'Accréditations',
    profile:      'Profil',
    lookup:       'Rechercher',
    admin:        'Administration',
    logout:       'Déconnexion',
    login:        'Connexion',
    register:     "S'inscrire",
    business:     'Entreprise',
  },
  score: {
    title:        'Score de Confiance',
    outOf:        '/ 1000',
    low:          'Risque Faible',
    medium:       'Risque Modéré',
    high:         'Risque Élevé',
    noData:       'Pas encore de score',
    lastUpdated:  'Mis à jour',
  },
  credentials: {
    title:        'Accréditations',
    add:          'Ajouter',
    none:         "Aucune accréditation pour l'instant",
    pending:      'En attente',
    approved:     'Approuvé',
    rejected:     'Refusé',
    expired:      'Expiré',
    issuer:       'Émetteur',
    issued:       'Émis le',
    expires:      'Expire le',
    type: {
      identity:     'Identité',
      financial:    'Finance',
      work_history: 'Emploi',
      endorsement:  'Recommandation',
      skill:        'Compétence',
    },
  },
  trustChecks: {
    title:        'Vérifications de Confiance',
    request:      'Demander une vérification',
    pending:      'En attente de votre réponse',
    granted:      'Accès accordé',
    denied:       'Accès refusé',
    grant:        "Accorder l'accès",
    deny:         "Refuser l'accès",
  },
  common: {
    loading:      'Chargement…',
    save:         'Enregistrer',
    cancel:       'Annuler',
    confirm:      'Confirmer',
    delete:       'Supprimer',
    edit:         'Modifier',
    close:        'Fermer',
    back:         'Retour',
    next:         'Suivant',
    submit:       'Soumettre',
    success:      'Succès',
    error:        "Une erreur s'est produite",
    required:     'Requis',
    optional:     'Facultatif',
    search:       'Rechercher',
    filter:       'Filtrer',
    noResults:    'Aucun résultat',
    seeAll:       'Tout voir',
    viewProfile:  'Voir le profil',
  },
  auth: {
    signIn:       'Se connecter',
    signUp:       "S'inscrire",
    email:        'E-mail',
    password:     'Mot de passe',
    forgot:       'Mot de passe oublié ?',
    reset:        'Réinitialiser le mot de passe',
    orContinue:   'ou continuer avec',
    noAccount:    "Vous n'avez pas de compte ?",
    hasAccount:   'Vous avez déjà un compte ?',
  },
  privacy: {
    title:        'Paramètres de confidentialité',
    public:       'Public',
    verified:     'Utilisateurs vérifiés uniquement',
    private:      'Seulement moi',
    score:        'Visibilité du Score de Confiance',
    credentials:  'Visibilité des accréditations',
    contacts:     'Visibilité des contacts',
    location:     'Visibilité de la localisation',
    profession:   'Visibilité de la profession',
    endorsements: 'Visibilité des recommandations',
  },
}

export const DICTIONARIES: Record<Locale, Dict> = { en: EN, sw: SW, fr: FR }

// ─── t() — type-safe translation lookup ──────────────────────────────────────

export function t(dict: Dict, key: TKey): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return key.split('.').reduce((obj: any, k) => obj?.[k], dict) as string ?? key
}
