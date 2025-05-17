import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '../components/LoginPage.vue'
import Register from '../components/RegisterPage.vue'
import UserPage from '../components/UserPage.vue'
import TaskPage from '../components/TaskPage.vue'
import UserSettingsPage from '../views/UserSettingsPage.vue'
import PublicNoteView from '../views/PublicNoteView.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: Login
  },
  {
    path: '/register',
    name: 'register',
    component: Register
  },
  {
    path: '/user',
    name: 'user',
    component: UserPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/editor',
    name: 'editor',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/task',
    name: 'task',
    component: TaskPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: UserSettingsPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/view/note/:publicShareId',
    name: 'publicNoteView',
    component: PublicNoteView,
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 添加路由守衛
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('userId')
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
