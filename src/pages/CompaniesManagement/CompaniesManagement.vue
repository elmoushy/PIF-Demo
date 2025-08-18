<template>
  <div :class="$style.companiesPage">
    <Header />
    
    <main :class="$style.mainContent">
      <!-- Hero Section -->
      <section :class="$style.heroSection">
        <div :class="$style.heroContent">
          <div :class="$style.heroText">
            <h1 :class="$style.heroTitle">{{ t('companies.title') }}</h1>
            <p :class="$style.heroSubtitle">{{ t('companies.subtitle') }}</p>
          </div>
          <div :class="$style.heroIcon">
            <span :class="$style.companiesIcon">🏢</span>
          </div>
        </div>
      </section>

      <!-- Companies Management Section -->
      <section :class="$style.companiesSection">
        <!-- Controls Bar -->
        <div :class="$style.controlsBar">
          <div :class="$style.searchSection">
            <div :class="$style.searchContainer">
              <span :class="$style.searchIcon">🔍</span>
              <input
                v-model="searchQuery"
                type="text"
                :class="$style.searchInput"
                :placeholder="t('companies.searchPlaceholder')"
              />
            </div>
          </div>
          
          <div :class="$style.actionsSection">
            <span :class="$style.resultCount">
              {{ filteredCompanies.length }} {{ t('companies.totalCompanies') }}
            </span>
          </div>
        </div>

        <!-- Companies Table -->
        <div :class="$style.tableContainer">
          <div v-if="loading" :class="$style.loadingState">
            <div :class="$style.loadingSpinner"></div>
            <p>{{ t('common.loading') }}</p>
          </div>

          <div v-else-if="error" :class="$style.errorState">
            <div :class="$style.errorIcon">⚠️</div>
            <h3>{{ t('common.error') }}</h3>
            <p>{{ error }}</p>
            <button :class="$style.retryButton" @click="loadCompanies">
              {{ t('common.retry') }}
            </button>
          </div>

          <div v-else-if="filteredCompanies.length === 0" :class="$style.emptyState">
            <div :class="$style.emptyIcon">🏢</div>
            <h3>{{ t('companies.noCompaniesFound') }}</h3>
            <p>{{ searchQuery ? t('companies.noSearchResults') : t('companies.noCompaniesYet') }}</p>
          </div>

          <div v-else :class="$style.tableWrapper">
            <table :class="$style.companiesTable">
              <thead :class="$style.tableHeader">
                <tr>
                  <th :class="$style.headerCell">{{ t('companies.name') }}</th>
                  <th :class="$style.headerCell">{{ t('companies.arabicName') }}</th>
                  <th :class="$style.headerCell">{{ t('companies.crNumber') }}</th>
                  <th :class="$style.headerCell">{{ t('companies.moiNumber') }}</th>
                  <th :class="$style.headerCell">{{ t('companies.country') }}</th>
                  <th :class="$style.headerCell">{{ t('companies.status') }}</th>
                  <th :class="$style.headerCell">{{ t('companies.lastUpdated') }}</th>
                  <th :class="$style.headerCell">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody :class="$style.tableBody">
                <tr 
                  v-for="company in paginatedCompanies" 
                  :key="company.id"
                  :class="$style.tableRow"
                >
                  <td :class="$style.tableCell">
                    <div :class="$style.companyInfo">
                      <div :class="$style.companyName">{{ company.name }}</div>
                      <div v-if="company.parent_company" :class="$style.parentInfo">
                        {{ t('companies.subsidiary') }}
                      </div>
                    </div>
                  </td>
                  <td :class="$style.tableCell">
                    <span :class="$style.arabicText" dir="rtl">
                      {{ company.arabic_name || '-' }}
                    </span>
                  </td>
                  <td :class="$style.tableCell">{{ company.cr_number || '-' }}</td>
                  <td :class="$style.tableCell">{{ company.moi_number || '-' }}</td>
                  <td :class="$style.tableCell">{{ company.country_of_incorporation || '-' }}</td>
                  <td :class="$style.tableCell">
                    <span :class="[
                      $style.statusBadge, 
                      company.is_active ? $style.statusActive : $style.statusInactive
                    ]">
                      {{ company.is_active ? t('companies.active') : t('companies.inactive') }}
                    </span>
                  </td>
                  <td :class="$style.tableCell">
                    <span :class="$style.dateText">
                      {{ formatDate(company.updated_at) }}
                    </span>
                  </td>
                  <td :class="$style.tableCell">
                    <div :class="$style.actionButtons">
                      <button
                        :class="[$style.actionButton, $style.editButton]"
                        @click="editCompany(company)"
                        :title="t('common.edit')"
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" :class="$style.pagination">
          <button
            :class="[$style.paginationButton, { [$style.disabled]: currentPage === 1 }]"
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
          >
            ←
          </button>
          
          <span :class="$style.paginationInfo">
            {{ t('common.page') }} {{ currentPage }} {{ t('common.of') }} {{ totalPages }}
          </span>
          
          <button
            :class="[$style.paginationButton, { [$style.disabled]: currentPage === totalPages }]"
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
          >
            →
          </button>
        </div>
      </section>
    </main>

    <!-- Company Modal -->
    <CompanyModal
      :isVisible="showCompanyModal"
      :company="selectedCompany"
      :loading="modalLoading"
      @close="closeCompanyModal"
      @save="saveCompany"
    />

    <!-- Particle System -->
    <div :class="$style.particleSystem">
      <div v-for="i in 30" :key="i" :class="$style.particle" :style="particleStyle(i)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import Header from '../../components/Header/Header.vue'
import CompanyModal from './components/CompanyModal.vue'
import companiesService, { type Company, type CompanyUpdateData } from '../../services/companiesService'
import notificationService from '../../services/notificationService'

const { t } = useI18n()

// State
const companies = ref<Company[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')

// Modal state
const showCompanyModal = ref(false)
const selectedCompany = ref<Company | null>(null)
const modalLoading = ref(false)

// Pagination
const currentPage = ref(1)
const itemsPerPage = 10

// Computed properties
const filteredCompanies = computed(() => {
  if (!searchQuery.value.trim()) {
    return companies.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return companies.value.filter(company => 
    company.name.toLowerCase().includes(query) ||
    company.arabic_name?.toLowerCase().includes(query) ||
    company.cr_number?.toLowerCase().includes(query) ||
    company.moi_number?.toLowerCase().includes(query) ||
    company.country_of_incorporation?.toLowerCase().includes(query)
  )
})

const totalPages = computed(() => 
  Math.ceil(filteredCompanies.value.length / itemsPerPage)
)

const paginatedCompanies = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredCompanies.value.slice(start, end)
})

// Methods
const loadCompanies = async () => {
  try {
    loading.value = true
    error.value = null
    
    const fetchedCompanies = await companiesService.getCompanies()
    companies.value = fetchedCompanies
    
    notificationService.success(
      t('companies.title'),
      `${fetchedCompanies.length} ${t('companies.loadedSuccessfully')}`
    )
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('companies.loadError')
    notificationService.error(
      t('common.error'),
      error.value
    )
  } finally {
    loading.value = false
  }
}

const editCompany = (company: Company) => {
  selectedCompany.value = company
  showCompanyModal.value = true
}

const closeCompanyModal = () => {
  showCompanyModal.value = false
  selectedCompany.value = null
  modalLoading.value = false
}

const saveCompany = async (companyData: CompanyUpdateData) => {
  try {
    modalLoading.value = true
    
    const updatedCompany = await companiesService.updateCompany(companyData)
    
    // Update the company in the list
    const index = companies.value.findIndex(u => u.id === updatedCompany.id)
    if (index !== -1) {
      companies.value[index] = updatedCompany
    }
    
    notificationService.success(
      t('companies.updateSuccess'),
      t('companies.companyUpdatedSuccessfully')
    )
    
    closeCompanyModal()
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : t('companies.updateError')
    notificationService.error(
      t('companies.updateError'),
      errorMessage
    )
  } finally {
    modalLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return '-'
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

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
    '--particle-color': `hsl(${140 + Math.random() * 60}, 70%, 60%)`
  }
}

// Watch search query to reset pagination
watch(() => searchQuery.value, () => {
  currentPage.value = 1
})

// Lifecycle
onMounted(() => {
  loadCompanies()
})
</script>

<style module>
.companiesPage {
  min-height: 100vh;
  background: linear-gradient(135deg, #0B0F10 0%, #1A1D23 50%, #0B0F10 100%);
  position: relative;
  overflow-x: hidden;
}

[data-theme="light"] .companiesPage {
  background: linear-gradient(135deg, #FDFEFE 0%, #F8FAFC 50%, #FDFEFE 100%);
}

/* Enhanced animated background */
.companiesPage::before {
  content: '';
  position: fixed;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: 
    radial-gradient(circle at 15% 25%, rgba(34, 197, 94, 0.15) 0%, transparent 35%),
    radial-gradient(circle at 85% 15%, rgba(168, 85, 247, 0.12) 0%, transparent 40%),
    radial-gradient(circle at 35% 85%, rgba(0, 255, 194, 0.08) 0%, transparent 45%),
    radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.06) 0%, transparent 35%);
  animation: floatComplex 25s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}

[data-theme="light"] .companiesPage::before {
  background: 
    radial-gradient(circle at 15% 25%, rgba(34, 197, 94, 0.08) 0%, transparent 35%),
    radial-gradient(circle at 85% 15%, rgba(168, 85, 247, 0.06) 0%, transparent 40%),
    radial-gradient(circle at 35% 85%, rgba(0, 99, 75, 0.04) 0%, transparent 45%),
    radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.03) 0%, transparent 35%);
}

@keyframes floatComplex {
  0%, 100% { 
    transform: translate(0, 0) rotate(0deg) scale(1); 
    filter: hue-rotate(0deg);
  }
  25% { 
    transform: translate(-15px, -20px) rotate(90deg) scale(1.1); 
    filter: hue-rotate(90deg);
  }
  50% { 
    transform: translate(20px, -15px) rotate(180deg) scale(0.9); 
    filter: hue-rotate(180deg);
  }
  75% { 
    transform: translate(-10px, 25px) rotate(270deg) scale(1.05); 
    filter: hue-rotate(270deg);
  }
}

/* Main Content */
.mainContent {
  position: relative;
  z-index: 2;
  padding: 2rem;
  max-width: auto;
  margin: 0 auto;
}

/* Hero Section */
.heroSection {
  margin-bottom: 3rem;
  padding: 2rem 0;
}

.heroContent {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.heroText {
  flex: 1;
}

.heroTitle {
  font-size: 3.5rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, #E8EDF2 0%, #22C55E 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

[data-theme="light"] .heroTitle {
  background: linear-gradient(135deg, #112821 0%, #16A34A 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.heroSubtitle {
  font-size: 1.2rem;
  color: #8C949E;
  margin: 0;
  font-weight: 400;
  line-height: 1.5;
}

[data-theme="light"] .heroSubtitle {
  color: #48635A;
}

.heroIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 50%;
  border: 2px solid rgba(34, 197, 94, 0.2);
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
}

[data-theme="light"] .heroIcon {
  background: rgba(34, 197, 94, 0.08);
  border-color: rgba(34, 197, 94, 0.15);
}

.heroIcon::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%);
  animation: pulse 2s ease-in-out infinite;
}

.companiesIcon {
  font-size: 3rem;
  z-index: 1;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* Companies Section */
.companiesSection {
  margin: 2rem 0;
}

.controlsBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(20px);
}

[data-theme="light"] .controlsBar {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(34, 197, 94, 0.1);
}

.searchSection {
  flex: 1;
  max-width: 400px;
}

.searchContainer {
  position: relative;
  display: flex;
  align-items: center;
}

.searchIcon {
  position: absolute;
  left: 1rem;
  font-size: 1.1rem;
  color: #8C949E;
  z-index: 1;
}

[data-theme="light"] .searchIcon {
  color: #48635A;
}

.searchInput {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #E8EDF2;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

[data-theme="light"] .searchInput {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(34, 197, 94, 0.2);
  color: #112821;
}

.searchInput:focus {
  outline: none;
  border-color: rgba(34, 197, 94, 0.5);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.searchInput::placeholder {
  color: #8C949E;
}

[data-theme="light"] .searchInput::placeholder {
  color: #48635A;
}

.actionsSection {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.resultCount {
  font-size: 0.9rem;
  color: #8C949E;
  font-weight: 500;
}

[data-theme="light"] .resultCount {
  color: #48635A;
}

/* Table Styles */
.tableContainer {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  overflow: hidden;
  margin-bottom: 2rem;
}

[data-theme="light"] .tableContainer {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(34, 197, 94, 0.1);
}

.tableWrapper {
  overflow-x: auto;
}

.companiesTable {
  width: 100%;
  border-collapse: collapse;
}

.tableHeader {
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

[data-theme="light"] .tableHeader {
  background: rgba(34, 197, 94, 0.02);
  border-bottom-color: rgba(34, 197, 94, 0.1);
}

.headerCell {
  padding: 1.25rem 1.5rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #E8EDF2;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

[data-theme="light"] .headerCell {
  color: #112821;
}

.tableBody {
  background: transparent;
}

.tableRow {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

[data-theme="light"] .tableRow {
  border-bottom-color: rgba(34, 197, 94, 0.05);
}

.tableRow:hover {
  background: rgba(255, 255, 255, 0.02);
}

[data-theme="light"] .tableRow:hover {
  background: rgba(34, 197, 94, 0.02);
}

.tableCell {
  padding: 1.25rem 1.5rem;
  font-size: 0.9rem;
  color: #E8EDF2;
  vertical-align: top;
}

[data-theme="light"] .tableCell {
  color: #112821;
}

.companyInfo {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.companyName {
  font-weight: 600;
  color: #E8EDF2;
}

[data-theme="light"] .companyName {
  color: #112821;
}

.parentInfo {
  font-size: 0.8rem;
  color: #8C949E;
  font-style: italic;
}

[data-theme="light"] .parentInfo {
  color: #48635A;
}

.arabicText {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 0.9rem;
}

.statusBadge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.statusActive {
  background: rgba(34, 197, 94, 0.2);
  color: #22C55E;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

[data-theme="light"] .statusActive {
  background: rgba(34, 197, 94, 0.1);
  color: #16A34A;
}

.statusInactive {
  background: rgba(239, 68, 68, 0.2);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.dateText {
  color: #8C949E;
  font-size: 0.85rem;
}

[data-theme="light"] .dateText {
  color: #48635A;
}

.actionButtons {
  display: flex;
  gap: 0.5rem;
}

.actionButton {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

[data-theme="light"] .actionButton {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(34, 197, 94, 0.2);
}

.editButton:hover {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
  transform: translateY(-2px);
}

/* States */
.loadingState,
.errorState,
.emptyState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loadingSpinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid #22C55E;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

[data-theme="light"] .loadingSpinner {
  border-color: rgba(34, 197, 94, 0.1);
  border-top-color: #16A34A;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.errorIcon,
.emptyIcon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.errorState h3,
.emptyState h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #E8EDF2;
  margin: 0 0 0.5rem 0;
}

[data-theme="light"] .errorState h3,
[data-theme="light"] .emptyState h3 {
  color: #112821;
}

.errorState p,
.emptyState p {
  color: #8C949E;
  margin: 0 0 1.5rem 0;
}

[data-theme="light"] .errorState p,
[data-theme="light"] .emptyState p {
  color: #48635A;
}

.retryButton {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retryButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem 0;
}

.paginationButton {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #E8EDF2;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

[data-theme="light"] .paginationButton {
  border-color: rgba(34, 197, 94, 0.2);
  background: rgba(0, 0, 0, 0.02);
  color: #112821;
}

.paginationButton:hover:not(.disabled) {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
}

.paginationButton.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.paginationInfo {
  font-size: 0.9rem;
  color: #8C949E;
  font-weight: 500;
}

[data-theme="light"] .paginationInfo {
  color: #48635A;
}

/* Particle System */
.particleSystem {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.particle {
  position: absolute;
  width: 3px;
  height: 3px;
  background: var(--particle-color);
  border-radius: 50%;
  opacity: 0.6;
  animation: float infinite linear;
  box-shadow: 0 0 6px var(--particle-color);
}

@keyframes floatParticle {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-10vh) rotate(360deg);
    opacity: 0;
  }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .heroContent {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }
  
  .heroTitle {
    font-size: 3rem;
  }
  
  .controlsBar {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .searchSection {
    max-width: none;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .mainContent {
    padding: 1rem;
  }
  
  .heroTitle {
    font-size: 2.5rem;
  }
  
  .heroIcon {
    width: 80px;
    height: 80px;
  }
  
  .companiesIcon {
    font-size: 2rem;
  }
  
  .controlsBar {
    padding: 1rem;
  }
  
  .tableContainer {
    border-radius: 12px;
  }
  
  .headerCell,
  .tableCell {
    padding: 0.875rem 1rem;
    font-size: 0.8rem;
  }
  
  .companiesTable {
    min-width: 800px;
  }
}

@media (max-width: 480px) {
  .heroTitle {
    font-size: 2rem;
  }
  
  .controlsBar {
    padding: 0.75rem;
  }
  
  .searchInput {
    padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  }
}

/* RTL Support */
[dir="rtl"] .searchIcon {
  left: auto;
  right: 1rem;
}

[dir="rtl"] .searchInput {
  padding: 0.875rem 2.75rem 0.875rem 1rem;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.companiesTable:focus-visible {
  outline: 2px solid #22C55E;
  outline-offset: 2px;
}

[data-theme="light"] .companiesTable:focus-visible {
  outline-color: #16A34A;
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
