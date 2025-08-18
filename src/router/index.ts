import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Login from '../pages/Auth/Login.vue'
import Register from '../pages/Auth/Register.vue'
import Welcome from '../pages/Welcome/Welcome.vue'
import Dashboard from '../pages/Dashboard/Dashboard.vue'
import BusinessQuarters from '../pages/BusinessQuarters/BusinessQuarters.vue'
import Settings from '../pages/Settings/Settings.vue'
import Profile from '../pages/Profile/Profile.vue'
import UsersManagement from '../pages/UsersManagement/UsersManagement.vue'
import CompaniesManagement from '../pages/CompaniesManagement/CompaniesManagement.vue'
import EntitiesManagement from '../pages/EntitiesManagement/EntitiesManagement.vue'
import PeriodDeadlines from '../pages/PeriodDeadlines/PeriodDeadlines.vue'
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
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      title: 'Settings - PIF',
      requiresAuth: true
    }
  },
  {
    path: '/users-management',
    name: 'UsersManagement',
    component: UsersManagement,
    meta: {
      title: 'Users Management - PIF',
      requiresAuth: true
    }
  },
  {
    path: '/companies-management',
    name: 'CompaniesManagement',
    component: CompaniesManagement,
    meta: {
      title: 'Companies Management - PIF',
      requiresAuth: true
    }
  },
  {
    path: '/entities-management',
    name: 'EntitiesManagement',
    component: EntitiesManagement,
    meta: {
      title: 'Entities Management - PIF',
      requiresAuth: true
    }
  },
  {
    path: '/period-deadlines',
    name: 'PeriodDeadlines',
    component: PeriodDeadlines,
    meta: {
      title: 'Period Deadlines - PIF',
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: {
      title: 'Profile - PIF',
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
  
  // Debug logging
  console.log('Router guard - to:', to.path)
  console.log('Router guard - isAuthenticated:', isAuthenticated)
  console.log('Router guard - user:', authStore.user)
  console.log('Router guard - requiresAuth:', to.meta?.requiresAuth)
  
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
