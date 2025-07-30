<template>
  <div :class="styles.pagination">
    <div :class="styles.pageInfo">
      <span>
        {{ t('businessQuarters.showing') }} 
        {{ startItem }} - {{ endItem }} 
        {{ t('businessQuarters.of') }} 
        {{ totalItems }} 
        {{ t('businessQuarters.items') }}
      </span>
    </div>
    
    <div :class="styles.pageControls">
      <!-- Items per page selector -->
      <!-- <div :class="styles.itemsPerPage">
        <label>{{ t('businessQuarters.itemsPerPage') }}:</label>
        <select 
          v-model="currentItemsPerPage" 
          @change="$emit('updateItemsPerPage', currentItemsPerPage)"
          :class="styles.pageSelect"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
      </div> -->
      
      <!-- Navigation buttons -->
      <div :class="styles.pageButtons">
        <button 
          @click="$emit('changePage', 1)"
          :disabled="currentPage === 1"
          :class="[styles.pageButton, styles.firstButton]"
        >
          <span :class="styles.buttonIcon">⏮️</span>
        </button>
        
        <button 
          @click="$emit('changePage', currentPage - 1)"
          :disabled="currentPage === 1"
          :class="[styles.pageButton, styles.prevButton]"
        >
          <span :class="styles.buttonIcon">◀️</span>
        </button>
        
        <!-- Page numbers -->
        <div :class="styles.pageNumbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="$emit('changePage', page)"
            :class="[
              styles.pageNumber,
              page === currentPage ? styles.active : ''
            ]"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          @click="$emit('changePage', currentPage + 1)"
          :disabled="currentPage === totalPages"
          :class="[styles.pageButton, styles.nextButton]"
        >
          <span :class="styles.buttonIcon">▶️</span>
        </button>
        
        <button 
          @click="$emit('changePage', totalPages)"
          :disabled="currentPage === totalPages"
          :class="[styles.pageButton, styles.lastButton]"
        >
          <span :class="styles.buttonIcon">⏭️</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import styles from './Pagination.module.css'

interface Props {
  currentPage: number
  totalItems: number
  itemsPerPage: number
}

const props = defineProps<Props>()

defineEmits<{
  changePage: [page: number]
  updateItemsPerPage: [itemsPerPage: number]
}>()

const { t } = useI18n()

// const currentItemsPerPage = ref(props.itemsPerPage)

const totalPages = computed(() => Math.ceil(props.totalItems / props.itemsPerPage))

const startItem = computed(() => {
  return (props.currentPage - 1) * props.itemsPerPage + 1
})

const endItem = computed(() => {
  return Math.min(props.currentPage * props.itemsPerPage, props.totalItems)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = props.currentPage
  const pages: number[] = []
  
  if (total <= 7) {
    // Show all pages if total is 7 or less
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)
    
    if (current <= 4) {
      // Show first 5 pages + ellipsis + last page
      for (let i = 2; i <= 5; i++) {
        pages.push(i)
      }
      if (total > 6) pages.push(-1) // ellipsis
      pages.push(total)
    } else if (current >= total - 3) {
      // Show first page + ellipsis + last 5 pages
      if (total > 6) pages.push(-1) // ellipsis
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // Show first page + ellipsis + current-1, current, current+1 + ellipsis + last page
      pages.push(-1) // ellipsis
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push(-1) // ellipsis
      pages.push(total)
    }
  }
  
  return pages
})
</script>
