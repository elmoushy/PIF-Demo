// HTTP utilities with authentication support
export const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8000'

// Global flag to prevent infinite refresh loops
let isRefreshing = false
let failedQueue: Array<{ resolve: Function; reject: Function }> = []

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

export async function makeHttpRequest<T>(
  url: string, 
  options: RequestInit = {},
  includeAuth: boolean = true
): Promise<T> {
  const fullUrl = `${BASE_URL}${url}`
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  // Add authorization header if token exists and includeAuth is true
  const accessToken = sessionStorage.getItem('access_token')
  if (includeAuth && accessToken) {
    defaultHeaders['Authorization'] = `Bearer ${accessToken}`
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(fullUrl, config)
    
    let data: any
    try {
      data = await response.json()
    } catch {
      data = {}
    }

    if (!response.ok) {
      // Handle 401 Unauthorized errors with token refresh
      if (response.status === 401 && includeAuth && !url.includes('/auth/token/refresh/')) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then(() => {
            // Retry original request with new token
            return makeHttpRequest<T>(url, options, includeAuth)
          })
        }

        isRefreshing = true

        try {
          const refreshToken = sessionStorage.getItem('refresh_token')
          if (!refreshToken) {
            throw new Error('No refresh token available')
          }

          // Attempt to refresh token
          const refreshResponse = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
          })

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            
            // Update stored tokens
            sessionStorage.setItem('access_token', refreshData.access)
            if (refreshData.refresh) {
              sessionStorage.setItem('refresh_token', refreshData.refresh)
            }

            // Process queued requests
            processQueue(null, refreshData.access)
            
            // Retry original request with new token
            return makeHttpRequest<T>(url, options, includeAuth)
          } else {
            throw new Error('Token refresh failed')
          }
        } catch (refreshError) {
          // Token refresh failed, clear session and redirect to login
          sessionStorage.removeItem('access_token')
          sessionStorage.removeItem('refresh_token')
          sessionStorage.removeItem('user_data')
          
          processQueue(refreshError, null)
          
          // Dispatch session ended event
          window.dispatchEvent(new CustomEvent('session-ended'))
          
          throw new Error('Session ended')
        } finally {
          isRefreshing = false
        }
      }

      // Handle other API errors
      const error = new Error(data.detail || `HTTP ${response.status}`) as Error & { response?: any; status?: number }
      error.response = data
      error.status = response.status
      throw error
    }

    return data
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.')
    }
    throw error
  }
}

export async function httpPost<T>(url: string, data?: any, headers?: Record<string, string>, includeAuth: boolean = true): Promise<T> {
  return makeHttpRequest<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    headers,
  }, includeAuth)
}

export async function httpGet<T>(url: string, headers?: Record<string, string>, includeAuth: boolean = true): Promise<T> {
  return makeHttpRequest<T>(url, {
    method: 'GET',
    headers,
  }, includeAuth)
}

export async function httpPut<T>(url: string, data?: any, headers?: Record<string, string>, includeAuth: boolean = true): Promise<T> {
  return makeHttpRequest<T>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    headers,
  }, includeAuth)
}

export async function httpDelete<T>(url: string, headers?: Record<string, string>, includeAuth: boolean = true): Promise<T> {
  return makeHttpRequest<T>(url, {
    method: 'DELETE',
    headers,
  }, includeAuth)
}
