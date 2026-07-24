import React, { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'devtools-lang'

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(STORAGE_KEY) || 'pt')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  const toggleLang = () => setLang((l) => (l === 'pt' ? 'en' : 'pt'))

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

// Uso em cada página: const { lang } = useLanguage(); const t = translations[lang]
// Cada página define seu próprio objeto { pt: {...}, en: {...} } local — sem
// dicionário central, pra rodadas futuras do agente não precisarem editar um
// arquivo compartilhado (menos risco de conflito).
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage precisa estar dentro de <LanguageProvider>')
  return ctx
}
