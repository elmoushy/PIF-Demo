import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/useAuthStore'
import { useAppStore } from './stores/useAppStore'
import sessionManager from './services/sessionManager'
import './styles/reset.module.css'
// Removed RTL styles import to fix layout issues in production build
// import './styles/rtl-utils.css'

// Load Google Fonts
const loadFonts = () => {
  const link = document.createElement('link')
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Tajawal:wght@300;400;600&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
}

const app = createApp(App)
const pinia = createPinia()

// Load fonts
loadFonts()

app.use(pinia)
app.use(router)

// Initialize authentication and app settings on startup
const authStore = useAuthStore()
const appStore = useAppStore()

// Initialize session management
sessionManager.init()

authStore.initAuth()
// Ensure theme and language are applied to document
appStore.updateDocumentAttributes()

app.mount('#app')
