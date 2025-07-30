<template>
  <div :class="styles.dashboardPage">
    <Header />
    
    <main :class="styles.mainContent">
      <!-- Hero Welcome Section -->
      <section :class="styles.heroSection">
        <div :class="styles.heroContent">
          <div :class="styles.heroText">
            <h1 :class="styles.heroTitle">{{ t('dashboard.welcome') }}</h1>
            <p :class="styles.heroSubtitle">{{ getCurrentDate() }}</p>
          </div>
          <div :class="styles.heroVisual">
            <img src="/PIF-logo.png" alt="PIF" />
          </div>
        </div>
      </section>

      <!-- Quick Stats Section -->
      <section :class="styles.statsSection">
        <div :class="styles.statsGrid">
          <div :class="styles.statCard">
            <div :class="styles.statIcon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
            <div :class="styles.statContent">
              <h3 :class="styles.statValue">{{ submissionStats.submitted }}</h3>
              <p :class="styles.statLabel">{{ t('dashboard.companiesSubmitted') }} Q{{ currentQuarter }} {{ currentYear }}</p>
              <div :class="[styles.statChange, { [styles.positive]: submissionStats.submissionRate > 75 }]">
                <span>{{ submissionStats.submissionRate }}% {{ t('dashboard.submissionRate') }}</span>
              </div>
            </div>
          </div>

          <div :class="styles.statCard">
            <div :class="styles.statIcon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
            </div>
            <div :class="styles.statContent">
              <h3 :class="styles.statValue">{{ Math.round(businessQuarterData[selectedQuarter]?.reduce((sum, company) => sum + (company.performanceScore || 0), 0) / (businessQuarterData[selectedQuarter]?.length || 1)) }}</h3>
              <p :class="styles.statLabel">{{ t('dashboard.averagePerformanceScore') }}</p>
              <div :class="[styles.statChange, { [styles.positive]: true }]">
                <span>+3.2% {{ t('dashboard.fromLastQuarter') }}</span>
              </div>
            </div>
          </div>

          <div :class="styles.statCard">
            <div :class="styles.statIcon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div :class="styles.statContent">
              <h3 :class="styles.statValue">{{ submissionStats.totalCompanies }}</h3>
              <p :class="styles.statLabel">{{ t('dashboard.totalPortfolioCompanies') }}</p>

            </div>
          </div>

          <div :class="styles.statCard">
            <div :class="styles.statIcon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
              </svg>
            </div>
            <div :class="styles.statContent">
              <h3 :class="styles.statValue">{{ daysToDeadline }}</h3>
              <p :class="styles.statLabel">{{ t('dashboard.daysToDeadline') }}</p>
              <div :class="[styles.statChange, { [styles.urgent]: daysToDeadline <= 7, [styles.warning]: daysToDeadline <= 30 }]">
                <span>{{ getDeadlineStatus() }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Quarter Filter Section -->
      <section :class="styles.filterSection">
        <div :class="styles.filterCard">
          <h2 :class="styles.filterTitle">{{ t('dashboard.analyticsFilter') }}</h2>
          <div :class="styles.filterControls">
            <div :class="styles.quarterFilter">
              <label :class="styles.filterLabel">{{ t('dashboard.quarter') }}:</label>
              <select v-model="selectedQuarter" @change="updateAnalytics" :class="styles.filterSelect">
                <option value="Q1 2025">Q1 2025</option>
                <option value="Q2 2025">Q2 2025</option>
                <option value="Q3 2025">Q3 2025</option>
                <option value="Q4 2025">Q4 2025</option>
                <option value="Q1 2024">Q1 2024</option>
                <option value="Q2 2024">Q2 2024</option>
                <option value="Q3 2024">Q3 2024</option>
                <option value="Q4 2024">Q4 2024</option>
              </select>
            </div>
            <div :class="styles.comparisonFilter">
              <label :class="styles.filterLabel">{{ t('dashboard.compareWith') }}:</label>
              <select v-model="comparisonQuarter" @change="updateAnalytics" :class="styles.filterSelect">
                <option value="">{{ t('dashboard.none') }}</option>
                <option value="Q1 2025">Q1 2025</option>
                <option value="Q2 2025">Q2 2025</option>
                <option value="Q3 2025">Q3 2025</option>
                <option value="Q4 2025">Q4 2025</option>
                <option value="Q1 2024">Q1 2024</option>
                <option value="Q2 2024">Q2 2024</option>
                <option value="Q3 2024">Q3 2024</option>
                <option value="Q4 2024">Q4 2024</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <!-- Charts Section -->
      <section :class="styles.chartsSection">
        <div :class="styles.chartsGrid">
          <!-- Chart 1: Submission Status Pie Chart -->
          <div :class="styles.chartCard">
            <div :class="styles.chartHeader">
              <h3 :class="styles.chartTitle">{{ t('dashboard.submissionStatusDistribution') }}</h3>
              <p :class="styles.chartSubtitle">{{ selectedQuarter }}</p>
            </div>
            <div :class="styles.chartContainer">
              <PieChart 
                :data="pieChartData" 
                :title="selectedQuarter"
                :height="300"
                :show-legend="true"
              />
            </div>
          </div>

          <!-- Chart 2: Companies by Country Bar Chart -->
          <div :class="styles.chartCard">
            <div :class="styles.chartHeader">
              <h3 :class="styles.chartTitle">{{ t('dashboard.companiesByCountry') }}</h3>
              <p :class="styles.chartSubtitle">{{ t('dashboard.geographicDistribution') }}</p>
            </div>
            <div :class="styles.chartContainer">
              <BarChart 
                :data="countryChartData" 
                title="Companies"
                :height="300"
                y-axis-label="Number of Companies"
                x-axis-label="Countries"
              />
            </div>
          </div>

          <!-- Chart 3: Ownership Distribution Bar Chart -->
          <div :class="styles.chartCard">
            <div :class="styles.chartHeader">
              <h3 :class="styles.chartTitle">{{ t('dashboard.ownershipDistribution') }}</h3>
              <p :class="styles.chartSubtitle">{{ t('dashboard.percentageRanges') }}</p>
            </div>
            <div :class="styles.chartContainer">
              <BarChart 
                :data="ownershipChartData" 
                title="Companies"
                :height="300"
                y-axis-label="Number of Companies"
                x-axis-label="Ownership Range"
              />
            </div>
          </div>

          <!-- Chart 4: Quarterly Trends Line Chart -->
          <div :class="styles.chartCard">
            <div :class="styles.chartHeader">
              <h3 :class="styles.chartTitle">{{ t('dashboard.quarterlySubmissionTrends') }}</h3>
              <p :class="styles.chartSubtitle">{{ t('dashboard.submissionRateOverTime') }}</p>
            </div>
            <div :class="styles.chartContainer">
              <LineChart 
                :labels="trendLabels"
                :datasets="trendDatasets"
                :height="300"
                y-axis-label="Submission Rate (%)"
                x-axis-label="Quarter"
                :smooth="true"
              />
            </div>
          </div>

                    <!-- Chart 6: Risk Exposure Area Chart -->
          <div :class="styles.chartCard">
            <div :class="styles.chartHeader">
              <h3 :class="styles.chartTitle">{{ t('dashboard.riskExposureByQuarter') }}</h3>
              <p :class="styles.chartSubtitle">{{ t('dashboard.currencyAndMarketRiskAnalysis') }}</p>
            </div>
            <div :class="styles.chartContainer">
              <AreaChart 
                :labels="riskLabels"
                :datasets="riskDatasets"
                :height="300"
                y-axis-label="Risk Level"
                x-axis-label="Quarter"
                :stacked="true"
              />
            </div>
          </div>

          <!-- Chart 8: Portfolio Diversification -->
          <div :class="styles.chartCard">
            <div :class="styles.chartHeader">
              <h3 :class="styles.chartTitle">{{ t('dashboard.portfolioDiversification') }}</h3>
              <p :class="styles.chartSubtitle">{{ t('dashboard.investmentDistributionBySector') }}</p>
            </div>
            <div :class="styles.chartContainer">
              <PieChart 
                :data="portfolioData" 
                title="Diversification"
                :height="300"
                :show-legend="true"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Advanced Analytics Section -->
      <section :class="styles.advancedSection">
        <div :class="styles.advancedGrid">
          <!-- Chart 5: Ownership vs Performance Scatter -->
          <div :class="styles.chartCard">
            <div :class="styles.chartHeader">
              <h3 :class="styles.chartTitle">{{ t('dashboard.ownershipVsPerformanceAnalysis') }}</h3>
              <p :class="styles.chartSubtitle">{{ t('dashboard.companyPerformanceCorrelation') }}</p>
            </div>
            <div :class="styles.chartContainer">
              <ScatterChart 
                :datasets="scatterDatasets"
                :height="300"
                x-axis-label="Ownership Percentage (%)"
                y-axis-label="Performance Score"
              />
            </div>
          </div>


        </div>
      </section>

      <!-- Key Insights Section -->
      <section :class="styles.insightsSection">
        <div :class="styles.insightsCard">
          <h2 :class="styles.insightsTitle">{{ t('dashboard.keyInsights') }}</h2>
          <div :class="styles.insightsList">
            <div v-for="insight in keyInsights" :key="insight.id" :class="[styles.insightItem, styles[insight.type]]">
              <div :class="styles.insightIcon">
                <svg v-if="insight.type === 'positive'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <svg v-else-if="insight.type === 'warning'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div :class="styles.insightContent">
                <h4 :class="styles.insightHeading">{{ insight.title }}</h4>
                <p :class="styles.insightDescription">{{ insight.description }}</p>
                <div v-if="insight.metrics" :class="styles.insightMetrics">
                  <span v-for="metric in insight.metrics" :key="metric" :class="styles.insightMetric">
                    {{ metric }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import Header from '../../components/Header/Header.vue'
import { PieChart, BarChart, LineChart, AreaChart, ScatterChart } from '../../components/Charts'
import styles from './Dashboard.module.css'

const { t } = useI18n()

// Types
interface CompanyData {
  id: string
  companyName: string
  submitted: boolean
  country: string
  ownership: number
  currency?: string
  relatedParties?: string
  performanceScore?: number
  sector?: string
}

interface QuarterData {
  [key: string]: CompanyData[]
}

interface InsightItem {
  id: number
  type: 'positive' | 'warning' | 'neutral'
  title: string
  description: string
  metrics?: string[]
}

// Current date and time
const getCurrentDate = () => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Current quarter and year
const currentQuarter = ref(3) // Q3 for July 2025
const currentYear = ref(2025)
const selectedQuarter = ref('Q3 2025')
const comparisonQuarter = ref('')

// Days to deadline calculation
const daysToDeadline = computed(() => {
  const deadlineDate = new Date(2025, 8, 30) // September 30, 2025 (Q3 deadline)
  const today = new Date()
  const diffTime = deadlineDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
})

const getDeadlineStatus = () => {
  const days = daysToDeadline.value
  if (days <= 7) return t('dashboard.urgent')
  if (days <= 30) return t('dashboard.dueSoon')
  return t('dashboard.onTrack')
}

// Enhanced sample data with more realistic business metrics and attractive values
const businessQuarterData = ref<QuarterData>({
  'Q3 2025': [
    { id: '1', companyName: 'Saudi Aramco', submitted: true, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 96, sector: 'Energy' },
    { id: '2', companyName: 'NEOM Technology', submitted: true, country: 'Saudi Arabia', ownership: 65, currency: 'USD', relatedParties: 'Joint Venture', performanceScore: 92, sector: 'Technology' },
    { id: '3', companyName: 'Saudi Green Initiative', submitted: true, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Environmental Entity', performanceScore: 88, sector: 'Environmental' },
    { id: '4', companyName: 'Red Sea Global', submitted: true, country: 'Saudi Arabia', ownership: 85, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 94, sector: 'Tourism' },
    { id: '5', companyName: 'ROSHN Group', submitted: true, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 90, sector: 'Real Estate' },
    { id: '6', companyName: 'Qiddiya Investment', submitted: true, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 89, sector: 'Entertainment' },
    { id: '7', companyName: 'ACWA Power', submitted: true, country: 'Saudi Arabia', ownership: 55, currency: 'USD', relatedParties: 'Joint Venture', performanceScore: 93, sector: 'Energy' },
    { id: '8', companyName: 'Saudi Telecom Company', submitted: true, country: 'Saudi Arabia', ownership: 74, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 91, sector: 'Telecommunications' },
    { id: '9', companyName: 'Ma\'aden', submitted: true, country: 'Saudi Arabia', ownership: 77, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 87, sector: 'Mining' },
    { id: '10', companyName: 'SABIC', submitted: true, country: 'Saudi Arabia', ownership: 80, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 95, sector: 'Chemicals' },
    { id: '11', companyName: 'AlUla Development', submitted: true, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 86, sector: 'Tourism' },
    { id: '12', companyName: 'Diriyah Gate', submitted: false, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 83, sector: 'Real Estate' },
    { id: '13', companyName: 'Thuwal Tech Hub', submitted: true, country: 'Saudi Arabia', ownership: 60, currency: 'USD', relatedParties: 'Joint Venture', performanceScore: 88, sector: 'Technology' },
    { id: '14', companyName: 'Cruise Saudi', submitted: true, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 85, sector: 'Tourism' },
    { id: '15', companyName: 'Saudi Space Agency', submitted: true, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 92, sector: 'Aerospace' },
    { id: '16', companyName: 'Emirates Global Aluminium', submitted: true, country: 'UAE', ownership: 45, currency: 'AED', relatedParties: 'Joint Venture', performanceScore: 89, sector: 'Manufacturing' },
    { id: '17', companyName: 'Masdar City', submitted: true, country: 'UAE', ownership: 68, currency: 'AED', relatedParties: 'Government Entity', performanceScore: 91, sector: 'Environmental' },
    { id: '18', companyName: 'DP World', submitted: true, country: 'UAE', ownership: 52, currency: 'AED', relatedParties: 'Government Entity', performanceScore: 94, sector: 'Logistics' },
    { id: '19', companyName: 'First Abu Dhabi Bank', submitted: true, country: 'UAE', ownership: 58, currency: 'AED', relatedParties: 'Government Entity', performanceScore: 88, sector: 'Banking' },
    { id: '20', companyName: 'Etisalat Group', submitted: false, country: 'UAE', ownership: 60, currency: 'AED', relatedParties: 'Government Entity', performanceScore: 87, sector: 'Telecommunications' },
    { id: '21', companyName: 'Qatar Energy', submitted: true, country: 'Qatar', ownership: 85, currency: 'QAR', relatedParties: 'Government Entity', performanceScore: 95, sector: 'Energy' },
    { id: '22', companyName: 'Qatar Airways', submitted: true, country: 'Qatar', ownership: 100, currency: 'QAR', relatedParties: 'Government Entity', performanceScore: 93, sector: 'Aviation' },
    { id: '23', companyName: 'Qatargas', submitted: true, country: 'Qatar', ownership: 70, currency: 'QAR', relatedParties: 'Joint Venture', performanceScore: 90, sector: 'Energy' },
    { id: '24', companyName: 'Qatar National Bank', submitted: true, country: 'Qatar', ownership: 50, currency: 'QAR', relatedParties: 'Government Entity', performanceScore: 89, sector: 'Banking' },
    { id: '25', companyName: 'Ooredoo Qatar', submitted: false, country: 'Qatar', ownership: 65, currency: 'QAR', relatedParties: 'Government Entity', performanceScore: 86, sector: 'Telecommunications' },
    { id: '26', companyName: 'Kuwait Petroleum Corp', submitted: true, country: 'Kuwait', ownership: 100, currency: 'KWD', relatedParties: 'Government Entity', performanceScore: 92, sector: 'Energy' },
    { id: '27', companyName: 'Gulf Bank Kuwait', submitted: true, country: 'Kuwait', ownership: 48, currency: 'KWD', relatedParties: 'Government Entity', performanceScore: 84, sector: 'Banking' },
    { id: '28', companyName: 'Zain Kuwait', submitted: true, country: 'Kuwait', ownership: 47, currency: 'KWD', relatedParties: 'Joint Venture', performanceScore: 87, sector: 'Telecommunications' },
    { id: '29', companyName: 'National Bank Bahrain', submitted: true, country: 'Bahrain', ownership: 55, currency: 'BHD', relatedParties: 'Government Entity', performanceScore: 85, sector: 'Banking' },
    { id: '30', companyName: 'Bahrain Petroleum', submitted: true, country: 'Bahrain', ownership: 100, currency: 'BHD', relatedParties: 'Government Entity', performanceScore: 88, sector: 'Energy' },
  ],
  'Q2 2025': [
    { id: '1', companyName: 'Saudi Aramco', submitted: true, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 94, sector: 'Energy' },
    { id: '2', companyName: 'NEOM Technology', submitted: false, country: 'Saudi Arabia', ownership: 65, currency: 'USD', relatedParties: 'Joint Venture', performanceScore: 89, sector: 'Technology' },
    { id: '3', companyName: 'Saudi Green Initiative', submitted: true, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Environmental Entity', performanceScore: 85, sector: 'Environmental' },
    { id: '4', companyName: 'Red Sea Global', submitted: false, country: 'Saudi Arabia', ownership: 85, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 91, sector: 'Tourism' },
    { id: '5', companyName: 'ROSHN Group', submitted: true, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 87, sector: 'Real Estate' },
    { id: '6', companyName: 'Ma\'aden', submitted: true, country: 'Saudi Arabia', ownership: 77, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 84, sector: 'Mining' },
    { id: '7', companyName: 'SABIC', submitted: true, country: 'Saudi Arabia', ownership: 80, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 92, sector: 'Chemicals' },
    { id: '8', companyName: 'ACWA Power', submitted: true, country: 'Saudi Arabia', ownership: 55, currency: 'USD', relatedParties: 'Joint Venture', performanceScore: 90, sector: 'Energy' },
    { id: '9', companyName: 'AlUla Development', submitted: false, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 82, sector: 'Tourism' },
    { id: '10', companyName: 'Saudi Space Agency', submitted: true, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 88, sector: 'Aerospace' },
    { id: '11', companyName: 'Emirates Global Aluminium', submitted: true, country: 'UAE', ownership: 45, currency: 'AED', relatedParties: 'Joint Venture', performanceScore: 87, sector: 'Manufacturing' },
    { id: '12', companyName: 'DP World', submitted: true, country: 'UAE', ownership: 52, currency: 'AED', relatedParties: 'Government Entity', performanceScore: 92, sector: 'Logistics' },
    { id: '13', companyName: 'Qatar Energy', submitted: false, country: 'Qatar', ownership: 85, currency: 'QAR', relatedParties: 'Government Entity', performanceScore: 93, sector: 'Energy' },
    { id: '14', companyName: 'Kuwait Petroleum Corp', submitted: true, country: 'Kuwait', ownership: 100, currency: 'KWD', relatedParties: 'Government Entity', performanceScore: 90, sector: 'Energy' },
    { id: '15', companyName: 'Bahrain Petroleum', submitted: true, country: 'Bahrain', ownership: 100, currency: 'BHD', relatedParties: 'Government Entity', performanceScore: 86, sector: 'Energy' },
  ],
  'Q1 2025': [
    { id: '1', companyName: 'Saudi Aramco', submitted: true, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 93, sector: 'Energy' },
    { id: '2', companyName: 'NEOM Technology', submitted: true, country: 'Saudi Arabia', ownership: 65, currency: 'USD', relatedParties: 'Joint Venture', performanceScore: 86, sector: 'Technology' },
    { id: '3', companyName: 'Saudi Green Initiative', submitted: true, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Environmental Entity', performanceScore: 83, sector: 'Environmental' },
    { id: '4', companyName: 'Red Sea Global', submitted: true, country: 'Saudi Arabia', ownership: 85, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 89, sector: 'Tourism' },
    { id: '5', companyName: 'ROSHN Group', submitted: false, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 84, sector: 'Real Estate' },
    { id: '6', companyName: 'Ma\'aden', submitted: true, country: 'Saudi Arabia', ownership: 77, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 81, sector: 'Mining' },
    { id: '7', companyName: 'SABIC', submitted: true, country: 'Saudi Arabia', ownership: 80, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 90, sector: 'Chemicals' },
    { id: '8', companyName: 'Saudi Space Agency', submitted: true, country: 'Saudi Arabia', ownership: 100, currency: 'SAR', relatedParties: 'Government Entity', performanceScore: 85, sector: 'Aerospace' },
    { id: '9', companyName: 'Masdar City', submitted: true, country: 'UAE', ownership: 68, currency: 'AED', relatedParties: 'Government Entity', performanceScore: 89, sector: 'Environmental' },
    { id: '10', companyName: 'Qatar Airways', submitted: true, country: 'Qatar', ownership: 100, currency: 'QAR', relatedParties: 'Government Entity', performanceScore: 91, sector: 'Aviation' },
    { id: '11', companyName: 'Kuwait Petroleum Corp', submitted: false, country: 'Kuwait', ownership: 100, currency: 'KWD', relatedParties: 'Government Entity', performanceScore: 88, sector: 'Energy' },
    { id: '12', companyName: 'National Bank Bahrain', submitted: true, country: 'Bahrain', ownership: 55, currency: 'BHD', relatedParties: 'Government Entity', performanceScore: 83, sector: 'Banking' },
  ]
})

// Computed statistics
const submissionStats = computed(() => {
  const currentData = businessQuarterData.value[selectedQuarter.value] || []
  const previousQuarter = getPreviousQuarter(selectedQuarter.value)
  const previousData = businessQuarterData.value[previousQuarter] || []
  
  const submitted = currentData.filter((company: CompanyData) => company.submitted).length
  const failed = previousData.filter((company: CompanyData) => !company.submitted).length
  const totalCompanies = currentData.length
  const submissionRate = totalCompanies > 0 ? Math.round((submitted / totalCompanies) * 100) : 0
  const failureRate = previousData.length > 0 ? Math.round((failed / previousData.length) * 100) : 0
  const complianceRate = totalCompanies > 0 ? Math.round(((submitted + (totalCompanies - failed)) / (totalCompanies * 2)) * 100) : 0
  
  return {
    submitted,
    failed,
    totalCompanies,
    submissionRate,
    failureRate,
    complianceRate
  }
})

// Chart data for Chart.js components
const pieChartData = computed(() => {
  const stats = submissionStats.value
  return [
    {
      label: 'Submitted',
      value: stats.submitted,
      color: '#00FFC2'
    },
    {
      label: 'Not Submitted',
      value: stats.totalCompanies - stats.submitted,
      color: '#CBA35C'
    }
  ]
})

const countryChartData = computed(() => {
  const currentData = businessQuarterData.value[selectedQuarter.value] || []
  const countryCounts = currentData.reduce((acc: Record<string, number>, company: CompanyData) => {
    acc[company.country] = (acc[company.country] || 0) + 1
    return acc
  }, {})
  
  // Enhanced color palette for better visual appeal and country diversity
  const colors = [
    '#007E31',  // Saudi Green
    '#00FFC2',  // Bright Cyan
    '#2AB8FF',  // Sky Blue
    '#CBA35C',  // Gold
    '#FF6B6B',  // Coral Red
    '#4ECDC4',  // Teal
    '#45B7D1',  // Blue
    '#96CEB4',  // Mint Green
    '#FECA57',  // Yellow
    '#FF9FF3'   // Pink
  ]
  
  return Object.entries(countryCounts).map(([name, count], index) => ({
    label: name,
    value: count as number,
    color: colors[index % colors.length]
  }))
})

const ownershipChartData = computed(() => {
  const currentData = businessQuarterData.value[selectedQuarter.value] || []
  const ranges = {
    '0-25%': 0,
    '26-50%': 0,
    '51-75%': 0,
    '76-100%': 0
  }
  
  currentData.forEach((company: CompanyData) => {
    const ownership = company.ownership
    if (ownership <= 25) ranges['0-25%']++
    else if (ownership <= 50) ranges['26-50%']++
    else if (ownership <= 75) ranges['51-75%']++
    else ranges['76-100%']++
  })
  
  const colors = ['#2AB8FF', '#00FFC2', '#CBA35C', '#007E31']
  
  return Object.entries(ranges).map(([label, count], index) => ({
    label,
    value: count,
    color: colors[index]
  }))
})

// Trend data for line chart
const trendLabels = computed(() => ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025', 'Q2 2025', 'Q3 2025'])

const trendDatasets = computed(() => {
  const submissionRates = [89, 83, 87, 94, 92, 78, submissionStats.value.submissionRate]
  const complianceRates = [92, 86, 90, 97, 95, 82, submissionStats.value.complianceRate]
  const performanceRates = [88, 85, 89, 93, 91, 87, 89]
  
  return [
    {
      label: 'Submission Rate',
      data: submissionRates,
      color: '#00FFC2',
      fill: false
    },
    {
      label: 'Compliance Rate',
      data: complianceRates,
      color: '#2AB8FF',
      fill: false
    },
    {
      label: 'Performance Rate',
      data: performanceRates,
      color: '#CBA35C',
      fill: false
    }
  ]
})

// Scatter chart data for ownership vs performance
const scatterDatasets = computed(() => {
  const currentData = businessQuarterData.value[selectedQuarter.value] || []
  
  return [
    {
      label: 'Companies',
      data: currentData.map(company => ({
        x: company.ownership,
        y: company.performanceScore || 0,
        label: company.companyName
      })),
      color: '#00FFC2'
    }
  ]
})

// Risk area chart data
const riskLabels = computed(() => ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025', 'Q2 2025', 'Q3 2025'])

const riskDatasets = computed(() => [
  {
    label: 'Currency Risk',
    data: [18, 22, 15, 25, 19, 28, 23],
    color: 'rgba(203, 163, 92, 0.9)',
    fillOpacity: 0.7
  },
  {
    label: 'Market Risk',
    data: [28, 35, 25, 32, 27, 38, 30],
    color: 'rgba(42, 184, 255, 0.9)',
    fillOpacity: 0.7
  },
  {
    label: 'Operational Risk',
    data: [12, 15, 10, 18, 13, 20, 16],
    color: 'rgba(0, 255, 194, 0.9)',
    fillOpacity: 0.7
  },
  {
    label: 'Regulatory Risk',
    data: [8, 10, 6, 12, 9, 14, 11],
    color: 'rgba(255, 107, 107, 0.8)',
    fillOpacity: 0.6
  }
])

// Compliance metrics data
// const complianceMetricsData = computed(() => [
//   { label: 'Data Quality', value: 96, color: '#00FFC2' },
//   { label: 'Timeliness', value: submissionStats.value.submissionRate, color: '#2AB8FF' },
//   { label: 'Completeness', value: 94, color: '#007E31' },
//   { label: 'Accuracy', value: 98, color: '#CBA35C' },
//   { label: 'Consistency', value: 91, color: '#FF8C42' },
//   { label: 'Transparency', value: 93, color: '#9D4EDD' }
// ])

// Portfolio diversification data
const portfolioData = computed(() => {
  const currentData = businessQuarterData.value[selectedQuarter.value] || []
  const sectorCounts = currentData.reduce((acc: Record<string, number>, company: CompanyData) => {
    const sector = company.sector || 'Other'
    acc[sector] = (acc[sector] || 0) + 1
    return acc
  }, {})
  
  const colors = ['#007E31', '#00FFC2', '#2AB8FF', '#CBA35C', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
  
  return Object.entries(sectorCounts).map(([label, value], index) => ({
    label,
    value: value as number,
    color: colors[index % colors.length]
  }))
})

// Key insights
const keyInsights = computed((): InsightItem[] => {
  const stats = submissionStats.value
  const insights: InsightItem[] = []
  
  // Positive insights
  if (stats.submissionRate >= 75) {
    insights.push({
      id: 1,
      type: 'positive',
      title: t('dashboard.insights.strongCompliance'),
      description: `${stats.submissionRate}${t('dashboard.insights.strongComplianceDesc').replace('{quarter}', selectedQuarter.value)}`,
      metrics: [`${stats.submitted}/${stats.totalCompanies} ${t('dashboard.insights.companiesCompliance')}`, `${stats.complianceRate}${t('dashboard.insights.overallCompliance')}`]
    })
  }
  
  // Performance insight
  const avgPerformance = businessQuarterData.value[selectedQuarter.value]?.reduce((sum, company) => 
    sum + (company.performanceScore || 0), 0) / (businessQuarterData.value[selectedQuarter.value]?.length || 1)
  
  if (avgPerformance > 85) {
    insights.push({
      id: 2,
      type: 'positive',
      title: t('dashboard.insights.highPerformance'),
      description: t('dashboard.insights.highPerformanceDesc').replace('{score}', avgPerformance.toFixed(1)),
      metrics: [`${avgPerformance.toFixed(1)} ${t('dashboard.insights.averageScore')}`, t('dashboard.insights.aboveBenchmark')]
    })
  }
  
  // Warning insights
  if (daysToDeadline.value <= 15) {
    insights.push({
      id: 3,
      type: 'warning',
      title: t('dashboard.insights.upcomingDeadline'),
      description: t('dashboard.insights.upcomingDeadlineDesc').replace('{days}', daysToDeadline.value.toString()),
      metrics: [`${daysToDeadline.value} ${t('dashboard.insights.daysRemaining')}`, `${stats.totalCompanies - stats.submitted} ${t('dashboard.insights.pending')}`]
    })
  }
  
  // Diversification insight
  const uniqueSectors = [...new Set(businessQuarterData.value[selectedQuarter.value]?.map(c => c.sector) || [])]
  insights.push({
    id: 4,
    type: 'neutral',
    title: t('dashboard.insights.portfolioDiversification'),
    description: t('dashboard.insights.portfolioDiversificationDesc').replace('{sectors}', uniqueSectors.length.toString()),
    metrics: uniqueSectors.slice(0, 3).map(sector => sector || 'Other')
  })
  
  return insights
})

// Helper functions
const getPreviousQuarter = (quarter: string) => {
  const [q, year] = quarter.split(' ')
  const quarterNum = parseInt(q.replace('Q', ''))
  
  if (quarterNum === 1) {
    return `Q4 ${parseInt(year) - 1}`
  } else {
    return `Q${quarterNum - 1} ${year}`
  }
}

const updateAnalytics = () => {
  console.log(`Analytics updated for ${selectedQuarter.value}`)
  if (comparisonQuarter.value) {
    console.log(`Comparing with ${comparisonQuarter.value}`)
  }
}

// Lifecycle
onMounted(() => {
  updateAnalytics()
})
</script>