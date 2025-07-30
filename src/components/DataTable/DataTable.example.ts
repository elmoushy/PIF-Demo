// Example usage of DataTable with SearchableDropdown columns

// When defining your columns, make sure to use the correct column keys:
const columns = [
  {
    key: 'reportingPeriod',
    editable: false
  },
  {
    key: 'countryOfIncorporation', // This will render as SearchableDropdown
    editable: true
  },
  {
    key: 'currency', // This will render as SearchableDropdown
    editable: true
  },
  {
    key: 'entityName',
    editable: true,
    type: 'text'
  },
  {
    key: 'revenue',
    editable: true,
    type: 'number'
  }
  // ... other columns
]

// Sample data structure:
const sampleData = [
  {
    id: '1',
    reportingPeriod: 'Q1 2025',
    countryOfIncorporation: 'SAU', // Should match values from countries.json
    currency: 'SAR', // Should match values from currencies.json
    entityName: 'Example Company',
    revenue: 1000000,
    isModified: false,
    isNewRow: false
  }
  // ... more rows
]

// Usage in template:
/*
<DataTable
  :data="sampleData"
  :columns="columns"
  :loading="false"
  table-id="business-quarters-table"
  current-period="Q1 2025"
  @add-row="handleAddRow"
  @save-changes="handleSaveChanges"
  @generate-report="handleGenerateReport"
  @create-in-form="handleCreateInForm"
  @view-row="handleViewRow"
  @edit-row="handleEditRow"
  @duplicate-row="handleDuplicateRow"
  @row-modified="handleRowModified"
  @delete-unsaved-row="handleDeleteUnsavedRow"
  @bulk-delete="handleBulkDelete"
  @bulk-duplicate="handleBulkDuplicate"
/>
*/
