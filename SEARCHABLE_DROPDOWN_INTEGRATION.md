# SearchableDropdown Integration in DataTable

## Overview
The DataTable component has been enhanced to support SearchableDropdown components for specific columns. Currently, two columns are configured to use SearchableDropdowns:

1. **Country of Incorporation** - Uses `countries.json` data
2. **Currency** - Uses `currencies.json` data

## Implementation Details

### Files Created/Modified

#### 1. Data Files
- **`src/data/countries.json`** - Contains Arab countries, European countries, and USA with ISO country codes
- **`src/data/currencies.json`** - Contains corresponding currencies with country names

#### 2. Component Files
- **`src/components/SearchableDropdown/SearchableDropdown.vue`** - Reusable searchable dropdown component
- **`src/components/SearchableDropdown/index.ts`** - Export file for the component
- **`src/components/DataTable/DataTable.vue`** - Updated to support SearchableDropdown for specific columns
- **`src/components/DataTable/DataTable.example.ts`** - Usage examples

### Column Configuration

To use SearchableDropdown for a column, set the column key to one of these values:
- `countryOfIncorporation` - Will render as country dropdown
- `currency` - Will render as currency dropdown

Example column configuration:
```typescript
const columns = [
  {
    key: 'countryOfIncorporation',
    editable: true
  },
  {
    key: 'currency', 
    editable: true
  }
]
```

### Data Structure

#### Countries Data
Each country object has:
```json
{
  "value": "SAU",
  "label": "Saudi Arabia"
}
```

#### Currencies Data
Each currency object has:
```json
{
  "value": "SAR",
  "label": "SAR - Saudi Riyal"
}
```

### Features

#### SearchableDropdown Features:
- **Search functionality** - Type to filter options
- **Keyboard navigation** - Arrow keys, Enter, Escape
- **Portal positioning** - Dropdown appears above/below based on available space
- **RTL support** - Works with right-to-left layouts
- **Dark mode support** - Adapts to dark themes
- **Mobile responsive** - Works on touch devices

#### DataTable Integration:
- **Automatic change tracking** - Modified rows are marked when dropdown values change
- **Consistent styling** - Dropdown matches table cell styling
- **Multi-select compatibility** - Works with bulk operations
- **Column resizing** - Dropdown cells support column resizing

### Usage Example

```vue
<template>
  <DataTable
    :data="tableData"
    :columns="tableColumns"
    @row-modified="handleRowModification"
  />
</template>

<script setup>
const tableColumns = [
  { key: 'reportingPeriod', editable: false },
  { key: 'countryOfIncorporation', editable: true },
  { key: 'currency', editable: true },
  { key: 'entityName', editable: true, type: 'text' }
]

const tableData = [
  {
    id: '1',
    reportingPeriod: 'Q1 2025',
    countryOfIncorporation: 'SAU',
    currency: 'SAR',
    entityName: 'Example Corp'
  }
]
</script>
```

### Adding New Dropdown Columns

To add a new dropdown column:

1. **Add data file** in `src/data/` with the options
2. **Import data** in DataTable.vue
3. **Add column constant** to `DROPDOWN_COLUMNS`
4. **Add conditional rendering** in the template
5. **Create computed property** for the options

Example for adding a "department" dropdown:

```typescript
// 1. Create src/data/departments.json
// 2. Import in DataTable.vue
import departmentsData from '../../data/departments.json'

// 3. Add to DROPDOWN_COLUMNS
const DROPDOWN_COLUMNS = {
  COUNTRY_OF_INCORPORATION: 'countryOfIncorporation',
  CURRENCY: 'currency',
  DEPARTMENT: 'department'
} as const

// 4. Add computed property
const departments = computed(() => departmentsData)

// 5. Add to template
<SearchableDropdown
  v-else-if="column.editable && column.key === DROPDOWN_COLUMNS.DEPARTMENT"
  :model-value="row[column.key]"
  @update:model-value="handleDropdownChange(row, column.key, $event)"
  :options="departments"
  placeholder="Select department..."
  search-placeholder="Search departments..."
  no-results-text="No departments found"
/>
```

### Styling

The SearchableDropdown uses CSS modules and supports:
- Light/dark themes
- RTL layouts
- Hover states
- Focus states
- Disabled states
- Loading states

Custom styling can be applied by modifying the component's scoped styles or by passing CSS classes through props.
