<template>
  <div
    class="searchable-dropdown"
    :class="{
      'dark-mode': isDarkMode,
      rtl: isRtl,
      disabled: disabled,
    }"
  >
    <div
      ref="dropdownTrigger"
      class="dropdown-trigger"
      @click="toggleDropdown"
      :class="{
        active: isOpen,
        disabled: disabled,
      }"
    >
      <span v-if="selectedOption" class="value-text">
        {{ selectedOption.label }}
      </span>
      <span v-else class="placeholder-text">
        {{ placeholder || 'Select option...' }}
      </span>
    </div>

    <!-- Dropdown Panel Portal -->
    <Teleport to="body">
      <div v-if="isOpen" class="dropdown-panel-portal" :style="panelStyles">
        <div class="dropdown-panel" ref="panelRef">
          <div v-if="searchPlaceholder" class="search-container">
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              class="search-input"
              :placeholder="searchPlaceholder"
              @keydown.esc="closeDropdown"
              @keydown.enter.prevent="selectFirstOption"
              @keydown.arrow-down.prevent="navigateDown"
              @keydown.arrow-up.prevent="navigateUp"
            />
          </div>

          <div class="options-container">
            <div
              v-for="(option, index) in filteredOptions"
              :key="option.value"
              class="option-item"
              :class="{
                selected: option.value === modelValue,
                highlighted: index === highlightedIndex,
              }"
              @click="selectOption(option)"
              @mouseenter="highlightedIndex = index"
            >
              {{ option.label }}
            </div>

            <div v-if="filteredOptions.length === 0" class="no-results">
              {{ noResultsText || 'No results found' }}
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Backdrop -->
    <div v-if="isOpen" class="dropdown-backdrop" @click="closeDropdown"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

// Utility function for debouncing search
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

interface DropdownOption {
  value: string | number
  label: string
}

interface Props {
  modelValue?: string | number
  options?: DropdownOption[]
  placeholder?: string
  disabled?: boolean
  isDarkMode?: boolean
  isRtl?: boolean
  searchPlaceholder?: string
  noResultsText?: string
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  placeholder: 'Select option...',
  disabled: false,
  isDarkMode: false,
  isRtl: false,
  searchPlaceholder: 'Search...',
  noResultsText: 'No results found',
})

const emit = defineEmits<Emits>()

// Reactive state
const isOpen = ref(false)
const searchQuery = ref('')
const debouncedSearchQuery = ref('')

// Debounced search for better performance
const debouncedSearch = debounce((value: string) => {
  debouncedSearchQuery.value = value
}, 150)
const highlightedIndex = ref(-1)
const searchInput = ref<HTMLInputElement>()
const dropdownTrigger = ref<HTMLElement>()
const panelRef = ref<HTMLElement>()
const panelStyles = ref<Record<string, string>>({})

// Optimized computed properties with better performance  
const selectedOption = computed(() => {
  return props.options.find((option) => option.value === props.modelValue)
})

const filteredOptions = computed(() => {
  if (!debouncedSearchQuery.value) {
    return props.options
  }

  const query = debouncedSearchQuery.value.toLowerCase()
  return props.options.filter(
    (option) =>
      option.label.toLowerCase().includes(query) ||
      option.value.toString().toLowerCase().includes(query)
  )
})

// Methods
const toggleDropdown = () => {
  if (props.disabled) return

  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

const openDropdown = async () => {
  if (props.disabled) return

  isOpen.value = true
  searchQuery.value = ''
  highlightedIndex.value = -1

  await nextTick()

  // Calculate panel position
  calculatePanelPosition()

  // Focus search input if available
  if (searchInput.value) {
    searchInput.value.focus()
  }
}

const closeDropdown = () => {
  isOpen.value = false
  searchQuery.value = ''
  highlightedIndex.value = -1
}

const selectOption = (option: DropdownOption) => {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  closeDropdown()
}

const selectFirstOption = () => {
  if (filteredOptions.value.length > 0) {
    selectOption(filteredOptions.value[0])
  }
}

const navigateDown = () => {
  if (highlightedIndex.value < filteredOptions.value.length - 1) {
    highlightedIndex.value++
  }
}

const navigateUp = () => {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

const calculatePanelPosition = () => {
  if (!dropdownTrigger.value || !panelRef.value) return

  const MARGIN = 8
  const triggerRect = dropdownTrigger.value.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Get the actual dimensions after rendering
  const panelEl = panelRef.value
  // Temporarily remove restrictions to measure real height
  panelEl.style.maxHeight = ''
  const naturalHeight = panelEl.offsetHeight
  // const naturalWidth = Math.max(triggerRect.width, panelEl.offsetWidth)

  const maxHeight = Math.min(naturalHeight, vh - MARGIN * 2)
  const width = Math.min(Math.max(triggerRect.width, 260), vw - MARGIN * 2)

  // Decide: show below or above?
  const spaceBelow = vh - triggerRect.bottom
  const spaceAbove = triggerRect.top
  const placeBelow = spaceBelow >= maxHeight || spaceBelow >= spaceAbove

  let top = placeBelow ? triggerRect.bottom + 4 : triggerRect.top - maxHeight - 4

  // Adjust vertically
  if (top < MARGIN) top = MARGIN
  if (top + maxHeight > vh - MARGIN) top = vh - maxHeight - MARGIN

  // Adjust horizontally (especially near the right edge)
  let left = triggerRect.left
  // In RTL mode, you might prefer aligning from the right
  if (props.isRtl) left = triggerRect.right - width

  if (left + width > vw - MARGIN) left = vw - width - MARGIN
  if (left < MARGIN) left = MARGIN

  panelStyles.value = {
    position: 'fixed',
    left: props.isRtl ? `${left}px` : `${left - 50}px`,
    top: `${top}px`,
    width: `${width}px`,
    maxHeight: `${maxHeight}px`,
    zIndex: '999999',
    overflow: 'hidden',
  }
}

// Handle clicks outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.searchable-dropdown') && !target.closest('.dropdown-panel-portal')) {
    closeDropdown()
  }
}

// Handle scroll to reposition panel
const handleScroll = () => {
  if (isOpen.value) {
    calculatePanelPosition()
  }
}

// Handle resize to reposition panel
const handleResize = () => {
  if (isOpen.value) {
    calculatePanelPosition()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleResize)
})

// Watch for external changes to recalculate position
watch(isOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      calculatePanelPosition()
    })
  }
})

// Watch for search input changes and debounce
watch(searchQuery, (newValue) => {
  debouncedSearch(newValue)
})

// Recalculate position when debounced search results change
watch(debouncedSearchQuery, () => {
  nextTick(() => calculatePanelPosition())
})
</script>

<style scoped>
.searchable-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 38px;
  font-size: 14px;
}

.dropdown-trigger:hover:not(.disabled) {
  border-color: #9ca3af;
}

.dropdown-trigger.active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.dropdown-trigger.disabled {
  background-color: #f9fafb;
  border-color: #e5e7eb;
  cursor: not-allowed;
  opacity: 0.6;
}

.value-text {
  color: #111827;
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.placeholder-text {
  color: #9ca3af;
  flex: 1;
  text-align: left;
}

.dropdown-icon {
  margin-left: 8px;
  color: #6b7280;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.dropdown-panel-portal {
  position: fixed;
  z-index: 999999;
}

.dropdown-panel {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.search-container {
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.search-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: #3b82f6;
}

.options-container {
  max-height: 200px;
  overflow-y: auto;
}

.option-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.option-item:hover,
.option-item.highlighted {
  background-color: #f3f4f6;
}

.option-item.selected {
  background-color: #3b82f6;
  color: white;
}

.option-item.selected:hover {
  background-color: #2563eb;
}

.no-results {
  padding: 12px;
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  font-size: 14px;
}

.dropdown-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999998;
}

/* Dark mode styles */
.searchable-dropdown.dark-mode .dropdown-trigger {
  background-color: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.searchable-dropdown.dark-mode .dropdown-trigger:hover:not(.disabled) {
  border-color: #6b7280;
}

.searchable-dropdown.dark-mode .dropdown-trigger.disabled {
  background-color: #1f2937;
  border-color: #374151;
}

.searchable-dropdown.dark-mode .value-text {
  color: #f9fafb;
}

.searchable-dropdown.dark-mode .placeholder-text {
  color: #9ca3af;
}

.searchable-dropdown.dark-mode .dropdown-icon {
  color: #9ca3af;
}

.searchable-dropdown.dark-mode .dropdown-panel {
  background-color: #374151;
  border-color: #4b5563;
}

.searchable-dropdown.dark-mode .search-container {
  border-color: #4b5563;
}

.searchable-dropdown.dark-mode .search-input {
  background-color: #1f2937;
  border-color: #4b5563;
  color: #f9fafb;
}

.searchable-dropdown.dark-mode .search-input:focus {
  border-color: #3b82f6;
}

.searchable-dropdown.dark-mode .option-item {
  color: #f9fafb;
}

.searchable-dropdown.dark-mode .option-item:hover,
.searchable-dropdown.dark-mode .option-item.highlighted {
  background-color: #4b5563;
}

.searchable-dropdown.dark-mode .option-item.selected {
  background-color: #3b82f6;
  color: white;
}

.searchable-dropdown.dark-mode .no-results {
  color: #9ca3af;
}

/* RTL support */
.searchable-dropdown.rtl .value-text,
.searchable-dropdown.rtl .placeholder-text {
  text-align: right;
}

.searchable-dropdown.rtl .dropdown-icon {
  margin-left: 0;
  margin-right: 8px;
}

.searchable-dropdown.rtl .option-item {
  text-align: right;
}

/* Disabled state */
.searchable-dropdown.disabled .dropdown-trigger {
  background-color: #f9fafb;
  border-color: #e5e7eb;
  cursor: not-allowed;
  opacity: 0.6;
}

.searchable-dropdown.dark-mode.disabled .dropdown-trigger {
  background-color: #1f2937;
  border-color: #374151;
}
</style>
