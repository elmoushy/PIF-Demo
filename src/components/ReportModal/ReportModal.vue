<template>
  <div v-if="isOpen" :class="styles.modalOverlay" @click="closeModal">
    <div :class="styles.modalContent" @click.stop>
      <div :class="styles.modalHeader">
        <h2>{{ t('businessQuarters.generateReport') }}</h2>
        <button @click="closeModal" :class="styles.closeButton">✖️</button>
      </div>
      
      <div :class="styles.modalBody">
        <div :class="styles.userInfo">
          <p><strong>{{ t('businessQuarters.user') }}:</strong> {{ userRole }} ({{ username }})</p>
          <p><strong>{{ t('businessQuarters.currentPeriod') }}:</strong> {{ currentPeriod }}</p>
          <p><strong>{{ t('businessQuarters.previousPeriod') }}:</strong> {{ previousPeriod || t('businessQuarters.noPreviousPeriod') }}</p>
        </div>

        <!-- Report Format Selection (All Users) -->
        <div :class="styles.reportOptions">
          <h3>{{ t('businessQuarters.reportFormat') }}</h3>
          
          <div :class="styles.optionGroup">
            <label :class="styles.radioOption">
              <input 
                type="radio" 
                v-model="selectedReportFormat" 
                value="full-data"
                :class="styles.radioInput"
              />
              <div :class="styles.optionContent">
                <strong>{{ t('businessQuarters.fullDataReport') }}</strong>
                <p>{{ t('businessQuarters.fullDataReportDesc') }}</p>
              </div>
            </label>
            
            <label :class="styles.radioOption">
              <input 
                type="radio" 
                v-model="selectedReportFormat" 
                value="change-tracking"
                :class="styles.radioInput"
              />
              <div :class="styles.optionContent">
                <strong>{{ t('businessQuarters.changeTrackingReport') }}</strong>
                <p>{{ t('businessQuarters.changeTrackingReportDesc') }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Administrator Report Options -->
        <div v-if="userRole === 'Administrator'" :class="styles.reportOptions">
          <h3>{{ t('businessQuarters.reportType') }}</h3>
          
          <div :class="styles.optionGroup">
            <label :class="styles.radioOption">
              <input 
                type="radio" 
                v-model="selectedReportType" 
                value="consolidated"
                :class="styles.radioInput"
              />
              <div :class="styles.optionContent">
                <strong>{{ t('businessQuarters.consolidatedReport') }}</strong>
                <p>{{ t('businessQuarters.consolidatedReportDesc') }}</p>
              </div>
            </label>
            
            <label :class="styles.radioOption">
              <input 
                type="radio" 
                v-model="selectedReportType" 
                value="company-specific"
                :class="styles.radioInput"
              />
              <div :class="styles.optionContent">
                <strong>{{ t('businessQuarters.companySpecificReport') }}</strong>
                <p>{{ t('businessQuarters.companySpecificReportDesc') }}</p>
              </div>
            </label>
          </div>

          <!-- Company Selection for Company-Specific Report -->
          <div v-if="selectedReportType === 'company-specific'" :class="styles.companySelection">
            <label for="targetCompany">{{ t('businessQuarters.selectCompany') }}:</label>
            <select 
              id="targetCompany"
              v-model="selectedCompany" 
              :class="styles.companySelect"
            >
              <option value="">{{ t('businessQuarters.chooseCompany') }}</option>
              <option value="PIF_SubmitIQ">PIF_SubmitIQ (Administrator)</option>
              <option value="Company">Company</option>
            </select>
          </div>
        </div>

        <!-- Company User - Auto Report Type -->
        <div v-else :class="styles.companyUserInfo">
          <div :class="styles.infoBox">
            <h3>{{ t('businessQuarters.companyReport') }}</h3>
            <p>{{ t('businessQuarters.companyReportDesc') }}</p>
          </div>
        </div>

        <!-- Report Content Info -->
        <div :class="styles.reportInfo">
          <h3 v-if="selectedReportFormat === 'full-data'">{{ t('businessQuarters.reportContentsFullData') }}</h3>
          <h3 v-else>{{ t('businessQuarters.reportContentsChangeTracking') }}</h3>
          
          <ul :class="styles.contentList">
            <li>{{ t('businessQuarters.allColumns') }}</li>
            <li v-if="selectedReportFormat === 'change-tracking'">{{ t('businessQuarters.ownershipComparison') }}</li>
            <li v-if="selectedReportFormat === 'change-tracking' && previousPeriod">{{ t('businessQuarters.periodComparison') }}</li>
            <li v-if="selectedReportFormat === 'change-tracking' && previousPeriod">{{ t('businessQuarters.changesAnalysis') }}</li>
            <li v-if="selectedReportFormat === 'change-tracking' && previousPeriod">{{ t('businessQuarters.deletedRecordsTracking') }}</li>
            <li>{{ t('businessQuarters.excelFormat') }}</li>
          </ul>
        </div>
      </div>
      
      <div :class="styles.modalFooter">
        <button 
          @click="closeModal" 
          :class="styles.cancelButton"
        >
          {{ t('businessQuarters.cancel') }}
        </button>
        <button 
          @click="generateReport" 
          :class="styles.generateButton"
          :disabled="isGenerating || (userRole === 'Administrator' && selectedReportType === 'company-specific' && !selectedCompany)"
        >
          <span v-if="isGenerating">{{ t('businessQuarters.generating') }}...</span>
          <span v-else>{{ t('businessQuarters.generateExcelReport') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import { reportService, type ReportOptions } from '../../services/reportService'
import { dataService } from '../../services/dataService'
import { notificationService } from '../../services/notificationService'
import styles from './ReportModal.module.css'

interface Props {
  isOpen: boolean
  userRole: 'Administrator' | 'Company'
  username: string
  currentPeriod: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  reportGenerated: [success: boolean]
}>()

const { t } = useI18n()

// Modal state
const isGenerating = ref(false)
const selectedReportFormat = ref<'full-data' | 'change-tracking'>('change-tracking')
const selectedReportType = ref<'consolidated' | 'company-specific'>('consolidated')
const selectedCompany = ref<string>('')

// Computed properties
const previousPeriod = computed(() => {
  return dataService.getPreviousQuarter(props.currentPeriod)
})

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedReportFormat.value = 'change-tracking'
    selectedReportType.value = 'consolidated'
    selectedCompany.value = ''
  }
})

// Methods
const closeModal = () => {
  if (!isGenerating.value) {
    emit('close')
  }
}

const generateReport = async () => {
  try {
    isGenerating.value = true
    
    // Build report options
    const reportOptions: ReportOptions = {
      userRole: props.userRole,
      username: props.username,
      currentPeriod: props.currentPeriod,
      reportType: selectedReportFormat.value
    }
    
    if (props.userRole === 'Administrator') {
      reportOptions.includeAllCompanies = selectedReportType.value === 'consolidated'
      if (selectedReportType.value === 'company-specific' && selectedCompany.value) {
        reportOptions.targetCompany = selectedCompany.value
      }
    }
    
    // Generate the report
    await reportService.generateExcelReport(reportOptions)
    
    // Show success message
    const reportFormatText = selectedReportFormat.value === 'full-data' 
      ? 'Full Data' 
      : 'Change Tracking'
    const reportTypeText = props.userRole === 'Administrator' 
      ? (reportOptions.includeAllCompanies ? 'Consolidated' : `Company-specific (${selectedCompany.value})`)
      : 'Company'
    
    notificationService.success(
      t('businessQuarters.reportGenerated'),
      `${reportFormatText} ${reportTypeText} Excel report for ${props.currentPeriod} has been downloaded successfully.`
    )
    
    emit('reportGenerated', true)
    emit('close')
    
  } catch (error) {
    console.error('Report generation failed:', error)
    notificationService.error(
      t('businessQuarters.reportGenerationFailed'),
      t('businessQuarters.reportGenerationFailedDesc')
    )
    emit('reportGenerated', false)
  } finally {
    isGenerating.value = false
  }
}
</script>
