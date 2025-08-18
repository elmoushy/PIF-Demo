<template>
  <div :class="styles.usersPage">
    <Header />
    
    <main :class="styles.mainContent">
      <!-- Header Section -->
      <section :class="styles.headerSection">
        <div :class="styles.headerContent">
          <router-link to="/settings" :class="styles.backButton" :title="t('common.back')">
            ←
          </router-link>
          <div :class="styles.headerText">
            <h1 :class="styles.headerTitle">{{ t('users.title') }}</h1>
            <p :class="styles.headerSubtitle">{{ t('users.subtitle') }}</p>
          </div>
        </div>
        
        <div :class="styles.headerActions">
          <div :class="styles.searchContainer">
            <span :class="styles.searchIcon">🔍</span>
            <input
              type="text"
              :class="styles.searchInput"
              :placeholder="t('users.searchPlaceholder')"
              v-model="searchQuery"
              @input="handleSearch"
            />
          </div>
          <button
            :class="styles.addUserButton"
            @click="showAddUserModal = true"
            :title="t('users.addUser')"
          >
            <span>➕</span>
            {{ t('users.addUser') }}
          </button>
        </div>
      </section>

      <!-- Stats Section -->
      <section :class="styles.statsSection">
        <div :class="styles.statsGrid">
          <div :class="styles.statCard">
            <div :class="styles.statHeader">
              <div :class="styles.statIcon">👥</div>
              <span :class="styles.statLabel">{{ t('users.stats.totalUsers') }}</span>
            </div>
            <div :class="styles.statValue">{{ stats.total }}</div>
          </div>

          <div :class="styles.statCard">
            <div :class="styles.statHeader">
              <div :class="styles.statIcon">✅</div>
              <span :class="styles.statLabel">{{ t('users.stats.activeUsers') }}</span>
            </div>
            <div :class="styles.statValue">{{ stats.active }}</div>
          </div>

          <div :class="styles.statCard">
            <div :class="styles.statHeader">
              <div :class="styles.statIcon">❌</div>
              <span :class="styles.statLabel">{{ t('users.stats.inactiveUsers') }}</span>
            </div>
            <div :class="styles.statValue">{{ stats.inactive }}</div>
          </div>

          <div :class="styles.statCard">
            <div :class="styles.statHeader">
              <div :class="styles.statIcon">🛡️</div>
              <span :class="styles.statLabel">{{ t('users.stats.adminUsers') }}</span>
            </div>
            <div :class="styles.statValue">{{ stats.admins }}</div>
          </div>
        </div>
      </section>

      <!-- Users Table Section -->
      <section :class="styles.tableSection">
        <div :class="styles.tableContainer">
          <div :class="styles.tableHeader">
            <h2 :class="styles.tableTitle">{{ t('users.usersList') }}</h2>
          </div>

          <!-- Loading State -->
          <div v-if="loading" :class="styles.loadingSpinner">
            <div :class="styles.spinner"></div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" :class="styles.errorState">
            <div :class="styles.errorIcon">⚠️</div>
            <h3 :class="styles.errorTitle">{{ t('common.error') }}</h3>
            <p :class="styles.errorMessage">{{ error }}</p>
            <button :class="styles.retryButton" @click="fetchUsers">
              {{ t('common.retry') }}
            </button>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredUsers.length === 0 && !loading" :class="styles.emptyState">
            <div :class="styles.emptyIcon">👤</div>
            <h3 :class="styles.emptyTitle">{{ t('users.noUsers') }}</h3>
            <p :class="styles.emptyMessage">{{ t('users.noUsersMessage') }}</p>
          </div>

          <!-- Users Table -->
          <table v-else :class="styles.userTable">
            <thead>
              <tr>
                <th>{{ t('users.table.user') }}</th>
                <th>{{ t('users.table.role') }}</th>
                <th>{{ t('users.table.status') }}</th>
                <th>{{ t('users.table.joinDate') }}</th>
                <th>{{ t('users.table.lastLogin') }}</th>
                <th>{{ t('users.table.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in paginatedUsers" :key="user.id">
                <td>
                  <div :class="styles.userInfo">
                    <div :class="styles.userAvatar">
                      {{ getUserInitial(user) }}
                    </div>
                    <div :class="styles.userDetails">
                      <h4>{{ getUserFullName(user) }}</h4>
                      <p>{{ user.email }}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span :class="[styles.roleBadge, getRoleClass(user.type)]">
                    {{ user.type }}
                  </span>
                </td>
                <td>
                  <span :class="[styles.statusBadge, user.is_active ? 'active' : 'inactive']">
                    {{ user.is_active ? t('users.status.active') : t('users.status.inactive') }}
                  </span>
                </td>
                <td>{{ formatDate(user.date_joined) }}</td>
                <td>{{ user.last_login ? formatDate(user.last_login) : t('users.neverLoggedIn') }}</td>
                <td>
                  <div :class="styles.actionButtons">
                    <button
                      :class="[styles.actionButton, styles.editButton]"
                      @click="editUser(user)"
                      :title="t('users.actions.edit')"
                    >
                      ✏️
                    </button>
                    <button
                      :class="[styles.actionButton, styles.deleteButton]"
                      @click="confirmDeleteUser(user)"
                      :title="t('users.actions.delete')"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Pagination -->
      <Pagination
        v-if="filteredUsers.length > pageSize"
        :currentPage="currentPage"
        :totalItems="filteredUsers.length"
        :itemsPerPage="pageSize"
        @changePage="handlePageChange"
      />
    </main>

    <!-- Add/Edit User Modal -->
    <UserModal
      v-if="showAddUserModal || showEditUserModal"
      :isVisible="showAddUserModal || showEditUserModal"
      :user="editingUser"
      :isEditing="showEditUserModal"
      @close="closeUserModal"
      @save="handleUserSave"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      v-if="showDeleteModal"
      :isVisible="showDeleteModal"
      :title="t('users.deleteModal.title')"
      :message="`Are you sure you want to delete ${deletingUser?.first_name} ${deletingUser?.last_name}? This action cannot be undone.`"
      :confirmText="t('users.deleteModal.confirm')"
      :cancelText="t('users.deleteModal.cancel')"
      @confirm="handleDeleteUser"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import Header from '../../components/Header/Header.vue'
import Pagination from '../../components/Pagination/Pagination.vue'
import UserModal from './components/UserModal.vue'
import ConfirmationModal from './components/ConfirmationModal.vue'
import usersService, { type User, type CreateUserRequest, type UpdateUserRequest } from '../../services/usersService'
import notificationService from '../../services/notificationService'
import styles from './UsersManagement.module.css'

const { t } = useI18n()

// State management
const users = ref<User[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// Modal states
const showAddUserModal = ref(false)
const showEditUserModal = ref(false)
const showDeleteModal = ref(false)
const editingUser = ref<User | null>(null)
const deletingUser = ref<User | null>(null)

// Stats
const stats = ref({
  total: 0,
  active: 0,
  inactive: 0,
  admins: 0,
  users: 0
})

// Computed properties
const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return users.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return users.value.filter(user => 
    user.username.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query) ||
    user.first_name.toLowerCase().includes(query) ||
    user.last_name.toLowerCase().includes(query) ||
    user.type.toLowerCase().includes(query)
  )
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredUsers.value.slice(start, end)
})

// Utility functions
const getUserInitial = (user: User): string => {
  return user.first_name.charAt(0).toUpperCase()
}

const getUserFullName = (user: User): string => {
  return `${user.first_name} ${user.last_name}`
}

const getRoleClass = (role: string): string => {
  switch (role.toLowerCase()) {
    case 'superadmin':
      return 'superAdmin'
    case 'admin':
      return 'admin'
    case 'user':
      return 'user'
    default:
      return 'user'
  }
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

// Search functionality
const handleSearch = () => {
  currentPage.value = 1 // Reset to first page when searching
}

// Pagination
const handlePageChange = (page: number) => {
  currentPage.value = page
}

// Data fetching
const fetchUsers = async () => {
  try {
    loading.value = true
    error.value = null
    
    const [usersData, userStats] = await Promise.all([
      usersService.getUsers(searchQuery.value),
      usersService.getUserStats()
    ])
    
    users.value = usersData
    stats.value = userStats
  } catch (err: any) {
    error.value = err.message || t('users.fetchError')
    notificationService.error(t('common.error'), error.value || 'Unknown error')
  } finally {
    loading.value = false
  }
}

// User management
const editUser = (user: User) => {
  editingUser.value = user
  showEditUserModal.value = true
}

const confirmDeleteUser = (user: User) => {
  deletingUser.value = user
  showDeleteModal.value = true
}

const handleUserSave = async (userData: CreateUserRequest | UpdateUserRequest) => {
  try {
    if (showEditUserModal.value && editingUser.value) {
      // Update existing user
      const updateData = userData as UpdateUserRequest
      updateData.id = editingUser.value.id
      await usersService.updateUser(updateData)
      notificationService.success(
        t('users.messages.updated'),
        t('users.messages.userUpdatedSuccess')
      )
    } else {
      // Create new user
      await usersService.createUser(userData as CreateUserRequest)
      notificationService.success(
        t('users.messages.created'),
        t('users.messages.userCreatedSuccess')
      )
    }
    
    closeUserModal()
    await fetchUsers() // Refresh the list
  } catch (err: any) {
    const errorMessage = err.message || t('users.messages.saveError')
    notificationService.error(t('common.error'), errorMessage)
  }
}

const handleDeleteUser = async () => {
  if (!deletingUser.value) return

  try {
    await usersService.deleteUser(deletingUser.value.id)
    notificationService.success(
      t('users.messages.deleted'),
      t('users.messages.userDeletedSuccess')
    )
    
    closeDeleteModal()
    await fetchUsers() // Refresh the list
  } catch (err: any) {
    const errorMessage = err.message || t('users.messages.deleteError')
    notificationService.error(t('common.error'), errorMessage)
  }
}

// Modal management
const closeUserModal = () => {
  showAddUserModal.value = false
  showEditUserModal.value = false
  editingUser.value = null
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deletingUser.value = null
}

// Watchers
watch(searchQuery, () => {
  currentPage.value = 1 // Reset pagination when search changes
})

// Lifecycle
onMounted(() => {
  fetchUsers()
})
</script>
