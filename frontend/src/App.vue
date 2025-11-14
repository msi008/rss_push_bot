<template>
  <div id="app">
    <el-container class="app-container">
      <!-- 头部导航 -->
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="app-title">
            <el-icon><Reading /></el-icon>
            RSS订阅阅读器
          </h1>
          <div class="header-actions">
            <el-button 
              type="primary" 
              @click="refreshArticles" 
              :loading="loading"
              :icon="Refresh"
            >
              刷新文章
            </el-button>
            <el-button @click="showStatus" :icon="InfoFilled">
              系统状态
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- 主要内容区域 -->
      <el-container>
        <!-- 侧边栏 - 订阅源分类 -->
        <el-aside width="280px" class="sidebar">
          <div class="sidebar-content">
            <h3 class="sidebar-title">订阅源分类</h3>
            
            <!-- 分类筛选 -->
            <div class="filter-section">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索订阅源"
                :prefix-icon="Search"
                clearable
              />
              
              <!-- 财联社文章过滤开关 -->
              <div class="filter-option" style="margin-top: 15px;">
                <el-switch
                  v-model="filterClsArticles"
                  active-text="隐藏财联社文章"
                  inactive-text="显示财联社文章"
                  style="width: 100%;"
                />
              </div>
            </div>

            <!-- 分类列表 -->
            <div class="category-list">
              <div 
                v-for="category in categories" 
                :key="category.id"
                class="category-item"
                :class="{ active: activeCategory === category.id }"
                @click="selectCategory(category.id)"
              >
                <span class="category-icon">
                  <el-icon><component :is="category.icon" /></el-icon>
                </span>
                <span class="category-name">{{ category.name }}</span>
                <span class="article-count">{{ category.count }}</span>
              </div>
            </div>

            <!-- 订阅源列表 -->
            <div class="source-list">
              <h4 class="source-title">订阅源列表</h4>
              <div 
                v-for="source in filteredSources" 
                :key="source.id"
                class="source-item"
                :class="{ active: activeSource === source.id }"
                @click="selectSource(source.id)"
              >
                <span class="source-name">{{ source.name }}</span>
                <el-tag 
                  v-if="getSourceArticleCount(source.id) > 0"
                  size="small" 
                  type="info"
                >
                  {{ getSourceArticleCount(source.id) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-aside>

        <!-- 主内容区域 -->
        <el-main class="main-content">
          <router-view 
            :articles="filteredArticles"
            :loading="loading"
            @refresh="refreshArticles"
          />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Refresh, 
  InfoFilled, 
  Search,
  Reading,
  Star,
  ChatDotRound,
  VideoCamera,
  CollectionTag
} from '@element-plus/icons-vue'
import { api } from './services/api'

const router = useRouter()

// 响应式数据
const articles = ref([])
const sources = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const activeCategory = ref('all')
const activeSource = ref('')
const filterClsArticles = ref(false)

// 分类定义
const categories = ref([
  { id: 'all', name: '全部文章', icon: 'CollectionTag', count: 0 }
])

// 计算属性
const filteredSources = computed(() => {
  return sources.value.filter(source => 
    source.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const filteredArticles = computed(() => {
  let filtered = articles.value
  
  // 过滤财联社文章
  if (filterClsArticles.value) {
    filtered = filtered.filter(article => {
      // 检查文章来源是否包含财联社相关关键词
      const sourceName = getSourceName(article.source).toLowerCase()
      const title = (article.title || '').toLowerCase()
      const isClsArticle = sourceName.includes('财联社') || 
                           sourceName.includes('cls') || 
                           sourceName.includes('cailianpress') ||
                           title.includes('财联社') ||
                           article.link?.includes('cls.cn') ||
                           article.link?.includes('cailianpress.com')
      return !isClsArticle
    })
  }
  
  // 按订阅源筛选
  if (activeSource.value) {
    filtered = filtered.filter(article => {
      // 从文章源URL中提取ID进行匹配
      const articleSourceId = extractSourceIdFromUrl(article.source)
      console.log('文章源URL:', article.source, '提取的ID:', articleSourceId, '匹配目标ID:', activeSource.value, '结果:', articleSourceId === activeSource.value)
      return articleSourceId === activeSource.value
    })
  }
  
  return filtered
})

// 方法
const refreshArticles = async () => {
  loading.value = true
  try {
    const response = await api.getArticles()
    if (response.success) {
      articles.value = response.data
      updateCategoryCounts()
      ElMessage.success(`成功获取 ${response.count} 篇文章`)
    }
  } catch (error) {
    ElMessage.error('获取文章失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const selectCategory = (categoryId) => {
  // 如果点击的是当前已激活的分类，则刷新数据
  if (activeCategory.value === categoryId) {
    refreshArticles()
  }
  
  activeCategory.value = categoryId
  activeSource.value = ''
  // 更新URL参数以反映当前筛选状态
  const query = categoryId === 'all' ? {} : { category: categoryId }
  router.push({ path: '/', query })
}

const selectSource = (sourceName) => {
  activeSource.value = activeSource.value === sourceName ? '' : sourceName
  // 更新URL参数以反映当前筛选状态
  const query = activeSource.value ? { source: encodeURIComponent(activeSource.value) } : {}
  
  console.log('设置URL参数:', query)
  
  // 如果当前路由已经是根路径，使用replace而不是push来避免重复导航警告
  if (router.currentRoute.value.path === '/') {
    router.replace({ path: '/', query })
  } else {
    router.push({ path: '/', query })
  }
  
  // 立即应用筛选（不等待路由变化）
  console.log('点击订阅源:', sourceName, '当前激活源:', activeSource.value)
  console.log('筛选后的文章数量:', filteredArticles.value.length)
}

const getSourceArticleCount = (sourceName) => {
  return articles.value.filter(article => {
    // 使用与筛选逻辑相同的名称转换
    const articleSourceName = getSourceName(article.source)
    return articleSourceName === sourceName
  }).length
}

const updateCategoryCounts = () => {
  categories.value.forEach(category => {
    if (category.id === 'all') {
      category.count = articles.value.length
    }
  })
}

// 获取源名称
const getSourceName = (sourceUrl) => {
  if (!sourceUrl) return '未知来源'
  
  // 从URL中提取源名称
  if (sourceUrl.includes('twitter.com')) {
    const match = sourceUrl.match(/twitter\.com\/([^/?]+)/)
    return match ? `Twitter: ${match[1]}` : 'Twitter'
  }
  
  if (sourceUrl.includes('rsshub://')) {
    const match = sourceUrl.match(/rsshub:\/\/([^/]+)/)
    return match ? `RSSHub: ${match[1]}` : 'RSSHub'
  }
  
  // 尝试从URL中提取域名
  try {
    const url = new URL(sourceUrl)
    return url.hostname.replace('www.', '')
  } catch {
    return sourceUrl
  }
}

const showStatus = async () => {
  try {
    const response = await api.getStatus()
    ElMessage.info(`系统运行正常，已订阅 ${response.data.config.rssSources} 个源`)
  } catch (error) {
    ElMessage.error('获取系统状态失败')
  }
}

// 解析URL参数
const parseUrlParams = () => {
  const route = router.currentRoute.value
  const { category, source } = route.query
  
  console.log('解析URL参数 - category:', category, 'source:', source)
  
  if (category && categories.value.some(cat => cat.id === category)) {
    activeCategory.value = category
  }
  
  if (source) {
    // 解码URL参数中的特殊字符
    activeSource.value = decodeURIComponent(source)
    console.log('设置activeSource为:', activeSource.value)
  }
}

// 监听路由变化
import { watch } from 'vue'

// 生命周期
onMounted(async () => {
  // 解析URL参数
  parseUrlParams()
  
  await refreshArticles()
  
  // 获取订阅源列表
  try {
    const response = await api.getHealth()
    sources.value = (response.feeds || []).map(feed => ({
      id: extractSourceIdFromUrl(feed.url), // 从URL中提取ID
      name: feed.name || getSourceName(feed.url),
      url: feed.url
    }))
    console.log('API获取的订阅源列表:', sources.value)
  } catch (error) {
    console.error('获取订阅源列表失败:', error)
    // 如果获取失败，从文章数据中提取订阅源
    extractSourcesFromArticles()
  }
  
  // 调试信息
  console.log('当前文章数据:', articles.value)
  console.log('当前订阅源列表:', sources.value)
})

// 监听路由参数变化
watch(() => router.currentRoute.value.query, (newQuery, oldQuery) => {
  console.log('路由参数变化:', oldQuery, '->', newQuery)
  parseUrlParams()
})

// 从文章数据中提取订阅源
const extractSourcesFromArticles = () => {
  const sourceMap = {}
  articles.value.forEach(article => {
    if (article.source) {
      const sourceName = getSourceName(article.source)
      if (!sourceMap[sourceName]) {
        sourceMap[sourceName] = {
          id: article.source, // 直接使用article.source作为ID
          name: sourceName,
          url: article.source
        }
      }
    }
  })
  sources.value = Object.values(sourceMap)
}

// 从URL中提取订阅源ID
const extractSourceIdFromUrl = (url) => {
  if (!url) return ''
  
  // 如果是RSSHub协议格式 (rsshub://xxx)
  if (url.startsWith('rsshub://')) {
    // 提取路径的最后一部分作为ID
    const path = url.replace('rsshub://', '')
    const parts = path.split('/')
    return parts[parts.length - 1] || path
  }
  
  // 如果是标准URL格式，提取路径的最后一部分
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname
    const parts = path.split('/').filter(part => part !== '')
    return parts[parts.length - 1] || path.replace(/^\//, '')
  } catch {
    // 如果URL解析失败，返回原始URL
    return url
  }
}

// 生成订阅源ID
const generateSourceId = (sourceName) => {
  // 使用简单的哈希函数生成ID
  let hash = 0
  for (let i = 0; i < sourceName.length; i++) {
    const char = sourceName.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0 20px;
  display: flex;
  align-items: center;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.app-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.sidebar {
  background: #f8f9fa;
  border-right: 1px solid #e4e7ed;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

.sidebar-content {
  padding: 20px;
}

.sidebar-title {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.filter-section {
  margin-bottom: 20px;
}

.category-list {
  margin-bottom: 30px;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;
}

.category-item:hover {
  background: #e4e7ed;
  color: #409eff;
}

.category-item.active {
  background: #409eff;
  color: white;
}

.category-icon {
  margin-right: 10px;
  font-size: 16px;
}

.category-name {
  flex: 1;
  font-size: 14px;
}

.article-count {
  background: rgba(255,255,255,0.2);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.source-list {
  border-top: 1px solid #e4e7ed;
  padding-top: 20px;
}

.source-title {
  margin: 0 0 15px 0;
  color: #606266;
  font-size: 14px;
  font-weight: 600;
}

.source-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  margin-bottom: 5px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;
  font-size: 13px;
}

.source-item:hover {
  background: #e4e7ed;
}

.source-item.active {
  background: #409eff;
  color: white;
}

.source-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-content {
  padding: 0;
  background: #f5f7fa;
}
</style>

<style>
/* 全局图片控制规则 */
img,
img[width],
img[height],
img[style] {
  max-width: 100% !important;
  width: 100% !important;
  height: auto !important;
  display: block !important;
  box-sizing: border-box !important;
  object-fit: contain !important;
  overflow: hidden !important;
}
</style>