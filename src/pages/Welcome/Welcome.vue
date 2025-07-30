<template>
  <div :class="styles.welcomePage">
    <!-- Animated Background -->
    <div :class="styles.backgroundLayer">
      <div :class="styles.animatedGrid">
        <div v-for="i in 20" :key="i" :class="styles.gridLine" :style="gridLineStyle(i)"></div>
      </div>
      <div :class="styles.floatingElements">
        <div v-for="i in 8" :key="i" :class="styles.floatingOrb" :style="orbStyle(i)"></div>
      </div>
    </div>

    <!-- Welcome Content -->
    <div :class="styles.contentContainer">
      <div :class="styles.logoSection">
        <img src="/PIF-logo.png" alt="PIF" :class="styles.logo" />
      </div>
      
      <div :class="styles.welcomeContent">
        <h1 :class="styles.welcomeTitle">{{ t('welcome.message') }}</h1>
        <p :class="styles.welcomeSubtitle">{{ t('welcome.loading') }}</p>
        
        <!-- User Info -->
        <div v-if="authStore.user" :class="styles.userInfo">
          <p>Welcome, {{ authStore.getUserDisplayName() }}!</p>
          <p>Role: {{ authStore.user.role }}</p>
          <p>Status: {{ authStore.user.status }}</p>
        </div>
        
        <!-- Action Buttons -->
        <div :class="styles.actionButtons">
          <button @click="goToDashboard" :class="styles.primaryButton">
            Go to Dashboard
          </button>
          <button @click="handleLogout" :class="styles.secondaryButton">
            Logout
          </button>
        </div>
        
        <!-- Progress Bar -->
        <div :class="styles.progressContainer">
          <div :class="styles.progressBar">
            <div :class="styles.progressFill" :style="{ width: `${progress}%` }"></div>
          </div>
          <span :class="styles.progressText">{{ progress }}%</span>
        </div>

        <!-- Loading Animation -->
        <div :class="styles.loadingAnimation">
          <div v-for="i in 3" :key="i" :class="styles.loadingDot" :style="{ animationDelay: `${i * 0.2}s` }"></div>
        </div>
      </div>
    </div>

    <!-- Particle System -->
    <div :class="styles.particleSystem">
      <div v-for="i in 50" :key="i" :class="styles.particle" :style="particleStyle(i)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../../hooks/useI18n'
import { useAuthStore } from '../../stores/useAuthStore'
import styles from './Welcome.module.css'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const progress = ref(0)

// Animation styles
const gridLineStyle = (index: number) => {
  const isVertical = index % 2 === 0
  const position = (index / 2) * 10 // 0%, 10%, 20%, etc.
  const delay = index * 0.1
  
  return {
    [isVertical ? 'left' : 'top']: `${position}%`,
    animationDelay: `${delay}s`
  }
}

const orbStyle = (index: number) => {
  const size = Math.random() * 60 + 40 // 40-100px
  const x = Math.random() * 80 + 10 // 10-90%
  const y = Math.random() * 80 + 10 // 10-90%
  const delay = index * 0.5
  const duration = Math.random() * 5 + 8 // 8-13s
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

const particleStyle = (_index: number) => {
  const size = Math.random() * 3 + 1 // 1-4px
  const x = Math.random() * 100
  const y = Math.random() * 100
  const delay = Math.random() * 3
  const duration = Math.random() * 8 + 12 // 12-20s
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

// Navigation methods
const goToDashboard = () => {
  router.push('/dashboard')
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Progress animation and navigation
onMounted(() => {
  const interval = setInterval(() => {
    progress.value += Math.random() * 15 + 5 // Random increment 5-20%
    
    if (progress.value >= 100) {
      progress.value = 100
      clearInterval(interval)
      
      // Navigate to dashboard after a brief delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    }
  }, 200) // Update every 200ms for smooth animation
})
</script>
