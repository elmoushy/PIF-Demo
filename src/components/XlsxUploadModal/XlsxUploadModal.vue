<template>
  <Teleport to="body">
    <div v-if="isVisible" :class="styles.modalOverlay" @click="handleOverlayClick">
      <div :class="styles.modal" @click.stop>
        <div :class="styles.modalHeader">
          <h2 :class="styles.modalTitle">
            <span :class="styles.titleIcon">📊</span>
            {{ t('xlsxUpload.title') }}
          </h2>
          <button 
            @click="closeModal" 
            :class="styles.closeButton"
            type="button"
          >
            ✖️
          </button>
        </div>

      <div :class="styles.modalBody">
        <!-- Step 1: Download Template -->
        <div :class="styles.step">
          <div :class="styles.stepHeader">
            <span :class="styles.stepNumber">1</span>
            <h3 :class="styles.stepTitle">{{ t('xlsxUpload.step1Title') }}</h3>
          </div>
          <p :class="styles.stepDescription">{{ t('xlsxUpload.step1Description') }}</p>
          <button 
            @click="downloadTemplate" 
            :class="styles.downloadButton"
            :disabled="isGeneratingTemplate"
          >
            <span :class="styles.buttonIcon">📥</span>
            {{ isGeneratingTemplate ? t('xlsxUpload.generating') : t('xlsxUpload.downloadTemplate') }}
          </button>
        </div>

        <!-- Step 2: Upload File -->
        <div :class="styles.step">
          <div :class="styles.stepHeader">
            <span :class="styles.stepNumber">2</span>
            <h3 :class="styles.stepTitle">{{ t('xlsxUpload.step2Title') }}</h3>
          </div>
          <p :class="styles.stepDescription">{{ t('xlsxUpload.step2Description') }}</p>
          
          <div :class="styles.uploadArea" @dragover.prevent @drop="handleDrop">
            <input 
              ref="fileInput"
              type="file" 
              accept=".xlsx,.xls"
              @change="handleFileSelect"
              :class="styles.fileInput"
              id="xlsx-file-input"
            />
            <label for="xlsx-file-input" :class="styles.uploadLabel">
              <div :class="styles.uploadContent">
                <span :class="styles.uploadIcon">📁</span>
                <span v-if="!selectedFile" :class="styles.uploadText">
                  {{ t('xlsxUpload.selectFile') }}
                </span>
                <span v-else :class="styles.selectedFile">
                  {{ selectedFile.name }}
                </span>
                <span :class="styles.uploadHint">{{ t('xlsxUpload.dragDrop') }}</span>
              </div>
            </label>
          </div>

          <div v-if="uploadError" :class="styles.errorMessage">
            <span :class="styles.errorIcon">⚠️</span>
            {{ uploadError }}
          </div>
        </div>

        <!-- Preview Section -->
        <div v-if="previewData.length > 0" :class="styles.previewSection">
          <h3 :class="styles.previewTitle">
            <span :class="styles.previewIcon">👀</span>
            {{ t('xlsxUpload.preview') }}
          </h3>
          <p :class="styles.previewDescription">
            {{ t('xlsxUpload.previewDescription') }} ({{ previewData.length }} {{ t('xlsxUpload.rowsFound') }})
          </p>
          
          <div :class="styles.previewTable">
            <table :class="styles.table">
              <thead>
                <tr>
                  <th v-for="column in previewColumns" :key="column" :class="styles.tableHeader">
                    {{ column }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in previewData.slice(0, 5)" :key="index" :class="styles.tableRow">
                  <td v-for="column in previewColumns" :key="column" :class="styles.tableCell">
                    {{ row[column] || '' }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="previewData.length > 5" :class="styles.previewNote">
              {{ t('xlsxUpload.showingRows') }}: 5 {{ t('xlsxUpload.of') }} {{ previewData.length }}
            </div>
          </div>
        </div>
      </div>

      <div :class="styles.modalFooter">
        <button 
          @click="closeModal" 
          :class="styles.cancelButton"
        >
          {{ t('xlsxUpload.cancel') }}
        </button>
        <button 
          @click="processUpload" 
          :class="styles.uploadButton"
          :disabled="!selectedFile || isProcessing"
        >
          <span :class="styles.buttonIcon">⬆️</span>
          {{ isProcessing ? t('xlsxUpload.processing') : t('xlsxUpload.importData') }}
        </button>
      </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import { useAuthStore } from '../../stores/useAuthStore'
import * as XLSX from 'xlsx-js-style'
import styles from './XlsxUploadModal.module.css'

interface Props {
  isVisible: boolean
  columns: Array<{ key: string; label?: string; required?: boolean }>
  currentPeriod?: string
}

interface TableRow {
  id: string
  isModified?: boolean
  isNewRow?: boolean
  [key: string]: any
}

const props = withDefaults(defineProps<Props>(), {
  currentPeriod: 'Q1 2025'
})

const emit = defineEmits<{
  close: []
  upload: [data: TableRow[]]
}>()

const { t } = useI18n()
const authStore = useAuthStore()

// State
const selectedFile = ref<File | null>(null)
const uploadError = ref<string>('')
const previewData = ref<any[]>([])
const previewColumns = ref<string[]>([])
const isGeneratingTemplate = ref(false)
const isProcessing = ref(false)
const fileInput = ref<HTMLInputElement>()

// Computed
const userRole = computed(() => authStore.user?.role || 'Administrator')

// Column mapping based on user role
const getColumnMapping = () => {
  const baseColumns = [
    { key: 'assetCode', label: 'ASSET CODE', required: true },
    { key: 'entityNameEnglish', label: 'Entity Name', required: true },
    { key: 'entityNameArabic', label: 'Arabic Legal Name', required: true },
    { key: 'commercialRegistrationNumber', label: 'Commercial Registration (CR) Number', required: true },
    { key: 'moiNumber', label: 'MOI (700) Number', required: false },
    { key: 'countryOfIncorporation', label: 'Country of Incorporation', required: true },
    { key: 'ownershipPercentage', label: 'Ownership Percentage (%)', required: true },
    { key: 'acquisitionDisposalDate', label: 'Acquisition/Disposal Date Only for entities acquired/disposed', required: false },
    { key: 'directParentEntity', label: 'Direct Parent', required: false },
    { key: 'ultimateParentEntity', label: 'Ultimate Parent', required: false },
    { key: 'investmentRelationshipType', label: 'Relationship of investment (Subsidiary/ Associate/ JV)', required: true },
    { key: 'principalActivities', label: 'Entity\'s Principal Activities', required: true }
  ]

  // Add ownership structure column with different behavior based on user role
  if (userRole.value === 'Company') {
    baseColumns.push({
      key: 'ownershipStructure',
      label: 'Direct / In-direct',
      required: true
    })
  } else {
    // For Administrator (PIF_SubmitIQ), this will be hardcoded as "Direct to PIF"
    baseColumns.push({
      key: 'ownershipStructure',
      label: 'Direct / In-direct',
      required: true
    })
  }

  return baseColumns
}

// Generate sample template data
const generateSampleData = (): Record<string, string>[] => {
  if (userRole.value === 'Company') {
    // Sample data for Company users
    return [
      {
        assetCode: 'COMP001',
        entityNameEnglish: 'Saudi Telecom Company',
        entityNameArabic: 'شركة الاتصالات السعودية',
        commercialRegistrationNumber: '1010001234',
        moiNumber: '7001234567',
        countryOfIncorporation: 'SAU',
        ownershipPercentage: '75.50',
        acquisitionDisposalDate: '2023-01-15',
        directParentEntity: '',
        ultimateParentEntity: 'Public Investment Fund',
        investmentRelationshipType: 'Subsidiary',
        ownershipStructure: 'Direct',
        principalActivities: 'Telecommunications services and infrastructure'
      },
      {
        assetCode: 'COMP002',
        entityNameEnglish: 'Almarai Company',
        entityNameArabic: 'شركة المراعي',
        commercialRegistrationNumber: '1010005678',
        moiNumber: '7005678901',
        countryOfIncorporation: 'SAU',
        ownershipPercentage: '25.00',
        acquisitionDisposalDate: '',
        directParentEntity: 'Saudi Telecom Company',
        ultimateParentEntity: 'Public Investment Fund',
        investmentRelationshipType: 'Associate',
        ownershipStructure: 'In-direct',
        principalActivities: 'Food and beverage production and distribution'
      }
    ]
  } else {
    // Sample data for Administrator (PIF_SubmitIQ)
    return [
      {
        assetCode: 'PIF001',
        entityNameEnglish: 'NEOM Company',
        entityNameArabic: 'شركة نيوم',
        commercialRegistrationNumber: '1010009876',
        moiNumber: '7009876543',
        countryOfIncorporation: 'SAU',
        ownershipPercentage: '100.00',
        acquisitionDisposalDate: '2022-10-01',
        directParentEntity: '',
        ultimateParentEntity: 'Public Investment Fund',
        investmentRelationshipType: 'Subsidiary',
        ownershipStructure: 'Direct to PIF',
        principalActivities: 'Smart city development and technology innovation'
      },
      {
        assetCode: 'PIF002',
        entityNameEnglish: 'Red Sea Development Company',
        entityNameArabic: 'شركة تطوير البحر الأحمر',
        commercialRegistrationNumber: '1010001111',
        moiNumber: '7001111222',
        countryOfIncorporation: 'SAU',
        ownershipPercentage: '100.00',
        acquisitionDisposalDate: '',
        directParentEntity: '',
        ultimateParentEntity: 'Public Investment Fund',
        investmentRelationshipType: 'Subsidiary',
        ownershipStructure: 'Direct to PIF',
        principalActivities: 'Tourism and hospitality development'
      }
    ]
  }
}

// Download template function
const downloadTemplate = async () => {
  isGeneratingTemplate.value = true
  uploadError.value = ''

  try {
    const columns = getColumnMapping()
    const sampleData = generateSampleData()

    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Create worksheet with headers
    const headers = columns.map(col => col.label || col.key)
    const wsData = [headers, ...sampleData.map(row => 
      columns.map(col => (row as any)[col.key] || '')
    )]

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Style the header row
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C })
      if (!ws[address]) continue
      ws[address].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "00B58D" } },
        alignment: { horizontal: "center" }
      }
    }

    // Set column widths
    const colWidths = columns.map(col => {
      const maxLength = Math.max(
        (col.label || col.key).length,
        ...sampleData.map(row => String((row as any)[col.key] || '').length)
      )
      return { width: Math.min(Math.max(maxLength + 2, 15), 50) }
    })
    ws['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data Entry Template')

    // Generate filename with timestamp and user role
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const rolePrefix = userRole.value === 'Company' ? 'Company' : 'PIF'
    const filename = `${rolePrefix}_Data_Template_${props.currentPeriod}_${timestamp}.xlsx`

    // Write and download file
    XLSX.writeFile(wb, filename)

  } catch (error) {
    console.error('Template generation error:', error)
    uploadError.value = t('xlsxUpload.templateError')
  } finally {
    isGeneratingTemplate.value = false
  }
}

// Handle file selection
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    handleFileUpload(target.files[0])
  }
}

// Handle drag and drop
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    handleFileUpload(event.dataTransfer.files[0])
  }
}

// Process uploaded file
const handleFileUpload = async (file: File) => {
  selectedFile.value = file
  uploadError.value = ''
  previewData.value = []
  previewColumns.value = []

  // Validate file type
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    uploadError.value = t('xlsxUpload.invalidFileType')
    return
  }

  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    uploadError.value = t('xlsxUpload.fileTooLarge')
    return
  }

  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    
    if (workbook.SheetNames.length === 0) {
      uploadError.value = t('xlsxUpload.noSheetsFound')
      return
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    if (jsonData.length < 2) {
      uploadError.value = t('xlsxUpload.noDataFound')
      return
    }

    // Extract headers and data
    const headers = jsonData[0] as string[]
    const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''))

    previewColumns.value = headers
    previewData.value = dataRows.map(row => {
      const rowObj: any = {}
      headers.forEach((header, index) => {
        rowObj[header] = row[index] || ''
      })
      return rowObj
    })

  } catch (error) {
    console.error('File processing error:', error)
    uploadError.value = t('xlsxUpload.fileProcessingError')
  }
}

// Process and import data
const processUpload = () => {
  if (!selectedFile.value || previewData.value.length === 0) return

  isProcessing.value = true

  try {
    const columns = getColumnMapping()
    const columnMap = new Map(columns.map(col => [col.label || col.key, col.key]))

    // Transform preview data to match internal structure
    const transformedData: TableRow[] = previewData.value.map((row, index) => {
      const transformedRow: TableRow = {
        id: `upload_${Date.now()}_${index}`,
        isModified: true,
        isNewRow: true,
        reportingPeriod: props.currentPeriod
      }

      // Map each column from preview to internal structure
      Object.entries(row).forEach(([previewKey, value]) => {
        const internalKey = columnMap.get(previewKey) || previewKey
        transformedRow[internalKey] = value
      })

      // Special handling for Administrator users - set ownership structure
      if (userRole.value === 'Administrator') {
        transformedRow.ownershipStructure = 'Direct to PIF'
      }

      return transformedRow
    })

    emit('upload', transformedData)
    closeModal()

  } catch (error) {
    console.error('Data processing error:', error)
    uploadError.value = t('xlsxUpload.dataProcessingError')
  } finally {
    isProcessing.value = false
  }
}

// Modal management
const closeModal = () => {
  selectedFile.value = null
  uploadError.value = ''
  previewData.value = []
  previewColumns.value = []
  isGeneratingTemplate.value = false
  isProcessing.value = false
  
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  
  emit('close')
}

const handleOverlayClick = (event: Event) => {
  if (event.target === event.currentTarget) {
    closeModal()
  }
}
</script>
