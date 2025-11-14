/**
 * RSSHub 缓存监控工具
 * 实时监控缓存状态和性能
 */

class CacheMonitor {
  constructor() {
    this.cacheStats = new Map();
    this.lastFetchTimes = new Map();
    this.requestCounts = new Map();
    this.errorStats = new Map();
  }
  
  /**
   * 记录请求开始
   */
  recordRequestStart(sourceUrl) {
    const now = Date.now();
    this.requestCounts.set(sourceUrl, (this.requestCounts.get(sourceUrl) || 0) + 1);
    
    return {
      sourceUrl,
      startTime: now,
      requestId: `${sourceUrl}_${now}_${Math.random().toString(36).substring(2)}`
    };
  }
  
  /**
   * 记录请求成功
   */
  recordRequestSuccess(requestInfo, articleCount, fromCache = false) {
    const duration = Date.now() - requestInfo.startTime;
    const sourceUrl = requestInfo.sourceUrl;
    
    const stats = this.cacheStats.get(sourceUrl) || {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalDuration: 0,
      avgDuration: 0,
      lastArticleCount: 0,
      lastSuccessTime: Date.now()
    };
    
    stats.totalRequests++;
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.totalRequests;
    stats.lastArticleCount = articleCount;
    stats.lastSuccessTime = Date.now();
    
    if (fromCache) {
      stats.cacheHits++;
    } else {
      stats.cacheMisses++;
    }
    
    this.cacheStats.set(sourceUrl, stats);
    this.lastFetchTimes.set(sourceUrl, Date.now());
    
    return {
      sourceUrl,
      duration,
      articleCount,
      fromCache,
      cacheHitRate: stats.cacheHits / stats.totalRequests
    };
  }
  
  /**
   * 记录请求失败
   */
  recordRequestFailure(requestInfo, error) {
    const sourceUrl = requestInfo.sourceUrl;
    const errorStats = this.errorStats.get(sourceUrl) || {
      totalErrors: 0,
      lastError: null,
      errorTypes: new Map()
    };
    
    errorStats.totalErrors++;
    errorStats.lastError = {
      time: Date.now(),
      error: error.message || error.toString()
    };
    
    const errorType = error.message || 'Unknown';
    errorStats.errorTypes.set(errorType, (errorStats.errorTypes.get(errorType) || 0) + 1);
    
    this.errorStats.set(sourceUrl, errorStats);
  }
  
  /**
   * 获取缓存统计信息
   */
  getCacheStats(sourceUrl = null) {
    if (sourceUrl) {
      return this.cacheStats.get(sourceUrl) || null;
    }
    
    const allStats = {};
    for (const [url, stats] of this.cacheStats) {
      allStats[url] = stats;
    }
    
    return allStats;
  }
  
  /**
   * 获取缓存命中率
   */
  getCacheHitRate(sourceUrl = null) {
    if (sourceUrl) {
      const stats = this.cacheStats.get(sourceUrl);
      if (!stats || stats.totalRequests === 0) return 0;
      return stats.cacheHits / stats.totalRequests;
    }
    
    // 计算全局命中率
    let totalHits = 0;
    let totalRequests = 0;
    
    for (const stats of this.cacheStats.values()) {
      totalHits += stats.cacheHits;
      totalRequests += stats.totalRequests;
    }
    
    return totalRequests > 0 ? totalHits / totalRequests : 0;
  }
  
  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    const stats = {
      totalSources: this.cacheStats.size,
      totalRequests: 0,
      avgResponseTime: 0,
      cacheHitRate: this.getCacheHitRate(),
      sources: {}
    };
    
    let totalDuration = 0;
    let totalRequests = 0;
    
    for (const [url, sourceStats] of this.cacheStats) {
      stats.sources[url] = {
        requestCount: sourceStats.totalRequests,
        avgResponseTime: sourceStats.avgDuration,
        cacheHitRate: sourceStats.cacheHits / sourceStats.totalRequests,
        lastArticleCount: sourceStats.lastArticleCount,
        lastSuccessTime: sourceStats.lastSuccessTime
      };
      
      totalDuration += sourceStats.totalDuration;
      totalRequests += sourceStats.totalRequests;
    }
    
    stats.totalRequests = totalRequests;
    stats.avgResponseTime = totalRequests > 0 ? totalDuration / totalRequests : 0;
    
    return stats;
  }
  
  /**
   * 获取错误统计
   */
  getErrorStats(sourceUrl = null) {
    if (sourceUrl) {
      return this.errorStats.get(sourceUrl) || null;
    }
    
    const allErrors = {};
    for (const [url, errorStats] of this.errorStats) {
      allErrors[url] = {
        totalErrors: errorStats.totalErrors,
        lastError: errorStats.lastError,
        errorTypes: Object.fromEntries(errorStats.errorTypes)
      };
    }
    
    return allErrors;
  }
  
  /**
   * 检查是否需要刷新缓存
   */
  shouldRefreshCache(sourceUrl, cacheDuration) {
    const lastFetchTime = this.lastFetchTimes.get(sourceUrl);
    if (!lastFetchTime) return true;
    
    const now = Date.now();
    return (now - lastFetchTime) > cacheDuration;
  }
  
  /**
   * 生成缓存报告
   */
  generateReport() {
    const performance = this.getPerformanceStats();
    const errors = this.getErrorStats();
    
    return {
      timestamp: Date.now(),
      summary: {
        totalSources: performance.totalSources,
        totalRequests: performance.totalRequests,
        avgResponseTime: Math.round(performance.avgResponseTime),
        cacheHitRate: Math.round(performance.cacheHitRate * 100) + '%',
        errorRate: performance.totalRequests > 0 
          ? Math.round((Object.keys(errors).length / performance.totalRequests) * 100) + '%'
          : '0%'
      },
      sources: performance.sources,
      errors: errors
    };
  }
  
  /**
   * 重置统计信息
   */
  resetStats(sourceUrl = null) {
    if (sourceUrl) {
      this.cacheStats.delete(sourceUrl);
      this.requestCounts.delete(sourceUrl);
      this.errorStats.delete(sourceUrl);
      this.lastFetchTimes.delete(sourceUrl);
    } else {
      this.cacheStats.clear();
      this.requestCounts.clear();
      this.errorStats.clear();
      this.lastFetchTimes.clear();
    }
  }
}

// 导出单例实例
export default new CacheMonitor();