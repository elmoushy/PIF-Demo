<template>
  <div :class="styles.entitiesPage">
    <Header />
    
    <main :class="styles.mainContent">
      <!-- Header Section -->
      <section :class="styles.headerSection">
        <div :class="styles.headerContent">
          <router-link to="/settings" :class="styles.backButton" :title="t('common.back')">
            ←
          </router-link>
          <div :class="styles.headerText">
            <h1 :class="styles.headerTitle">{{ t('entities.title') }}</h1>
            <p :class="styles.headerSubtitle">{{ t('entities.subtitle') }}</p>
          </div>
        </div>
        
        <div :class="styles.headerActions">
          <div :class="styles.searchContainer">
            <span :class="styles.searchIcon">🔍</span>
            <input
              type="text"
              :class="styles.searchInput"
              :placeholder="t('entities.searchPlaceholder')"
              v-model="searchQuery"
              @input="handleSearch"
            />
          </div>
          <button
            :class="styles.addEntityButton"
            @click="showAddEntityModal = true"
            :title="t('entities.addEntity')"
          >
            <span>🏛️</span>
            {{ t('entities.addEntity') }}
          </button>
        </div>
      </section>

      <!-- Stats Section -->
      <section :class="styles.statsSection">
        <div :class="styles.statsGrid">
          <div :class="styles.statCard">
            <div :class="styles.statHeader">
              <div :class="styles.statIcon">🏛️</div>
              <span :class="styles.statLabel">{{ t('entities.stats.totalEntities') }}</span>
            </div>
            <div :class="styles.statValue">{{ stats.total }}</div>
          </div>

          <div :class="styles.statCard">
            <div :class="styles.statHeader">
              <div :class="styles.statIcon">✅</div>
              <span :class="styles.statLabel">{{ t('entities.stats.activeEntities') }}</span>
            </div>
            <div :class="styles.statValue">{{ stats.active }}</div>
          </div>

          <div :class="styles.statCard">
            <div :class="styles.statHeader">
              <div :class="styles.statIcon">⏸️</div>
              <span :class="styles.statLabel">{{ t('entities.stats.inactiveEntities') }}</span>
            </div>
            <div :class="styles.statValue">{{ stats.inactive }}</div>
          </div>

          <div :class="styles.statCard">
            <div :class="styles.statHeader">
              <div :class="styles.statIcon">🏢</div>
              <span :class="styles.statLabel">{{ t('entities.stats.subsidiaries') }}</span>
            </div>
            <div :class="styles.statValue">{{ stats.subsidiaries }}</div>
          </div>
        </div>
      </section>

      <!-- Entities Table Section -->
      <section :class="styles.dataSection">
        <h2 :class="styles.sectionTitle">{{ t('entities.entitiesList') }}</h2>
        
        <div :class="styles.tableContainer">
          <div :class="styles.tableHeader">
            <h3 :class="styles.tableTitle">
              {{ t('entities.entitiesList') }}
              <span v-if="!loading && entities.length > 0">
                ({{ entities.length }} {{ t('entities.entitiesList').toLowerCase() }})
              </span>
            </h3>
          </div>
          
          <div :class="styles.tableContent">
            <!-- Loading State -->
            <div v-if="loading" :class="styles.loadingState">
              <div :class="styles.loadingIcon">⏳</div>
              <p :class="styles.loadingText">{{ t('common.loading') }}</p>
              <p :class="styles.loadingSubtext">{{ t('entities.fetchError') }}</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" :class="styles.errorState">
              <div :class="styles.errorIcon">⚠️</div>
              <p :class="styles.errorText">{{ t('common.error') }}</p>
              <p :class="styles.errorSubtext">{{ error }}</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="entities.length === 0" :class="styles.emptyState">
              <div :class="styles.emptyIcon">🏛️</div>
              <p :class="styles.emptyText">{{ t('entities.noEntities') }}</p>
              <p :class="styles.emptySubtext">{{ t('entities.noEntitiesMessage') }}</p>
            </div>

            <!-- Data Table -->
            <DataTable
              v-else
              :data="entitiesTableData"
              :columns="tableColumns"
              :loading="loading"
              @edit="handleEditEntity"
              @delete="handleDeleteEntity"
            />
          </div>
        </div>
      </section>
    </main>

    <!-- Add/Edit Entity Modal -->
    <div v-if="showAddEntityModal || showEditEntityModal" :class="styles.modalOverlay" @click="closeModal">
      <div :class="styles.modal" @click.stop>
        <div :class="styles.modalHeader">
          <h3 :class="styles.modalTitle">
            {{ editingEntity ? t('entities.modal.editEntity') : t('entities.modal.addEntity') }}
          </h3>
          <button :class="styles.closeButton" @click="closeModal" :title="t('common.close')">
            ✕
          </button>
        </div>
        
        <div :class="styles.modalBody">
          <form @submit.prevent="saveEntity">
            <div :class="styles.formGroup">
              <label :class="styles.formLabel">{{ t('entities.form.name') }} *</label>
              <input
                type="text"
                :class="styles.formInput"
                :placeholder="t('entities.form.namePlaceholder')"
                v-model="entityForm.name"
                required
                maxlength="100"
              />
            </div>

            <div :class="styles.formGroup">
              <label :class="styles.formLabel">{{ t('entities.form.arabicName') }}</label>
              <input
                type="text"
                :class="styles.formInput"
                :placeholder="t('entities.form.arabicNamePlaceholder')"
                v-model="entityForm.arabic_name"
                maxlength="100"
              />
            </div>

            <div :class="styles.formGroup">
              <label :class="styles.formLabel">{{ t('entities.form.crNumber') }}</label>
              <input
                type="text"
                :class="styles.formInput"
                :placeholder="t('entities.form.crNumberPlaceholder')"
                v-model="entityForm.cr_number"
                maxlength="50"
              />
            </div>

            <div :class="styles.formGroup">
              <label :class="styles.formLabel">{{ t('entities.form.moiNumber') }}</label>
              <input
                type="text"
                :class="styles.formInput"
                :placeholder="t('entities.form.moiNumberPlaceholder')"
                v-model="entityForm.moi_number"
                maxlength="50"
              />
            </div>

            <div :class="styles.formGroup">
              <label :class="styles.formLabel">{{ t('entities.form.country') }}</label>
              <input
                type="text"
                :class="styles.formInput"
                :placeholder="t('entities.form.countryPlaceholder')"
                v-model="entityForm.country_of_incorporation"
                maxlength="100"
              />
            </div>

            <div :class="styles.formGroup">
              <div :class="styles.checkboxGroup">
                <input
                  type="checkbox"
                  id="isActive"
                  :class="styles.checkbox"
                  v-model="entityForm.is_active"
                />
                <label for="isActive" :class="styles.checkboxLabel">
                  {{ t('entities.form.isActive') }}
                </label>
              </div>
            </div>
          </form>
        </div>
        
        <div :class="styles.modalFooter">
          <button 
            :class="styles.cancelButton"
            @click="closeModal"
            type="button"
          >
            {{ t('common.cancel') }}
          </button>
          <button 
            :class="styles.submitButton"
            @click="saveEntity"
            :disabled="saving || !entityForm.name.trim()"
            type="button"
          >
            {{ saving ? t('common.saving') : (editingEntity ? t('common.update') : t('common.create')) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" :class="styles.modalOverlay" @click="closeDeleteModal">
      <div :class="styles.modal" @click.stop>
        <div :class="styles.modalHeader">
          <h3 :class="styles.modalTitle">{{ t('entities.deleteModal.title') }}</h3>
          <button :class="styles.closeButton" @click="closeDeleteModal" :title="t('common.close')">
            ✕
          </button>
        </div>
        
        <div :class="styles.modalBody">
          <p>{{ t('entities.deleteModal.message').replace('{name}', entityToDelete?.name || '') }}</p>
        </div>
        
        <div :class="styles.modalFooter">
          <button 
            :class="styles.cancelButton"
            @click="closeDeleteModal"
            type="button"
          >
            {{ t('entities.deleteModal.cancel') }}
          </button>
          <button 
            :class="styles.submitButton"
            @click="confirmDelete"
            :disabled="deleting"
            type="button"
          >
            {{ deleting ? t('common.deleting') : t('entities.deleteModal.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import Header from '../../components/Header/Header.vue'
import DataTable from '../../components/DataTable/DataTable.vue'
import entitiesService, { type Entity, type CreateEntityRequest } from '../../services/entitiesService'
import notificationService from '../../services/notificationService'
import styles from './EntitiesManagement.module.css'

const { t } = useI18n()

// State management
const entities = ref<Entity[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const searchTimeout = ref<NodeJS.Timeout | null>(null)

// Modal states
const showAddEntityModal = ref(false)
const showEditEntityModal = ref(false)
const showDeleteModal = ref(false)
const saving = ref(false)
const deleting = ref(false)

// Entity form data
const editingEntity = ref<Entity | null>(null)
const entityToDelete = ref<Entity | null>(null)

const entityForm = ref<CreateEntityRequest & { id?: number }>({
  name: '',
  arabic_name: '',
  cr_number: '',
  moi_number: '',
  country_of_incorporation: '',
  is_active: true
})

// Computed properties
const stats = computed(() => {
  const total = entities.value.length
  const active = entities.value.filter(entity => entity.is_active).length
  const inactive = total - active
  
  return {
    total,
    active,
    inactive,
    subsidiaries: total // All entities are subsidiaries
  }
})

const tableColumns = computed(() => [
  {
    key: 'name',
    label: t('entities.table.entity'),
    sortable: true
  },
  {
    key: 'arabic_name',
    label: t('entities.table.arabicName'),
    sortable: true
  },
  {
    key: 'cr_number',
    label: t('entities.table.crNumber'),
    sortable: true
  },
  {
    key: 'moi_number',
    label: t('entities.table.moiNumber'),
    sortable: true
  },
  {
    key: 'country_of_incorporation',
    label: t('entities.table.country'),
    sortable: true
  },
  {
    key: 'is_active',
    label: t('entities.table.status'),
    sortable: true,
    type: 'badge',
    formatter: (value: boolean) => ({
      text: value ? t('entities.status.active') : t('entities.status.inactive'),
      variant: value ? 'success' : 'warning'
    })
  },
  {
    key: 'created_at',
    label: t('entities.table.created'),
    sortable: true,
    type: 'date'
  },
  {
    key: 'actions',
    label: t('entities.table.actions'),
    type: 'actions',
    actions: [
      {
        label: t('entities.actions.edit'),
        icon: '✏️',
        action: 'edit'
      },
      {
        label: t('entities.actions.delete'),
        icon: '🗑️',
        action: 'delete',
        variant: 'danger'
      }
    ]
  }
])

// Convert entities to table data format
const entitiesTableData = computed(() => {
  return entities.value.map(entity => ({
    ...entity,
    id: entity.id.toString() // Convert number id to string for DataTable
  }))
})

// Methods
const fetchEntities = async () => {
  loading.value = true
  error.value = null
  
  try {
    const searchTerm = searchQuery.value.trim()
    entities.value = await entitiesService.getEntities(searchTerm || undefined)
  } catch (err: any) {
    error.value = err.message || t('entities.fetchError')
    console.error('Error fetching entities:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  // Debounce search
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  searchTimeout.value = setTimeout(() => {
    fetchEntities()
  }, 300)
}

const resetForm = () => {
  entityForm.value = {
    name: '',
    arabic_name: '',
    cr_number: '',
    moi_number: '',
    country_of_incorporation: '',
    is_active: true
  }
  editingEntity.value = null
}

const closeModal = () => {
  showAddEntityModal.value = false
  showEditEntityModal.value = false
  resetForm()
}

const handleEditEntity = (entityData: any) => {
  // Find the original entity by ID (convert string back to number)
  const entity = entities.value.find(e => e.id === parseInt(entityData.id))
  if (!entity) return
  
  editingEntity.value = entity
  entityForm.value = {
    id: entity.id,
    name: entity.name,
    arabic_name: entity.arabic_name || '',
    cr_number: entity.cr_number || '',
    moi_number: entity.moi_number || '',
    country_of_incorporation: entity.country_of_incorporation || '',
    is_active: entity.is_active
  }
  showEditEntityModal.value = true
}

const handleDeleteEntity = (entityData: any) => {
  // Find the original entity by ID (convert string back to number)
  const entity = entities.value.find(e => e.id === parseInt(entityData.id))
  if (!entity) return
  
  entityToDelete.value = entity
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  entityToDelete.value = null
}

const saveEntity = async () => {
  if (!entityForm.value.name.trim()) {
    notificationService.error(
      t('common.error'),
      t('entities.validation.required')
    )
    return
  }

  saving.value = true

  try {
    const entityData = {
      ...entityForm.value,
      // Remove empty strings and convert to undefined
      arabic_name: entityForm.value.arabic_name?.trim() || undefined,
      cr_number: entityForm.value.cr_number?.trim() || undefined,
      moi_number: entityForm.value.moi_number?.trim() || undefined,
      country_of_incorporation: entityForm.value.country_of_incorporation?.trim() || undefined
    }

    if (editingEntity.value) {
      // Update existing entity
      if (!entityData.id) {
        throw new Error('Entity ID is required for update')
      }
      await entitiesService.updateEntity(entityData as Required<typeof entityData>)
      notificationService.success(
        t('entities.messages.updated'),
        t('entities.messages.entityUpdatedSuccess')
      )
    } else {
      // Create new entity
      await entitiesService.createEntity(entityData)
      notificationService.success(
        t('entities.messages.created'),
        t('entities.messages.entityCreatedSuccess')
      )
    }

    closeModal()
    await fetchEntities()
  } catch (err: any) {
    console.error('Error saving entity:', err)
    notificationService.error(
      editingEntity.value ? t('entities.messages.updated') : t('entities.messages.created'),
      err.message || t('entities.messages.saveError')
    )
  } finally {
    saving.value = false
  }
}

const confirmDelete = async () => {
  if (!entityToDelete.value) return

  deleting.value = true

  try {
    await entitiesService.deleteEntity(entityToDelete.value.id)
    notificationService.success(
      t('entities.messages.deleted'),
      t('entities.messages.entityDeletedSuccess')
    )
    
    closeDeleteModal()
    await fetchEntities()
  } catch (err: any) {
    console.error('Error deleting entity:', err)
    notificationService.error(
      t('entities.messages.deleted'),
      err.message || t('entities.messages.deleteError')
    )
  } finally {
    deleting.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchEntities()
})
</script>
