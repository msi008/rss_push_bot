<template>
  <div class="article-list-container">
    <!-- 文章统计和筛选 -->
    <div class="list-header">
      <div class="stats-section">
        <el-statistic 
          title="文章总数" 
          :value="articles.length" 
          class="stat-item"
        />
        <el-statistic 
          title="今日更新" 
          :value="todayArticlesCount" 
          class="stat-item"
        />
        <el-statistic 
          title="订阅源" 
          :value="uniqueSourcesCount" 
          class="stat-item"
        />
      </div>
      
      <div class="filter-section">
        <el-input
          v-model="searchText"
          placeholder="搜索文章标题或内容"
          :prefix-icon="Search"
          clearable
          style="width: 300px;"
        />
        <el-select 
          v-model="sortBy" 
          placeholder="排序方式"
          style="width: 150px; margin-left: 10px;"
        >
          <el-option label="最新优先" value="newest" />
          <el-option label="最旧优先" value="oldest" />
        </el-select>
        <el-button 
          type="primary" 
          @click="pushToWeChat" 
          :loading="pushing"
          style="margin-left: 10px;"
        >
          <el-icon><Promotion /></el-icon>
          推送到微信
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 文章列表 -->
    <div v-else class="articles-container">
      <div 
        v-for="article in filteredAndSortedArticles" 
        :key="article.link"
        class="article-card"
      >
        <div class="article-header">
          <h3 class="article-title">
            <a 
              :href="article.link" 
              target="_blank" 
              rel="noopener noreferrer"
              @click="trackClick(article)"
            >
              {{ article.title }}
            </a>
          </h3>
          <div class="article-meta">
            <el-tag 
              v-if="article.source" 
              size="small" 
              type="info"
              class="source-tag"
            >
              {{ getSourceName(article.source) }}
            </el-tag>
            <span class="publish-time">
              <el-icon><Clock /></el-icon>
              {{ formatTime(article.pubDate) }}
            </span>
            <span v-if="article.author" class="author">
              <el-icon><User /></el-icon>
              {{ article.author }}
            </span>
          </div>
        </div>
        
        <div class="article-content">
          <div class="article-summary">
            <div v-html="truncateHtml(article.summary || article.content, 200)" @load="onImageLoad" @error="onImageError"></div>
          </div>
          <div v-if="article.content && article.content.length > 200" class="read-more">
            <el-button 
              text 
              @click="toggleExpand(article)"
              class="expand-btn"
            >
              {{ article.expanded ? '收起' : '展开全文' }}
            </el-button>
          </div>
          <div 
            v-if="article.expanded" 
            class="article-full-content"
            v-html="article.content"
            @load="onImageLoad"
            @error="onImageError"
          ></div>
        </div>
        
        <div class="article-actions">
          <el-button 
            size="small" 
            @click="openArticle(article)"
            :icon="View"
          >
            阅读原文
          </el-button>
          <el-button 
            size="small" 
            @click="copyLink(article)"
            :icon="DocumentCopy"
          >
            复制链接
          </el-button>
          <el-button 
            size="small" 
            @click="shareArticle(article)"
            :icon="Share"
          >
            分享
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredAndSortedArticles.length === 0" class="empty-state">
        <el-empty description="暂无文章数据">
          <el-button type="primary" @click="$emit('refresh')">刷新文章</el-button>
        </el-empty>
      </div>

      <!-- 滚动加载更多 -->
      <div v-if="hasMore && !loading" class="load-more-section">
        <el-button 
          @click="loadMore" 
          :loading="loadingMore"
          style="width: 100%;"
        >
          加载更多
        </el-button>
      </div>
      
      <!-- 加载中状态 -->
      <div v-if="loadingMore" class="loading-more">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      
      <!-- 无更多数据 -->
      <div v-if="!hasMore && articles.length > 0" class="no-more">
        <span>已加载全部文章</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, 
  Promotion, 
  Clock, 
  User, 
  View, 
  DocumentCopy, 
  Share,
  Loading
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { api } from '../services/api'

dayjs.locale('zh-cn')

// 定义props
const props = defineProps({
  articles: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object,
    default: () => ({})
  }
})

// 定义事件
const emit = defineEmits(['refresh', 'load-more'])

// 响应式数据
const searchText = ref('')
const sortBy = ref('newest')
const currentPage = ref(1)
const pageSize = ref(20)
const pushing = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)

// 计算属性
const todayArticlesCount = computed(() => {
  const today = dayjs().startOf('day')
  return props.articles.filter(article => 
    dayjs(article.pubDate).isAfter(today)
  ).length
})

const uniqueSourcesCount = computed(() => {
  const sources = props.articles.map(article => article.source).filter(Boolean)
  return new Set(sources).size
})

const filteredAndSortedArticles = computed(() => {
  let filtered = props.articles
  
  // 搜索过滤
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    filtered = filtered.filter(article => 
      article.title?.toLowerCase().includes(keyword) ||
      article.summary?.toLowerCase().includes(keyword) ||
      article.content?.toLowerCase().includes(keyword)
    )
  }
  
  // 排序
  filtered = [...filtered].sort((a, b) => {
    const dateA = new Date(a.pubDate)
    const dateB = new Date(b.pubDate)
    return sortBy.value === 'newest' ? dateB - dateA : dateA - dateB
  })
  
  // 不再进行分页，返回所有过滤后的文章
  return filtered
})

// 监听分页信息变化
watch(() => props.pagination, (newPagination) => {
  if (newPagination) {
    hasMore.value = newPagination.hasMore !== undefined ? newPagination.hasMore : true
  }
}, { immediate: true })

// 滚动加载更多
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  
  loadingMore.value = true
  currentPage.value += 1
  
  try {
    await emit('load-more', currentPage.value, pageSize.value)
  } catch (error) {
    console.error('加载更多失败:', error)
    ElMessage.error('加载更多失败')
    currentPage.value -= 1 // 恢复页码
  } finally {
    loadingMore.value = false
  }
}

// 监听搜索条件变化重置分页
watch([searchText, sortBy], () => {
  currentPage.value = 1
})

// 监听articles变化重置分页
watch(() => props.articles, () => {
  currentPage.value = 1
})

// 滚动监听
const handleScroll = () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement
  if (scrollTop + clientHeight >= scrollHeight - 100 && hasMore.value && !loadingMore.value) {
    loadMore()
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// 方法
const formatTime = (timeString) => {
  // 直接格式化时间（timeString已经是北京时间）
  const date = new Date(timeString)
  return date.getFullYear() + '-' + 
         String(date.getMonth() + 1).padStart(2, '0') + '-' +
         String(date.getDate()).padStart(2, '0') + ' ' +
         String(date.getHours()).padStart(2, '0') + ':' +
         String(date.getMinutes()).padStart(2, '0')
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const truncateHtml = (html, maxLength) => {
  if (!html) return ''
  
  // 如果是纯文本，直接截断
  if (!html.includes('<')) {
    return truncateText(html, maxLength)
  }
  
  // 创建临时div来解析HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  
  // 获取纯文本内容用于截断
  const textContent = tempDiv.textContent || tempDiv.innerText || ''
  
  if (textContent.length <= maxLength) {
    return html
  }
  
  // 如果包含图片，优先保留图片
  const images = tempDiv.querySelectorAll('img')
  if (images.length > 0) {
    // 保留第一个图片和部分文本
    const truncatedText = truncateText(textContent, maxLength - 50) + '...'
    return `${truncatedText}<br>${images[0].outerHTML}`
  }
  
  // 普通HTML截断
  return truncateText(textContent, maxLength) + '...'
}

const getSourceName = (sourceUrl) => {
  if (!sourceUrl) return '未知来源'
  
  // 检查是否是财联社文章
  if (sourceUrl.includes('cls.cn') || sourceUrl === '财联社') {
    return '财联社'
  }
  
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

const toggleExpand = (article) => {
  article.expanded = !article.expanded
}

const openArticle = (article) => {
  window.open(article.link, '_blank', 'noopener,noreferrer')
}

const copyLink = async (article) => {
  try {
    await navigator.clipboard.writeText(article.link)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const shareArticle = (article) => {
  if (navigator.share) {
    navigator.share({
      title: article.title,
      text: article.summary,
      url: article.link
    })
  } else {
    copyLink(article)
  }
}

// 图片加载处理
const onImageLoad = (event) => {
  const img = event.target
  if (img.tagName === 'IMG') {
    img.style.opacity = '1'
    img.style.transition = 'opacity 0.3s ease'
  }
}

// 图片错误处理
const onImageError = (event) => {
  const img = event.target
  if (img.tagName === 'IMG') {
    // 替换为占位图片或隐藏
    img.style.display = 'none'
    console.warn('图片加载失败:', img.src)
  }
}

const trackClick = (article) => {
  // 可以在这里添加点击统计
  console.log('文章点击:', article.title)
}

const pushToWeChat = async () => {
  try {
    pushing.value = true
    const result = await api.pushArticles()
    
    if (result.success) {
      ElMessage.success(result.message || '推送成功')
    } else {
      ElMessage.warning(result.message || '推送完成，但可能存在问题')
    }
  } catch (error) {
    ElMessage.error('推送失败：' + error.message)
  } finally {
    pushing.value = false
  }
}

// 监听搜索条件变化重置分页
watch([searchText, sortBy], () => {
  currentPage.value = 1
})

// 监听articles变化重置分页
watch(() => props.articles, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.article-list-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.stats-section {
  display: flex;
  gap: 30px;
}

.stat-item {
  text-align: center;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-container {
  padding: 40px 0;
}

/* 全局图片控制 - 最高优先级 */
img,
.article-card img,
.article-summary img,
.article-summary div img,
.article-summary p img,
.article-summary span img,
.article-summary * img,
.article-full-content img,
.article-full-content div img,
.article-full-content p img,
.article-full-content span img,
.article-full-content * img {
  max-width: 100% !important;
  width: 100% !important;
  height: auto !important;
  display: block !important;
  box-sizing: border-box !important;
  object-fit: contain !important;
}

.articles-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.article-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
}

.article-card:hover {
  box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.article-header {
  margin-bottom: 16px;
}

.article-title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.article-title a {
  color: #303133;
  text-decoration: none;
  transition: color 0.3s ease;
}

.article-title a:hover {
  color: #409eff;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #909399;
}

.source-tag {
  margin-right: 5px;
}

.publish-time, .author {
  display: flex;
  align-items: center;
  gap: 4px;
}

.article-content {
  margin-bottom: 16px;
}

.article-summary {
  margin: 0 0 12px 0;
  line-height: 1.6;
  color: #606266;
  font-size: 14px;
  overflow: visible;
}

.article-summary > div {
  overflow: visible;
}

.article-summary img,
.article-summary div img,
.article-summary p img,
.article-summary * img {
  max-width: 100% !important;
  width: 100% !important;
  height: auto !important;
  max-height: 300px !important;
  border-radius: 6px;
  margin: 8px 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: block;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.2s ease;
}

.article-summary img.loaded {
  opacity: 1;
}

.article-summary img:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.article-full-content img,
.article-full-content div img,
.article-full-content p img,
.article-full-content * img {
  max-width: 100% !important;
  width: 100% !important;
  height: auto !important;
  max-height: 400px !important;
  border-radius: 6px;
  margin: 10px 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: block;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.2s ease;
}

.article-full-content img.loaded {
  opacity: 1;
}

.article-full-content img:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

/* 响应式图片适配 */
@media (max-width: 768px) {
  .article-summary img,
  .article-full-content img {
    max-width: 100% !important;
    height: auto !important;
    margin: 6px 0;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .article-summary img,
  .article-full-content img {
    max-width: 100% !important;
    margin: 12px 0;
  }
}

.read-more {
  margin-top: 8px;
}

.expand-btn {
  padding: 0;
  font-size: 12px;
}

.article-full-content {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
  font-size: 14px;
  line-height: 1.6;
}

.article-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

.load-more-section {
  text-align: center;
  padding: 20px 0;
}

.loading-more {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 20px 0;
  color: #909399;
  font-size: 14px;
}

.no-more {
  text-align: center;
  padding: 20px 0;
  color: #909399;
  font-size: 14px;
}

.no-more::before,
.no-more::after {
  content: '';
  display: inline-block;
  width: 60px;
  height: 1px;
  background: #e4e7ed;
  margin: 0 10px;
  vertical-align: middle;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .stats-section {
    justify-content: space-around;
  }
  
  .filter-section {
    flex-wrap: wrap;
  }
  
  .article-meta {
    gap: 8px;
  }
  
  .article-actions {
    justify-content: space-between;
  }
}
</style>