<template>
  <div :class="styles.settingsPage">
    <Header />
    
    <main :class="styles.mainContent">
      <!-- Hero Section -->
      <section :class="styles.heroSection">
        <div :class="styles.heroContent">
          <div :class="styles.heroText">
            <h1 :class="styles.heroTitle">{{ t('settings.title') }}</h1>
            <p :class="styles.heroSubtitle">{{ t('settings.subtitle') }}</p>
          </div>
          <div :class="styles.heroIcon">
            <span :class="styles.settingsIcon">⚙️</span>
          </div>
        </div>
      </section>

      <!-- Settings Cards Grid -->
      <section :class="styles.settingsSection">
        <div :class="styles.settingsGrid">
          <!-- Users Management Card -->
          <div :class="[styles.settingCard, styles.usersCard]" @click="handleCardClick('users')">
            <div :class="styles.cardHeader">
              <div :class="styles.cardIcon">
                <span :class="styles.icon">👥</span>
                <div :class="styles.iconGlow"></div>
              </div>
              <div :class="styles.cardTitle">
                <h3>{{ t('settings.users.title') }}</h3>
                <p>{{ t('settings.users.description') }}</p>
              </div>
            </div>
            
            <div :class="styles.cardContent">
              <div :class="styles.cardStats">
                <div :class="styles.statItem">
                  <span :class="styles.statNumber">{{ userStats.total }}</span>
                  <span :class="styles.statLabel">{{ t('settings.users.totalUsers') }}</span>
                </div>
                <div :class="styles.statItem">
                  <span :class="styles.statNumber">{{ userStats.active }}</span>
                  <span :class="styles.statLabel">{{ t('settings.users.activeUsers') }}</span>
                </div>
              </div>
            </div>

            <div :class="styles.cardFooter">
              <span :class="styles.cardAction">{{ t('settings.manageAccess') }}</span>
              <span :class="styles.cardArrow">→</span>
            </div>
          </div>

          <!-- Companies Management Card -->
          <div :class="[styles.settingCard, styles.companiesCard]" @click="handleCardClick('companies')">
            <div :class="styles.cardHeader">
              <div :class="styles.cardIcon">
                <span :class="styles.icon">🏢</span>
                <div :class="styles.iconGlow"></div>
              </div>
              <div :class="styles.cardTitle">
                <h3>{{ t('settings.companies.title') }}</h3>
                <p>{{ t('settings.companies.description') }}</p>
              </div>
            </div>
            
            <div :class="styles.cardContent">
              <div :class="styles.cardStats">
                <div :class="styles.statItem">
                  <span :class="styles.statNumber">{{ companyStats.total }}</span>
                  <span :class="styles.statLabel">{{ t('settings.companies.totalCompanies') }}</span>
                </div>
                <div :class="styles.statItem">
                  <span :class="styles.statNumber">{{ companyStats.active }}</span>
                  <span :class="styles.statLabel">{{ t('settings.companies.activeCompanies') }}</span>
                </div>
              </div>
            </div>

            <div :class="styles.cardFooter">
              <span :class="styles.cardAction">{{ t('settings.manageCompanies') }}</span>
              <span :class="styles.cardArrow">→</span>
            </div>
          </div>

          <!-- Entities Management Card -->
          <div :class="[styles.settingCard, styles.entitiesCard]" @click="handleCardClick('entities')">
            <div :class="styles.cardHeader">
              <div :class="styles.cardIcon">
                <span :class="styles.icon">🏛️</span>
                <div :class="styles.iconGlow"></div>
              </div>
              <div :class="styles.cardTitle">
                <h3>{{ t('settings.entities.title') }}</h3>
                <p>{{ t('settings.entities.description') }}</p>
              </div>
            </div>
            
            <div :class="styles.cardContent">
              <div :class="styles.cardStats">
                <div :class="styles.statItem">
                  <span :class="styles.statNumber">{{ entityStats.total }}</span>
                  <span :class="styles.statLabel">{{ t('settings.entities.totalEntities') }}</span>
                </div>
                <div :class="styles.statItem">
                  <span :class="styles.statNumber">{{ entityStats.subsidiaries }}</span>
                  <span :class="styles.statLabel">{{ t('settings.entities.subsidiaries') }}</span>
                </div>
              </div>
            </div>

            <div :class="styles.cardFooter">
              <span :class="styles.cardAction">{{ t('settings.manageEntities') }}</span>
              <span :class="styles.cardArrow">→</span>
            </div>
          </div>

          <!-- Period Deadline Management Card -->
          <div :class="[styles.settingCard, styles.deadlineCard]" @click="handleCardClick('deadlines')">
            <div :class="styles.cardHeader">
              <div :class="styles.cardIcon">
                <span :class="styles.icon">📅</span>
                <div :class="styles.iconGlow"></div>
              </div>
              <div :class="styles.cardTitle">
                <h3>{{ t('settings.deadlines.title') }}</h3>
                <p>{{ t('settings.deadlines.description') }}</p>
              </div>
            </div>
            
            <div :class="styles.cardContent">
              <div :class="styles.cardStats">
                <div :class="styles.statItem">
                  <span :class="styles.statNumber">{{ deadlineStats.upcomingQ }}</span>
                  <span :class="styles.statLabel">{{ t('settings.deadlines.nextQuarter') }}</span>
                </div>
                <div :class="styles.statItem">
                  <span :class="styles.statNumber">{{ deadlineStats.daysLeft }}</span>
                  <span :class="styles.statLabel">{{ t('settings.deadlines.daysLeft') }}</span>
                </div>
              </div>
            </div>

            <div :class="styles.cardFooter">
              <span :class="styles.cardAction">{{ t('settings.manageDeadlines') }}</span>
              <span :class="styles.cardArrow">→</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Additional Info Section -->
      <section :class="styles.infoSection">
        <div :class="styles.infoCard">
          <div :class="styles.infoIcon">
            <span>ℹ️</span>
          </div>
          <div :class="styles.infoContent">
            <h4>{{ t('settings.info.title') }}</h4>
            <p>{{ t('settings.info.description') }}</p>
          </div>
        </div>
      </section>
    </main>

    <!-- Particle System -->
    <div :class="styles.particleSystem">
      <div v-for="i in 30" :key="i" :class="styles.particle" :style="particleStyle(i)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../../hooks/useI18n'
import Header from '../../components/Header/Header.vue'
import styles from './Settings.module.css'

const router = useRouter()
const { t } = useI18n()

// Mock statistics data
const userStats = ref({
  total: 84,
  active: 67
})

const companyStats = ref({
  total: 156,
  active: 142
})

const entityStats = ref({
  total: 23,
  subsidiaries: 89
})

const deadlineStats = ref({
  upcomingQ: 'Q4',
  daysLeft: 45
})

// Particle animation styles
const particleStyle = (_index: number) => {
  const delay = Math.random() * 20
  const duration = 15 + Math.random() * 10
  const xOffset = Math.random() * 100
  const yOffset = Math.random() * 100
  
  return {
    left: `${xOffset}%`,
    top: `${yOffset}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    '--particle-color': `hsl(${180 + Math.random() * 60}, 70%, 60%)`
  }
}

// Card click handlers
const handleCardClick = (cardType: string) => {
  switch (cardType) {
    case 'users':
      router.push('/users-management')
      break
    case 'companies':
      router.push('/companies-management')
      break
    case 'entities':
      router.push('/entities-management')
      break
    case 'deadlines':
      router.push('/period-deadlines')
      break
  }
}
</script>
