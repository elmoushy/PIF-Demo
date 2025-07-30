import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Login from '../pages/Auth/Login.vue'
import Register from '../pages/Auth/Register.vue'
import Welcome from '../pages/Welcome/Welcome.vue'
import Dashboard from '../pages/Dashboard/Dashboard.vue'
import BusinessQuarters from '../pages/BusinessQuarters/BusinessQuarters.vue'
import { useAuthStore } from '../stores/useAuthStore'
import notificationService from '../services/notificationService'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: 'Login - PIF'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      title: 'Register - PIF'
    }
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: Welcome,
    meta: {
      title: 'Welcome - PIF',
      requiresAuth: true
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: 'Dashboard - PIF',
      requiresAuth: true
    }
  },
  {
    path: '/business-quarters',
    name: 'BusinessQuarters',
    component: BusinessQuarters,
    meta: {
      title: 'Business Quarters - PIF',
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Authentication guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Initialize auth store if not already done
  if (!authStore.isInitialized) {
    await authStore.initAuth()
  }
  
  // Check if user is authenticated
  const isAuthenticated = authStore.isAuthenticated
  
  if (to.meta?.requiresAuth && !isAuthenticated) {
    // Protected route but user not authenticated
    notificationService.info(
      'Authentication Required',
      'Please login to access this page.'
    )
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    // User already authenticated, redirect to dashboard
    next('/dashboard')
  } else if (isAuthenticated && to.meta?.requiresAuth) {
    // User authenticated and accessing protected route - just proceed
    next()
  } else {
    next()
  }
})

// Update page title on route change
router.beforeEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }
})

export default router
