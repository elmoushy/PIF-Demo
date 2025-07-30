# Authentication Optimization Changes

## Issues Resolved

### 1. Eliminated Unnecessary Profile Endpoint Calls
**Problem**: The application was calling `/api/v1/auth/profile/` endpoint unnecessarily during:
- App initialization (`initAuth()`)
- Every route change in the router guard
- Automatic token refresh scenarios

**Solution**: 
- Modified `initAuth()` to rely on stored user data instead of fetching profile
- Updated router guard to skip profile verification (token validity is checked automatically on API calls)
- Made `refreshUserData()` only call profile endpoint when explicitly requested (`forceRefresh: true`)

### 2. Avoided Logout Endpoint Calls on Page Refresh
**Problem**: The `/api/v1/auth/logout/` endpoint was being called when:
- Page refresh caused token verification failures
- Automatic token refresh failed
- App initialization failed

**Solution**:
- Added optional `callEndpoint` parameter to `logout()` method (defaults to `true`)
- Modified auth initialization to use `logout(false)` on failures
- Updated token refresh failure handling to clear tokens locally without calling logout endpoint
- Added `clearLocalData()` method for scenarios where only local cleanup is needed

## Changes Made

### `src/stores/useAuthStore.ts`
- **`initAuth()`**: Removed automatic profile fetch, rely on stored user data
- **`logout(callEndpoint)`**: Added optional parameter to control endpoint calls
- **`refreshUserData(forceRefresh)`**: Made profile endpoint call conditional

### `src/services/authService.ts`
- **`logout(callEndpoint)`**: Added optional parameter for conditional endpoint calls
- **`clearLocalData()`**: Added method for local-only cleanup
- **Token refresh interceptor**: Modified to clear tokens locally on refresh failure

### `src/router/index.ts`
- **Route guard**: Removed automatic profile verification on protected routes

## Benefits

1. **Reduced API Calls**: Eliminates unnecessary profile endpoint requests
2. **Better Performance**: Faster app initialization and navigation
3. **Improved UX**: No unnecessary logout endpoint calls on page refresh
4. **Maintained Security**: Token validity is still verified on actual API calls through interceptors
5. **Explicit Control**: Profile data is only fetched when explicitly needed

## Usage Examples

```typescript
// Explicit logout (calls endpoint) - for user-initiated logout
await authStore.logout() // or logout(true)

// Silent logout (no endpoint call) - for token failures, page refresh
await authStore.logout(false)

// Force refresh user profile when needed
await authStore.refreshUserData(true)

// Normal refresh (no API call)
await authStore.refreshUserData() // or refreshUserData(false)
```

## Security Considerations

- Token validity is still enforced through HTTP interceptors
- Profile endpoint is still available for explicit user actions
- All user-initiated logouts still properly invalidate server sessions
- Local token cleanup ensures no sensitive data remains in browser storage
