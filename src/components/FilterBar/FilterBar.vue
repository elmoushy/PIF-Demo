<template>
  <div :class="styles.filterBar">
    <!-- Left Side: Search and Filter Sections -->
    <div :class="styles.searchSection">
      <!-- Search Section -->
      <div :class="styles.searchSection">
        <div :class="styles.searchContainer">
          <div :class="styles.searchInputWrapper">
            <input 
              type="text" 
              :placeholder="t('businessQuarters.searchPlaceholder')"
              v-model="searchQuery"
              @input="$emit('search', searchQuery)"
              :class="styles.searchInput"
            />
            <div :class="styles.searchIcon">
              <span>🔍</span>
            </div>
            <div v-if="searchQuery" :class="styles.clearSearchButton" @click="clearSearch">
              <span>✖</span>
            </div>
          </div>
          <div :class="styles.searchGlow"></div>
        </div>
      </div>
      
      <!-- Filter Section -->
      <div :class="styles.filterSection">
        <div :class="styles.filterGroup">
          <div :class="styles.filterWrapper">
            <SearchableDropdown
              :model-value="selectedCurrency"
              @update:model-value="handleCurrencyChange"
              :options="currencies"
              placeholder="All Currencies"
              search-placeholder="Search currencies..."
              no-results-text="No currencies found"
            />
            <div :class="styles.selectGlow"></div>
          </div>
          
          <div :class="styles.filterWrapper">
            <SearchableDropdown
              :model-value="selectedCountry"
              @update:model-value="handleCountryChange"
              :options="countries"
              placeholder="All Countries"
              search-placeholder="Search countries..."
              no-results-text="No countries found"
            />
            <div :class="styles.selectGlow"></div>
          </div>
          
          <button 
            @click="clearFilters"
            :class="styles.clearButton"
          >
            <span :class="styles.buttonIcon">🧹</span>
            {{ t('businessQuarters.clearFilters') }}
          </button>
        </div>
        
        <!-- Active Filters Display -->
        <div v-if="hasActiveFilters" :class="styles.activeFilters">
          <div v-if="selectedCurrency" :class="styles.filterTag">
            <span :class="styles.tagLabel">Currency:</span>
            <span :class="styles.tagValue">{{ selectedCurrencyLabel }}</span>
            <button @click="clearCurrency" :class="styles.tagRemove">✖</button>
          </div>
          <div v-if="selectedCountry" :class="styles.filterTag">
            <span :class="styles.tagLabel">Country:</span>
            <span :class="styles.tagValue">{{ selectedCountryLabel }}</span>
            <button @click="clearCountry" :class="styles.tagRemove">✖</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Right Side: Quarter/Year Selection Container -->
    <div :class="styles.rightSection">
      <div :class="styles.selectionContainer">
        <!-- Year Selector -->
        <div :class="styles.yearSelector">
          <button 
            @click="changeYear(-1)"
            :class="styles.yearButton"
            :disabled="selectedYear <= minYear"
          >
            <span :class="styles.buttonIcon">◀</span>
          </button>
          
          <div :class="styles.yearDisplay">
            <span :class="styles.yearValue">{{ selectedYear }}</span>
          </div>
          
          <button 
            @click="changeYear(1)"
            :class="styles.yearButton"
            :disabled="selectedYear >= maxYear"
          >
            <span :class="styles.buttonIcon">▶</span>
          </button>
        </div>
        
        <!-- Quarter Selector -->
        <div :class="styles.quarterGrid">
          <button
            v-for="quarter in quarters"
            :key="quarter.id"
            @click="selectQuarter(quarter.id)"
            :class="[
              styles.quarterCard,
              selectedQuarter === quarter.id ? styles.active : ''
            ]"
          >
            <div :class="styles.quarterContent">
              <span :class="styles.quarterLabel">{{ quarter.label }}</span>
              <span :class="styles.quarterPeriod">{{ quarter.period }}</span>
              <div :class="styles.quarterGlow"></div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import SearchableDropdown from '../SearchableDropdown/SearchableDropdown.vue'
import styles from './FilterBar.module.css'
import countriesData from '../../data/countries.json'
import currenciesData from '../../data/currencies.json'

interface Props {
  minYear?: number
  maxYear?: number
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  minYear: 2020,
  maxYear: 2030,
  modelValue: ''
})

const { t } = useI18n()

// Filter state
const searchQuery = ref('')
const selectedCurrency = ref('')
const selectedCountry = ref('')

// Quarter/Year state
const selectedYear = ref(2025)
const selectedQuarter = ref(1)

// Quarters configuration
const quarters = [
  { id: 1, label: 'First Half', period: 'Months 1-6' },
  { id: 3, label: 'Quarter 3', period: 'Months 7-9' },
  { id: 4, label: 'Quarter 4', period: 'Months 10-12' }
]

// Dropdown options
const countries = computed(() => [
  { value: '', label: t('businessQuarters.allCountries') },
  ...countriesData
])

const currencies = computed(() => [
  { value: '', label: t('businessQuarters.allCurrencies') },
  ...currenciesData
])

const emit = defineEmits<{
  search: [query: string]
  filter: [filter: { type: string; value: string }]
  clearFilters: []
  'update:modelValue': [value: string]
  'periodChanged': [period: string, quarter: number, year: number]
}>()

const hasActiveFilters = computed(() => {
  return selectedCurrency.value || selectedCountry.value
})

// Computed
const currentPeriod = computed(() => {
  const quarter = quarters.find(q => q.id === selectedQuarter.value)
  return quarter ? `${quarter.label} ${selectedYear.value}` : `Quarter ${selectedQuarter.value} ${selectedYear.value}`
})

// Get display labels for selected values
const selectedCurrencyLabel = computed(() => {
  if (!selectedCurrency.value) return ''
  const currency = currenciesData.find(c => c.value === selectedCurrency.value)
  return currency ? currency.label : selectedCurrency.value
})

const selectedCountryLabel = computed(() => {
  if (!selectedCountry.value) return ''
  const country = countriesData.find(c => c.value === selectedCountry.value)
  return country ? country.label : selectedCountry.value
})

// Filter methods
const clearSearch = () => {
  searchQuery.value = ''
  emit('search', '')
}

const clearCurrency = () => {
  selectedCurrency.value = ''
  emit('filter', { type: 'currency', value: '' })
}

const clearCountry = () => {
  selectedCountry.value = ''
  emit('filter', { type: 'country', value: '' })
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCurrency.value = ''
  selectedCountry.value = ''
  emit('clearFilters')
  emit('search', '')
}

// Dropdown change handlers
const handleCurrencyChange = (value: string | number) => {
  selectedCurrency.value = String(value)
  emit('filter', { type: 'currency', value: String(value) })
}

const handleCountryChange = (value: string | number) => {
  selectedCountry.value = String(value)
  emit('filter', { type: 'country', value: String(value) })
}

// Quarter/Year methods
const changeYear = (delta: number) => {
  const newYear = selectedYear.value + delta
  if (newYear >= props.minYear && newYear <= props.maxYear) {
    selectedYear.value = newYear
    emitPeriodChange()
  }
}

const selectQuarter = (quarterId: number) => {
  selectedQuarter.value = quarterId
  emitPeriodChange()
}

const emitPeriodChange = () => {
  const period = currentPeriod.value
  emit('update:modelValue', period)
  emit('periodChanged', period, selectedQuarter.value, selectedYear.value)
}
</script>
