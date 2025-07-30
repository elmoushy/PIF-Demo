<template>
  <div>
    <!-- Navigation Toggle Button -->
    <button 
      v-if="!isOpen"
      :class="[styles.navToggle, { [styles.active]: isOpen }]"
      @click="toggleNavigation"
      :title="t('navigation.menu')"
    >
      <span :class="styles.hamburger"></span>
      <span :class="styles.hamburger"></span>
      <span :class="styles.hamburger"></span>
    </button>

    <!-- Teleported Navigation Slider Container -->
    <Teleport to="body">
      <!-- Backdrop -->
      <Transition name="backdrop">
        <div 
          v-if="isOpen" 
          :class="styles.backdrop" 
          @click="closeNavigation"
        ></div>
      </Transition>

      <!-- Navigation Slider -->
      <Transition name="slide">
        <div v-if="isOpen" :class="styles.navigationSliderContainer">
          <nav :class="styles.navigationSlider">
            <!-- Header Section -->
            <div :class="styles.navHeader">
              <div :class="styles.brandSection">
                <div :class="styles.brandIcon">
                  <img src="/PIF-logo.png" alt="PIF" :class="styles.brandLogo" />
                </div>
                <div :class="styles.brandText">
                  <h2 :class="styles.brandTitle">PIF</h2>
                  <p :class="styles.brandSubtitle">{{ t('Public Investment Fund') }}</p>
                </div>
              </div>
              
              <button :class="styles.closeButton" @click="closeNavigation">
                <span :class="styles.closeIcon">✕</span>
              </button>
            </div>

            <!-- Navigation Items -->
            <div :class="styles.navContent">
              <div :class="styles.navSection">
                <h3 :class="styles.sectionTitle">{{ t('navigation.main') }}</h3>
                <div :class="styles.navItems">
                  <router-link
                    v-for="(item, index) in navigationItems"
                    :key="item.path"
                    :to="item.path"
                    :class="styles.navItem"
                    active-class="activeNavItem"
                    @click="closeNavigation"
                    :style="{ '--delay': index * 0.1 + 's' }"
                  >
                    <div :class="styles.navItemIcon">
                      <span :class="styles.icon">{{ item.icon }}</span>
                      <div :class="styles.iconGlow"></div>
                    </div>
                    <div :class="styles.navItemContent">
                      <span :class="styles.navItemLabel">{{ t(item.label) }}</span>
                      <span :class="styles.navItemDescription">{{ t(item.description) }}</span>
                    </div>
                    <div :class="styles.navItemArrow">
                      <span>→</span>
                    </div>
                  </router-link>
                </div>
              </div>

              <!-- Quick Actions Section -->
              <div :class="styles.navSection">
                <h3 :class="styles.sectionTitle">{{ t('navigation.quickActions') }}</h3>
                <div :class="styles.quickActions">
                  <button 
                    v-for="(action, index) in quickActions"
                    :key="action.key"
                    :class="styles.quickAction"
                    @click="handleQuickAction(action.key)"
                    :style="{ '--delay': (navigationItems.length + index) * 0.1 + 's' }"
                  >
                    <span :class="styles.quickActionIcon">{{ action.icon }}</span>
                    <span :class="styles.quickActionLabel">{{ t(action.label) }}</span>
                  </button>
                </div>
              </div>

              <!-- User Section -->
              <div :class="styles.userSection">
                <div :class="styles.userProfile">
                  <div :class="styles.userAvatar">
                    <span :class="styles.userInitial">{{ userInitial }}</span>
                    <div :class="styles.statusIndicator"></div>
                  </div>
                  <div :class="styles.userInfo">
                    <span :class="styles.userName">{{ userName }}</span>
                  </div>
                </div>

                <div :class="styles.userActions">
                  <button :class="styles.userAction" @click="handleProfile">
                    <span :class="styles.userActionIcon">👤</span>
                    {{ t('navigation.profile') }}
                  </button>
                  <button :class="styles.userAction" @click="handleSettings">
                    <span :class="styles.userActionIcon">⚙️</span>
                    {{ t('navigation.settings') }}
                  </button>
                  <button :class="styles.userAction" @click="handleLogout">
                    <span :class="styles.userActionIcon">🚪</span>
                    {{ t('navigation.logout') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div :class="styles.navFooter">
              <div :class="styles.footerInfo">
                <span :class="styles.version">v2.1.0</span>
                <span :class="styles.lastUpdate">{{ t('common.lastUpdate') }}: {{ currentDate }}</span>
              </div>
              <div :class="styles.footerActions">
                <button :class="styles.footerAction" @click="toggleTheme" :title="t('themes.toggleTheme')">
                  <span>{{ themeIcon }}</span>
                </button>
                <button :class="styles.footerAction" @click="toggleLanguage" :title="t('themes.language')">
                  <span>{{ currentLanguage.toUpperCase() }}</span>
                </button>
              </div>
            </div>
          </nav>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../../hooks/useI18n'
import { useAuthStore } from '../../stores/useAuthStore'
import styles from './NavigationSlider.module.css'

const router = useRouter()
const { t, currentLanguage, toggleLanguage, toggleTheme, currentTheme } = useI18n()
const authStore = useAuthStore()

const isOpen = ref(false)

const themeIcon = computed(() => {
  switch (currentTheme) {
    case 'night': return '🌙'
    case 'light': return '☀️'
    default: return '🌙'
  }
})

const navigationItems = [
  { 
    path: '/dashboard', 
    label: 'navigation.dashboard', 
    description: 'navigation.dashboardDesc',
    icon: '📊' 
  },
  { 
    path: '/business-quarters', 
    label: 'navigation.businessQuarters', 
    description: 'navigation.businessQuartersDesc',
    icon: '📈' 
  }
]

const quickActions = [
  { key: 'newQuarters', label: 'NewQuarters', icon: '✨' },
  { key: 'notifications', label: 'navigation.notifications', icon: '🔔' },
  { key: 'help', label: 'navigation.help', icon: '❓' },
]

const userName = computed(() => {
  // Get username from auth store instead of localStorage directly
  return authStore.user?.username || authStore.user?.first_name || 'User'
})

const userInitial = computed(() => {
  return userName.value.charAt(0).toUpperCase()
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString()
})

const toggleNavigation = () => {
  isOpen.value = !isOpen.value
}

const closeNavigation = () => {
  isOpen.value = false
}

const handleQuickAction = (_action: string) => {
  closeNavigation()
  // TODO: Implement quick actions
}

const handleProfile = () => {
  closeNavigation()
  // TODO: Navigate to profile page
}

const handleSettings = () => {
  closeNavigation()
  // TODO: Navigate to settings page
}

const handleLogout = async () => {
  closeNavigation()
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
    // Even if API call fails, redirect to login
    router.push('/login')
  }
}

// Close navigation when route changes
const handleRouteChange = () => {
  closeNavigation()
}

// Close navigation on escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    closeNavigation()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Watch for route changes
const unwatchRoute = router.afterEach(handleRouteChange)

onUnmounted(() => {
  unwatchRoute()
})

// Expose toggle function to parent
defineExpose({
  toggleNavigation,
  closeNavigation
})
</script>
