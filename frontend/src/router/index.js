import { createRouter, createWebHistory } from 'vue-router'
import ArticleList from '../views/ArticleList.vue'

const routes = [
  {
    path: '/',
    name: 'ArticleList',
    component: ArticleList
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router