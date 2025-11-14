import axios from 'axios'

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api/rss',
  timeout: 30000, // 增加到30秒
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API请求错误:', error)
    return Promise.reject(error)
  }
)

// API方法
export const api = {
  // 获取所有文章
  async getArticles() {
    return await apiClient.get('/articles')
  },

  // 从Supabase获取文章
  async getArticlesFromSupabase(params = {}) {
    return await apiClient.get('/articles/supabase', { params })
  },

  // 推送文章到企业微信
  async pushArticles() {
    return await apiClient.post('/push')
  },

  // 获取健康状态
  async getHealth() {
    return await apiClient.get('/health')
  },

  // 获取系统状态
  async getStatus() {
    return await apiClient.get('/status')
  }
}

export default api