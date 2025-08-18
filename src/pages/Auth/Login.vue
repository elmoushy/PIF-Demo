<template>
  <div :class="[styles.loginPage, 'auth-page']">
    <!-- Background Elements -->
    <div :class="styles.backgroundLayer">
      <GradientBlob />
      <div :class="styles.floatingParticles">
        <div v-for="i in 12" :key="i" :class="styles.particle" :style="particleStyle(i)"></div>
      </div>
      <div :class="styles.gridOverlay"></div>
    </div>
    
    <!-- Main Content -->
    <div :class="styles.pageContent">
      <div :class="styles.contentWrapper">
        <!-- Floating Header -->
        <header :class="styles.floatingHeader">
          <div :class="styles.logoContainer">
            <img src="/PIF-logo.png" alt="PIF" :class="styles.logo" />
          </div>
          <div :class="styles.statusIndicator">
            <span :class="styles.statusDot"></span>
            <span :class="styles.statusText">Secure Login</span>
          </div>
        </header>

        <!-- Enhanced Auth Card -->
        <AuthCard 
          :is-login="true"
          @toggle-auth-mode="goToRegister"
          @submit="handleLogin"
        />

        <!-- Footer -->
        <footer :class="styles.footer">
          <div :class="styles.footerContent">
            <p :class="styles.footerText">
              Protected by advanced encryption • <span :class="styles.highlight">256-bit SSL</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import AuthCard from '../../components/AuthCard/AuthCard.vue'
import GradientBlob from '../../components/GradientBlob/GradientBlob.vue'
import { useAuthStore } from '../../stores/useAuthStore'
import { type LoginRequest } from '../../services/authService'
import notificationService from '../../services/notificationService'
import styles from './Login.module.css'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(false)

// Store original theme to restore when leaving
let originalTheme: string | null = null

// Force night mode and LTR direction when component mounts
onMounted(() => {
  if (typeof window !== 'undefined') {
    const html = document.documentElement
    originalTheme = html.getAttribute('data-theme')
    html.setAttribute('data-theme', 'night')
    
    // Force LTR direction for auth pages
    const body = document.body
    body.classList.add('auth-page')
  }
})

// Restore original theme and remove auth class when component unmounts
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    if (originalTheme) {
      const html = document.documentElement
      html.setAttribute('data-theme', originalTheme)
    }
    
    // Remove auth page class
    const body = document.body
    body.classList.remove('auth-page')
  }
})

// Particle animation styles
const particleStyle = (_index: number) => {
  const size = Math.random() * 4 + 2 // 2-6px
  const delay = Math.random() * 20 // 0-20s
  const duration = Math.random() * 10 + 15 // 15-25s
  const x = Math.random() * 100 // 0-100%
  const y = Math.random() * 100 // 0-100%
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

const handleLogin = async (data: LoginRequest & { rememberMe: boolean }) => {
  isLoading.value = true
  
  try {
    // Call the auth store login method
    const user = await authStore.login({
      username_or_email: data.username_or_email,
      password: data.password
    })
        
    // Debug logging
    console.log('Login component - user returned:', user)
    console.log('Login component - auth store isAuthenticated:', authStore.isAuthenticated)
    
    // Check if user can actually access the application
    if (user.status === 'Pending') {
      notificationService.accountPending()
      return
    } else if (user.status === 'Rejected') {
      notificationService.accountRejected()
      return
    }
    
    // Success - show notification and redirect
    notificationService.loginSuccess(authStore.getUserDisplayName())
    
    // Redirect to dashboard immediately
    // The router guard will handle authentication checks
    console.log('Login component - attempting to navigate to dashboard')
    await router.push('/dashboard')
    console.log('Login component - navigation completed')
    
  } catch (error) {
    notificationService.loginError(error instanceof Error ? error.message : 'Login failed. Please try again.')
  } finally {
    isLoading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}
</script>
