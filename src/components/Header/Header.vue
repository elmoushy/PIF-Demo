<template>
  <header :class="[styles.header, { [styles.elevated]: isScrolled }]" ref="headerRef">
    <div :class="styles.headerInner">
      <!-- Left Section - Navigation & Logo -->
      <div :class="styles.leftSection">
        <NavigationSlider ref="navigationSlider" />
        <div :class="styles.logoSection">
          <img src="/SubmitIQ.png" alt="PIF" :class="styles.logo" />
        </div>
      </div>

      <!-- Controls Section -->
      <div :class="styles.controls">
        <!-- Theme Toggle -->
        <div :class="styles.themeToggleWrapper">
          <button 
            :class="themeToggleClasses" 
            @click="toggleTheme" 
            :title="i18n.t('themes.toggleTheme')"
            :aria-label="i18n.t('themes.toggleTheme')"
            :aria-pressed="appStore.currentTheme === 'night'"
            type="button"
          >
            <div :class="styles.themeSlider">
              <div :class="styles.themeTrack">
                <div :class="[styles.themeIcon, styles.sunIcon]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                </div>
                <div :class="[styles.themeIcon, styles.moonIcon]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                </div>
                <div :class="styles.themeIndicator"></div>
              </div>
            </div>
            <span :class="styles.toggleLabel">{{ themeLabel }}</span>
          </button>
        </div>

        <!-- Language Toggle -->
        <!-- <div :class="styles.languageToggleWrapper">
          <button 
            :class="[styles.languageToggle, { [styles.arabicMode]: i18n.currentLanguage === 'ar' }]" 
            @click.stop="toggleLanguage" 
            :title="i18n.t('themes.language')"
            :aria-label="i18n.t('themes.language')"
            :aria-pressed="i18n.currentLanguage === 'ar'"
            type="button"
          >
            <div :class="styles.languageSlider">
              <div :class="styles.languageTrack">
                <div :class="[styles.langOption, styles.enOption, { [styles.active]: i18n.currentLanguage === 'en' }]">
                  <span :class="styles.langFlag">🇺🇸</span>
                  <span :class="styles.langCode">EN</span>
                </div>
                <div :class="[styles.langOption, styles.arOption, { [styles.active]: i18n.currentLanguage === 'ar' }]">
                  <span :class="styles.langFlag">🇸🇦</span>
                  <span :class="styles.langCode">عر</span>
                </div>
                <div :class="styles.languageIndicator"></div>
              </div>
            </div>
          </button>
        </div> -->

        <!-- Notification Button -->
        <div :class="styles.notificationWrapper">
          <button 
            :class="styles.notificationButton" 
            @click="toggleNotifications" 
            :title="i18n.t('notifications.title')"
            :aria-label="i18n.t('notifications.title')"
            :aria-expanded="showNotifications"
            ref="notificationButtonRef"
            type="button"
          >
            <svg :class="styles.notificationIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
            <div v-if="unreadNotificationCount > 0" :class="styles.notificationBadge">
              {{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}
            </div>
          </button>
        </div>

        <!-- User Menu -->
        <div :class="styles.userMenu" ref="userMenuRef">
          <button 
            :class="styles.userButton" 
            @click="toggleUserDropdown"
            :aria-expanded="showUserDropdown"
            :aria-label="i18n.t('navigation.userMenu')"
            ref="userButtonRef"
            type="button"
          >
            <div :class="styles.userAvatar">
              <span :class="styles.userInitial">{{ userInitial }}</span>
            </div>
            <span :class="styles.userName">{{ userName }}</span>
            <svg :class="styles.dropdownIcon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Teleported Notification Dropdown -->
    <Teleport to="body">
      <transition name="dropdown-fade">
        <div 
          v-if="showNotifications" 
          :class="[styles.notificationDropdown, styles.visible]"
          :style="notifDropdownStyle"
          role="dialog"
          :aria-label="i18n.t('notifications.title')"
        >
          <div :class="styles.notificationHeader">
            <h3 :class="styles.notificationTitle">{{ i18n.t('notifications.title') }}</h3>
            <button 
              :class="styles.clearAllButton" 
              @click="clearAllNotifications"
              :disabled="unreadNotificationCount === 0"
              type="button"
            >
              <svg :class="styles.clearIcon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="m19,6v14a2,2 0,0 1,-2,2H7a2,2 0,0 1,-2,-2V6m3,0V4a2,2 0,0 1,2,-2h4a2,2 0,0 1,2,2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              {{ i18n.t('notifications.clearAll') }}
            </button>
          </div>
          <div :class="styles.notificationList" role="list">
            <div v-if="notifications.length === 0" :class="styles.noNotifications">
              <div :class="styles.emptyIcon">📭</div>
              <p>{{ i18n.t('notifications.noNotifications') }}</p>
            </div>
            <div 
              v-else 
              v-for="notification in notifications" 
              :key="notification.id" 
              :class="[styles.notificationItem, { [styles.unread]: !notification.read }]"
              role="listitem"
            >
              <div :class="styles.notificationIndicator"></div>
              <div :class="styles.notificationContent">
                <div :class="styles.notificationMessage">{{ notification.message }}</div>
                <div :class="styles.notificationTime">{{ formatTime(notification.timestamp) }}</div>
              </div>
              <button 
                v-if="!notification.read" 
                :class="styles.markReadButton" 
                @click="markAsRead(notification.id)"
                :aria-label="i18n.t('notifications.markAsRead')"
                type="button"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Teleported User Dropdown -->
    <Teleport to="body">
      <transition name="dropdown-fade">
        <div 
          v-if="showUserDropdown" 
          :class="[styles.userDropdown, styles.visible]"
          :style="userDropdownStyle"
          role="dialog"
          :aria-label="i18n.t('navigation.userMenu')"
        >
          <div :class="styles.userInfo">
            <div :class="styles.userAvatarLarge">
              <span :class="styles.userInitialLarge">{{ userInitial }}</span>
            </div>
            <div :class="styles.userDetails">
              <div :class="styles.userNameLarge">{{ userName }}</div>
              <div :class="styles.userRole">{{ userRole }}</div>
            </div>
          </div>
          <div :class="styles.dropdownDivider"></div>
          <button :class="styles.dropdownItem" @click="handleProfile" type="button">
            <svg :class="styles.dropdownIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>{{ i18n.t('navigation.profile') }}</span>
            <svg :class="styles.dropdownArrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </button>
          <button :class="styles.dropdownItem" @click="handleSettings" type="button">
            <svg :class="styles.dropdownIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.7-6.7l-4.2 4.2m-5.5 5.5l-4.2 4.2M7.5 7.5l4.2 4.2m5.5-5.5l4.2-4.2"/>
            </svg>
            <span>{{ i18n.t('navigation.settings') }}</span>
            <svg :class="styles.dropdownArrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </button>
          <div :class="styles.dropdownDivider"></div>
          <button :class="[styles.dropdownItem, styles.logoutItem]" @click="handleLogout" type="button">
            <svg :class="styles.dropdownIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>{{ i18n.t('navigation.logout') }}</span>
            <svg :class="styles.dropdownArrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </button>
        </div>
      </transition>
    </Teleport>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../../hooks/useI18n'
import { useAuthStore } from '../../stores/useAuthStore'
import { useAppStore } from '../../stores/useAppStore'
import NavigationSlider from '../NavigationSlider'
import styles from './Header.module.css'

interface Notification {
  id: string
  message: string
  timestamp: Date
  read: boolean
  type?: 'info' | 'success' | 'warning' | 'error'
}

const router = useRouter()
const i18n = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()

// Refs for elements
const headerRef = ref<HTMLElement>()
const navigationSlider = ref<InstanceType<typeof NavigationSlider>>()
const userMenuRef = ref<HTMLElement>()
const userButtonRef = ref<HTMLElement>()
const notificationButtonRef = ref<HTMLElement>()

// State management
const showUserDropdown = ref(false)
const showNotifications = ref(false)
const isScrolled = ref(false)

// Dropdown positioning
const userDropdownStyle = ref<Record<string, string>>({})
const notifDropdownStyle = ref<Record<string, string>>({})

// Sample notifications with enhanced data
const notifications = ref<Notification[]>([
  {
    id: '1',
    message: 'Neural network optimization completed successfully',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
    type: 'success'
  },
  {
    id: '2',
    message: 'Quantum processing cluster has been activated',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    read: false,
    type: 'info'
  },
  {
    id: '3',
    message: 'Holographic data transfer completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: true,
    type: 'success'
  },
  {
    id: '4',
    message: 'System maintenance scheduled for tonight',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    read: false,
    type: 'warning'
  }
])

// Computed properties
const userName = computed(() => {
  return authStore.user?.username || authStore.user?.first_name || 'User'
})

const userInitial = computed(() => {
  return userName.value.charAt(0).toUpperCase()
})

const userRole = computed(() => {
  return authStore.user?.role || 'Admin User'
})

const unreadNotificationCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

const themeLabel = computed(() => {
  return appStore.currentTheme === 'night' 
    ? i18n.t('themes.darkMode') 
    : i18n.t('themes.lightMode')
})

const themeToggleClasses = computed(() => {
  const isDarkMode = appStore.currentTheme === 'night'
  return [
    styles.themeToggle,
    { [styles.darkMode]: isDarkMode }
  ]
})

// Theme and language methods
const toggleTheme = () => {
  i18n.toggleTheme()
  
  // Debug logging
  
  // Announce to screen readers
  const announcement = appStore.currentTheme === 'night' 
    ? i18n.t('themes.switchedToDark') 
    : i18n.t('themes.switchedToLight')
  
  announceToScreenReader(announcement)
}

const toggleLanguage = (event?: Event) => {
  // Prevent any event bubbling that might trigger other handlers
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  // const oldLanguage = i18n.currentLanguage
  i18n.toggleLanguage()
  
  // Announce to screen readers
  const announcement = i18n.currentLanguage === 'ar' 
    ? 'تم التبديل إلى العربية' 
    : 'Switched to English'
  
  announceToScreenReader(announcement)
  
  // Log for debugging
}

// Notification methods
const toggleNotifications = () => {
  if (!showNotifications.value) {
    showNotifications.value = true
    showUserDropdown.value = false
    nextTick(() => {
      positionDropdown('notification')
    })
  } else {
    showNotifications.value = false
  }
}

const markAsRead = (id: string) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
    announceToScreenReader(i18n.t('notifications.markedAsRead'))
  }
}

const clearAllNotifications = () => {
  const unreadCount = unreadNotificationCount.value
  notifications.value = notifications.value.map(n => ({ ...n, read: true }))
  announceToScreenReader(
    `${unreadCount} ${i18n.t('notifications.clearAll').toLowerCase()}`
  )
}

// User dropdown methods
const toggleUserDropdown = () => {
  if (!showUserDropdown.value) {
    showUserDropdown.value = true
    showNotifications.value = false
    nextTick(() => {
      positionDropdown('user')
    })
  } else {
    showUserDropdown.value = false
  }
}

const handleProfile = () => {
  showUserDropdown.value = false
  router.push('/profile')
}

const handleSettings = () => {
  showUserDropdown.value = false
  router.push('/settings')
}

const handleLogout = async () => {
  showUserDropdown.value = false
  try {
    await authStore.logout()
    announceToScreenReader(i18n.t('auth.loggedOut'))
    router.push('/login')
  } catch (error) {
    router.push('/login')
  }
}

// Utility methods
const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (minutes < 1) return i18n.t('time.justNow')
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const announceToScreenReader = (message: string) => {
  // Create a live region for screen reader announcements
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Dropdown positioning
const positionDropdown = (type: 'user' | 'notification') => {
  const buttonRef = type === 'user' ? userButtonRef.value : notificationButtonRef.value
  const dropdownWidth = type === 'user' ? 280 : 380
  
  if (buttonRef) {
    const rect = buttonRef.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    
    // Calculate optimal position
    let leftPosition = rect.right - dropdownWidth
    
    // Prevent overflow
    if (leftPosition < 16) {
      leftPosition = 16
    } else if (leftPosition + dropdownWidth > viewportWidth - 16) {
      leftPosition = viewportWidth - dropdownWidth - 16
    }
    
    const style = {
      position: 'fixed' as const,
      top: `${rect.bottom + 16}px`,
      left: `${leftPosition}px`,
      width: `${dropdownWidth}px`,
      zIndex: '2000'
    }
    
    if (type === 'user') {
      userDropdownStyle.value = style
    } else {
      notifDropdownStyle.value = style
    }
  }
}

// Event handlers
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  
  // Close user dropdown if clicked outside
  if (userMenuRef.value && !userMenuRef.value.contains(target) && showUserDropdown.value) {
    const userDropdown = document.querySelector(`.${styles.userDropdown}`)
    if (!userDropdown || !userDropdown.contains(target)) {
      showUserDropdown.value = false
    }
  }
  
  // Close notification dropdown if clicked outside
  const notificationWrapper = target.closest(`.${styles.notificationWrapper}`)
  const notificationDropdown = document.querySelector(`.${styles.notificationDropdown}`)
  if (!notificationWrapper && (!notificationDropdown || !notificationDropdown.contains(target)) && showNotifications.value) {
    showNotifications.value = false
  }
}

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  isScrolled.value = scrollTop > 64
}

const handleKeyDown = (event: KeyboardEvent) => {
  // Close dropdowns on Escape
  if (event.key === 'Escape') {
    showUserDropdown.value = false
    showNotifications.value = false
  }
}

const updateDropdownPositions = () => {
  if (showUserDropdown.value) {
    positionDropdown('user')
  }
  if (showNotifications.value) {
    positionDropdown('notification')
  }
}

// Lifecycle hooks
onMounted(() => {
  // The store handles initialization automatically
  // No need for manual localStorage reading or document attribute setting
  
  // Add event listeners
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', updateDropdownPositions)
})

onUnmounted(() => {
  // Cleanup
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', updateDropdownPositions)
})
</script>