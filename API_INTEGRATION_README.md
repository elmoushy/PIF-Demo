# API Integration Update - Business Quarters

## Changes Made

### 1. Created Investment Service (`src/services/investmentService.ts`)
- **Purpose**: Handles API calls to the investment endpoint `/api/investment/period/`
- **Key Features**:
  - Fetches investment data from the API based on year and time period
  - Transforms API response format to internal BusinessQuarterRow format
  - Implements client-side fallback logic (First Half → Previous Year Fourth Quarter, etc.)
  - Handles authentication with JWT tokens
  - Proper error handling for different HTTP status codes (400, 401, 404, 500)

### 2. Enhanced Data Service (`src/services/dataService.ts`)
- **New Methods Added**:
  - `loadApiDataForPeriod()`: Loads data from API for a specific period
  - `loadPeriodDataWithApi()`: Combines API data with local modifications
  - `mergeApiWithLocalData()`: Merges API data with local changes while preserving user edits
- **Integration Strategy**: API-first with localStorage fallback
- **Data Source Tracking**: Added metadata to track data sources (api, local, api-modified)

### 3. Updated Business Quarters Page
- **Modified Functions**:
  - `handlePeriodChange()`: Now async, loads API data first with localStorage fallback
  - `initializeData()`: Now async, loads API data on component mount
  - `onMounted()`: Updated to handle async data loading
- **Enhanced User Feedback**:
  - Loading states while fetching API data
  - Success notifications when API data loads
  - Warning notifications when falling back to localStorage
  - Info notifications when displaying previous quarter data
  - Error notifications when data loading fails

## API Endpoint Integration

### Endpoint: `GET /api/investment/period/`
- **Query Parameters**:
  - `year`: Integer (required) - e.g., 2025
  - `time_period`: String (required) - **EXACT format required**:
    - `"first half"` (lowercase, space)
    - `"third quarter"` (lowercase, space)  
    - `"forth quarter"` (lowercase, space, note: "forth" not "fourth")
- **Authentication**: Bearer token required
- **Response**: Array of investment objects with full details

### ⚠️ Critical API Format Requirements
The API is very strict about the `time_period` parameter format:

**✅ Correct format (what we use):**
- `GET /api/investment/period/?year=2025&time_period=first%20half`
- `GET /api/investment/period/?year=2025&time_period=third%20quarter`
- `GET /api/investment/period/?year=2025&time_period=forth%20quarter`

**❌ Incorrect formats (will cause 400/404 errors):**
- `time_period=First+Half` → 404 Not Found
- `time_period=Quarter+3` → 400 Bad Request  
- `time_period=Quarter+4` → 400 Bad Request

### Data Format Conversion
The service handles conversion between internal UI format and API format:

**Internal Format (UI)** → **API Format**
- "First Half" → "first half"
- "Third Quarter" → "third quarter"
- "Fourth Quarter" → "forth quarter" (note the spelling)

### Data Flow
1. **User selects period** → Component calls `handlePeriodChange()`
2. **API Call** → `investmentService.getInvestmentDataWithFallback()`
3. **Data Transform** → API response converted to internal format
4. **Fallback Logic** → If no data found, tries previous periods
5. **Local Merge** → API data merged with any local modifications
6. **Display** → Data shown in table with appropriate notifications

### Fallback Strategy
- **First Half** → Falls back to previous year's Fourth Quarter (`"forth quarter"`)
- **Third Quarter** → Falls back to same year's First Half (`"first half"`)
- **Fourth Quarter** → Falls back to same year's Third Quarter (`"third quarter"`)
- **Final Fallback** → If API fails completely, uses localStorage data

## User Experience Improvements

### Loading States
- Shows loading spinner while fetching API data
- Prevents user interaction during data loading

### Notifications
- **Success**: "Successfully loaded X investment records from API"
- **Warning**: "API Unavailable - Using local data instead"
- **Info**: "Previous Quarter Data Loaded - Data from Q3 2024 has been loaded"
- **Error**: "Data Loading Failed - Please try again or contact support"

### Data Source Indicators
- API data marked with `dataSource: 'api'`
- Local modifications marked with `dataSource: 'api-modified'`
- Submitted records are read-only
- Previous quarter data clearly indicated

## Error Handling

### API Errors
- **400 Bad Request**: Invalid parameters
- **401 Unauthorized**: Authentication required
- **404 Not Found**: No data available (returns empty array)
- **500 Server Error**: Server issues

### Fallback Mechanisms
1. **API Failure** → LocalStorage data
2. **No Current Data** → Previous period data (with notification)
3. **No Previous Data** → Empty state with option to add data

## Testing

To test the integration:

1. **With API Available**: Data should load from API with success notification
2. **With API Unavailable**: Should fall back to localStorage with warning
3. **No Data for Period**: Should try fallback periods with info notification
4. **Authentication Issues**: Should show appropriate error messages

## Development Notes

- The fake data generation methods in `dataService.ts` are still preserved for backward compatibility
- Local modifications are preserved and merged with API data
- The implementation maintains existing localStorage functionality as a fallback
- All existing features (CRUD operations, filtering, pagination) continue to work with API data
