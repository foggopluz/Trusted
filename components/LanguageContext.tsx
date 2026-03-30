'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { DICTIONARIES, LOCALES, t as dictT, type Locale, type TKey } from '@/lib/i18n'

const STORAGE_KEY = 'trustnet_lang'

interface LanguageContextValue {
  lang:    Locale
  setLang: (l: Locale) => void
  t:       (key: TKey) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang:    'en',
  setLang: () => {},
  t:       (key) => key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Locale>('en')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && LOCALES.includes(stored as Locale)) {
      setLangState(stored as Locale)
    }
  }, [])

  const setLang = useCallback((l: Locale) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }, [])

  const translate = useCallback((key: TKey) => dictT(DICTIONARIES[lang], key), [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
