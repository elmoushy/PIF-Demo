<template>
  <div :class="[styles.registerPage, 'auth-page']">
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
            <span :class="styles.brandName">PIF</span>
          </div>
          <div :class="styles.statusIndicator">
            <span :class="styles.statusDot"></span>
            <span :class="styles.statusText">New Account</span>
          </div>
        </header>

        <!-- Enhanced Auth Card -->
        <AuthCard 
          :is-login="false"
          @toggle-auth-mode="goToLogin"
          @submit="handleRegister"
        />

        <!-- Registration Status Notice -->
        <div v-if="registrationSuccess" :class="styles.successNotice">
          <div :class="styles.successIcon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div :class="styles.successContent">
            <h3>Registration Successful!</h3>
            <p>Your account has been created and is pending administrator approval. You will be notified once your account is approved and ready to use.</p>
            <button @click="goToLogin" :class="styles.successButton">
              Continue to Login
            </button>
          </div>
        </div>

        <!-- Footer -->
        <footer :class="styles.footer">
          <div :class="styles.footerContent">
            <p :class="styles.footerText">
              By creating an account, you agree to our <span :class="styles.highlight">Terms</span> and <span :class="styles.highlight">Privacy Policy</span>
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
import { type RegisterRequest } from '../../services/authService'
import notificationService from '../../services/notificationService'
import styles from './Register.module.css'

const router = useRouter()
const authStore = useAuthStore()
const registrationSuccess = ref(false)
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

const handleRegister = async (data: RegisterRequest) => {
  isLoading.value = true
  registrationSuccess.value = false
  
  try {
    // Call the auth store register method
    await authStore.register(data)
    
    
    // Show success message
    notificationService.registrationSuccess()
    registrationSuccess.value = true
    
    // Optional: Auto-redirect to login after a delay
    setTimeout(() => {
      if (registrationSuccess.value) {
        goToLogin()
      }
    }, 5000) // 5 seconds
    
  } catch (error) {
    console.error('Registration error:', error)
    notificationService.registrationError(error instanceof Error ? error.message : 'Registration failed. Please try again.')
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>
