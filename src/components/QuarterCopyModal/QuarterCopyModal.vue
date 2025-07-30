<template>
  <div v-if="isOpen" :class="styles.modalOverlay" @click="handleOverlayClick">
    <div :class="styles.modalContainer">
      <div :class="styles.modal">
        <!-- Header -->
        <div :class="styles.modalHeader">
          <h3 :class="styles.modalTitle">{{ t('businessQuarters.copyFromAnotherQuarter') }}</h3>
          <button @click="$emit('close')" :class="styles.closeButton">
            <span :class="styles.closeIcon">✖</span>
          </button>
        </div>

        <!-- Content -->
        <div :class="styles.modalContent">
          <p :class="styles.modalDescription">
            {{ t('businessQuarters.selectQuarterToCopyFrom') }}
          </p>

          <!-- Year Selector -->
          <div :class="styles.yearSection">
            <label :class="styles.sectionLabel">Year</label>
            <div :class="styles.yearSelector">
              <button 
                v-for="year in availableYears"
                :key="year"
                @click="selectedYear = year"
                :class="[
                  styles.yearButton,
                  selectedYear === year ? styles.active : ''
                ]"
              >
                {{ year }}
                <div v-if="selectedYear === year" :class="styles.activeGlow"></div>
              </button>
            </div>
          </div>

          <!-- Quarter Selector -->
          <div :class="styles.quarterSection">
            <label :class="styles.sectionLabel">Quarter</label>
            <div :class="styles.quarterGrid">
              <button
                v-for="quarter in quarters"
                :key="quarter.id"
                @click="selectedQuarter = quarter.id"
                :class="[
                  styles.quarterCard,
                  selectedQuarter === quarter.id ? styles.active : '',
                  isCurrentPeriod(quarter.id, selectedYear) ? styles.disabled : ''
                ]"
                :disabled="isCurrentPeriod(quarter.id, selectedYear)"
              >
                <div :class="styles.quarterContent">
                  <span :class="styles.quarterLabel">{{ quarter.label }}</span>
                  <span :class="styles.quarterPeriod">{{ quarter.period }}</span>
                  <div :class="styles.recordCount">
                    {{ getRecordCount(quarter.id, selectedYear) }} records
                  </div>
                  <div v-if="selectedQuarter === quarter.id" :class="styles.quarterGlow"></div>
                </div>
              </button>
            </div>
          </div>

          <!-- Selected Period Display -->
          <div v-if="selectedQuarter && selectedYear" :class="styles.selectedPeriod">
            <div :class="styles.periodBadge">
              <span :class="styles.badgeIcon">📅</span>
              <span :class="styles.badgeText">
                Q{{ selectedQuarter }} {{ selectedYear }}
              </span>
              <span :class="styles.recordBadge">
                {{ getRecordCount(selectedQuarter, selectedYear) }} records
              </span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div :class="styles.modalFooter">
          <button 
            @click="$emit('close')" 
            :class="styles.cancelButton"
          >
            <span :class="styles.buttonIcon">✖</span>
            Cancel
          </button>
          <button 
            @click="handleCopyData"
            :class="styles.copyButton"
            :disabled="!selectedQuarter || !selectedYear || isCurrentPeriod(selectedQuarter, selectedYear)"
          >
            <span :class="styles.buttonIcon">📋</span>
            {{ t('businessQuarters.copyFromQuarter') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import styles from './QuarterCopyModal.module.css'

interface Props {
  isOpen: boolean
  currentPeriod: string
  availableData: Record<string, any[]>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  copyData: [fromPeriod: string, data: any[]]
}>()

const { t } = useI18n()

// State
const selectedYear = ref(new Date().getFullYear())
const selectedQuarter = ref<number | null>(null)

// Available years (you can make this dynamic based on your data)
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]
})

// Quarters configuration
const quarters = [
  { id: 1, label: 'Q1', period: 'Jan - Mar' },
  { id: 2, label: 'Q2', period: 'Apr - Jun' },
  { id: 3, label: 'Q3', period: 'Jul - Sep' },
  { id: 4, label: 'Q4', period: 'Oct - Dec' }
]

// Check if the selected period is the current one
const isCurrentPeriod = (quarter: number, year: number) => {
  const period = `Q${quarter} ${year}`
  return period === props.currentPeriod
}

// Get record count for a specific period
const getRecordCount = (quarter: number, year: number) => {
  const period = `Q${quarter} ${year}`
  return props.availableData[period]?.length || 0
}

// Handle overlay click (close modal if clicking outside)
const handleOverlayClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

// Handle copy data
const handleCopyData = () => {
  if (!selectedQuarter.value || !selectedYear.value) return
  
  const fromPeriod = `Q${selectedQuarter.value} ${selectedYear.value}`
  const data = props.availableData[fromPeriod] || []
  
  if (data.length === 0) {
    alert(t('businessQuarters.noDataToCopy'))
    return
  }
  
  if (confirm(`${t('businessQuarters.confirmCopyData')}`)) {
    emit('copyData', fromPeriod, data)
  }
}
</script>
