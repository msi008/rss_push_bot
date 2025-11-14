/**
 * RSSHub 缓存优化配置
 * 专门针对 RSSHub 服务的缓存控制策略
 */

class RsshubCacheConfig {
  constructor() {
    // RSSHub 缓存控制参数
    this.cacheParams = {
      // 强制刷新参数
      forceRefresh: {
        refresh: 'true',
        force: '1',
        no_cache: '1'
      },
      
      // 缓存破坏参数
      cacheBuster: {
        _t: () => Date.now(),
        timestamp: () => Date.now(),
        rand: () => Math.random().toString(36).substring(2),
        nocache: '1'
      },
      
      // RSSHub 专用参数
      rsshubSpecific: {
        _cache: 'no',
        cache: 'false',
        bypass: 'true'
      }
    };
    
    // 智能缓存策略
    this.strategies = {
      // 高频更新源（新闻、社交媒体）
      highFrequency: {
        cacheDuration: 5 * 60 * 1000, // 5分钟
        params: ['cacheBuster', 'rsshubSpecific']
      },
      
      // 中频更新源（博客、资讯）
      mediumFrequency: {
        cacheDuration: 15 * 60 * 1000, // 15分钟
        params: ['cacheBuster']
      },
      
      // 低频更新源（周刊、月刊）
      lowFrequency: {
        cacheDuration: 60 * 60 * 1000, // 1小时
        params: [] // 不添加缓存破坏参数
      }
    };
    
    // 源类型映射
    this.sourceTypeMapping = {
      // 社交媒体（高频）
      twitter: 'highFrequency',
      weibo: 'highFrequency',
      zhihu: 'highFrequency',
      
      // 新闻资讯（高频）
      '36kr': 'highFrequency',
      toutiao: 'highFrequency',
      news: 'highFrequency',
      
      // 博客和技术（中频）
      blog: 'mediumFrequency',
      github: 'mediumFrequency',
      jianshu: 'mediumFrequency',
      
      // 周刊和月刊（低频）
      weekly: 'lowFrequency',
      monthly: 'lowFrequency'
    };
  }
  
  /**
   * 根据源URL获取缓存策略
   */
  getCacheStrategy(sourceUrl) {
    if (!sourceUrl) return this.strategies.highFrequency;
    
    // 检测源类型
    for (const [key, strategy] of Object.entries(this.sourceTypeMapping)) {
      if (sourceUrl.includes(key)) {
        return this.strategies[strategy];
      }
    }
    
    // 默认使用高频策略
    return this.strategies.highFrequency;
  }
  
  /**
   * 生成缓存控制参数
   */
  generateCacheParams(sourceUrl, forceRefresh = false) {
    const strategy = this.getCacheStrategy(sourceUrl);
    const params = {};
    
    // 如果强制刷新，添加强制刷新参数
    if (forceRefresh) {
      Object.assign(params, this.cacheParams.forceRefresh);
    }
    
    // 根据策略添加缓存破坏参数
    strategy.params.forEach(paramType => {
      const paramSet = this.cacheParams[paramType];
      Object.keys(paramSet).forEach(key => {
        const value = paramSet[key];
        params[key] = typeof value === 'function' ? value() : value;
      });
    });
    
    return params;
  }
  
  /**
   * 将参数对象转换为URL查询字符串
   */
  paramsToQueryString(params) {
    return Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  }
  
  /**
   * 为URL添加缓存控制参数
   */
  addCacheParamsToUrl(sourceUrl, forceRefresh = false) {
    if (!sourceUrl) return sourceUrl;
    
    const params = this.generateCacheParams(sourceUrl, forceRefresh);
    const queryString = this.paramsToQueryString(params);
    
    if (!queryString) return sourceUrl;
    
    // 判断URL是否已有查询参数
    const separator = sourceUrl.includes('?') ? '&' : '?';
    return sourceUrl + separator + queryString;
  }
  
  /**
   * 获取缓存持续时间
   */
  getCacheDuration(sourceUrl) {
    const strategy = this.getCacheStrategy(sourceUrl);
    return strategy.cacheDuration;
  }
  
  /**
   * 检查是否需要刷新缓存
   */
  shouldRefreshCache(sourceUrl, lastFetchTime) {
    if (!lastFetchTime) return true;
    
    const cacheDuration = this.getCacheDuration(sourceUrl);
    const now = Date.now();
    return (now - lastFetchTime) > cacheDuration;
  }
}

// 导出单例实例
export default new RsshubCacheConfig();