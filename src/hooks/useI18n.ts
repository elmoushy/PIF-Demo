import { useAppStore } from '../stores/useAppStore'

export function useI18n() {
  const appStore = useAppStore()

  return {
    t: appStore.t,
    currentLanguage: appStore.currentLanguage,
    currentTheme: appStore.currentTheme,
    toggleLanguage: appStore.toggleLanguage,
    setLanguage: appStore.setLanguage,
    toggleTheme: appStore.toggleTheme,
    setTheme: appStore.setTheme,
    isRTL: appStore.isRTL,
    isNightMode: appStore.isNightMode,
    isLightMode: appStore.isLightMode,
    updateDocumentAttributes: appStore.updateDocumentAttributes
  }
}