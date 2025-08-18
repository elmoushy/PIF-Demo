import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import enTranslations from '../i18n/en.json'
// import arTranslations from '../i18n/ar.json'

type Language = 'en' // | 'ar'
type Theme = 'night' | 'light'

const translations = {
  en: enTranslations
  // ar: arTranslations
}

export const useAppStore = defineStore('app', () => {
  // State
  const currentLanguage = ref<Language>('en')
  const currentTheme = ref<Theme>('light')

  // Initialize from localStorage
  const initializeFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
      // Initialize language - check both old and new keys for backward compatibility
      const savedLanguage = localStorage.getItem('pif-language') || localStorage.getItem('language')
      if (savedLanguage && ['en'].includes(savedLanguage)) {
        currentLanguage.value = savedLanguage as Language
      }

      // Initialize theme - check both old and new keys for backward compatibility
      const savedTheme = localStorage.getItem('pif-theme') || localStorage.getItem('theme')
      if (savedTheme && ['night', 'light'].includes(savedTheme)) {
        currentTheme.value = savedTheme as Theme
      }

      // Update document attributes on initialization
      updateDocumentAttributes()
    }
  }

  // Getters
  const isRTL = computed(() => false) // currentLanguage.value === 'ar'
  const isNightMode = computed(() => currentTheme.value === 'night')
  const isLightMode = computed(() => currentTheme.value === 'light')

  // Actions
  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[currentLanguage.value]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key
  }

  const toggleLanguage = () => {
    // currentLanguage.value = currentLanguage.value === 'en' ? 'ar' : 'en'
    currentLanguage.value = 'en' // Always set to English
    localStorage.setItem('pif-language', currentLanguage.value)
    updateDocumentAttributes()
  }

  const setLanguage = (lang: Language) => {
    currentLanguage.value = lang
    localStorage.setItem('pif-language', lang)
    updateDocumentAttributes()
  }

  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'night' ? 'light' : 'night'
    localStorage.setItem('pif-theme', currentTheme.value)
    updateDocumentAttributes()
  }

  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
    localStorage.setItem('pif-theme', theme)
    updateDocumentAttributes()
  }

  const updateDocumentAttributes = () => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement
      html.setAttribute('lang', currentLanguage.value)
      html.setAttribute('dir', 'ltr') // currentLanguage.value === 'ar' ? 'rtl' : 'ltr'
      html.setAttribute('data-theme', currentTheme.value)
      
      // Update font family based on language
      // if (currentLanguage.value === 'ar') {
      //   html.style.fontFamily = '"Tajawal", sans-serif'
      // } else {
        html.style.fontFamily = '"Inter", sans-serif'
      // }
    }
  }

  // Initialize store
  initializeFromLocalStorage()

  return {
    // State
    currentLanguage: computed(() => currentLanguage.value),
    currentTheme: computed(() => currentTheme.value),
    
    // Getters
    isRTL,
    isNightMode,
    isLightMode,
    
    // Actions
    t,
    toggleLanguage,
    setLanguage,
    toggleTheme,
    setTheme,
    updateDocumentAttributes,
    initializeFromLocalStorage
  }
})
