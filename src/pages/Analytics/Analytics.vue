<template>
  <div :class="styles.analytics">
    <div :class="styles.container">
      <div :class="styles.header">
        <h1 :class="styles.title">{{ t('navigation.analytics') }}</h1>
        <p :class="styles.subtitle">{{ t('navigation.analyticsDesc') }}</p>
      </div>
      
      <div :class="styles.content">
        <div :class="styles.comingSoon">
          <div :class="styles.icon">📊</div>
          <h2>{{ t('common.comingSoon') }}</h2>
          <p>{{ t('analytics.description') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '../../hooks/useI18n'
import styles from './Analytics.module.css'

const { t } = useI18n()
</script>
