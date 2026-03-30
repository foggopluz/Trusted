'use client'

import { useLanguage } from './LanguageContext'
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n'

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage()

  return (
    <select
      value={lang}
      onChange={e => setLang(e.target.value as typeof lang)}
      aria-label="Select language"
      style={{
        fontSize: 13,
        padding: '4px 8px',
        borderRadius: 6,
        border: '1px solid rgba(0,0,0,0.15)',
        background: 'var(--card, #fff)',
        color: 'var(--ink, #111827)',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {LOCALES.map(l => (
        <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
      ))}
    </select>
  )
}
