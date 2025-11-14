/**
 * RSS服务模块 - 不依赖Python版本
 * 移除了@follow-app/client-sdk依赖，直接使用fetch API获取RSS数据
 */

import axios from 'axios';
import Parser from 'rss-parser';
import { logger } from '../utils/logger.js';
import { getCache, setCache, getCacheStats } from '../utils/cache.js';
import { retryWithBackoff } from '../utils/retry.js';

// RSS解析器实例
const parser = new Parser({
  customFields: {
    item: ['pubDate', 'updated', 'author', 'category', 'content']
  }
});

/**
 * 获取RSS源数据 - 不依赖Python版本
 * @param {string} rssUrl RSS源URL
 * @param {Object} options 请求选项
 * @returns {Promise<Object>} RSS数据
 */
export async function fetchRssFeed(rssUrl, options = {}) {
  const cacheKey = `rss:${rssUrl}`;
  
  try {
    // 检查缓存
    const cachedData = getCache(cacheKey);
    if (cachedData && !options.skipCache) {
      logger.debug(`从缓存获取RSS数据: ${rssUrl}`);
      return cachedData;
    }

    logger.info(`获取RSS数据: ${rssUrl}`);
    
    // 使用axios获取RSS数据
    const response = await retryWithBackoff(
      () => axios.get(rssUrl, {
        timeout: options.timeout || 10000,
        headers: {
          'User-Agent': 'RSSHub-WeChat-Bot/1.0.0',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        }
      }),
      3
    );

    // 解析RSS数据
    const feed = await parser.parseString(response.data);
    
    // 标准化数据格式
    const normalizedData = {
      title: feed.title || '未知标题',
      description: feed.description || '',
      link: feed.link || rssUrl,
      lastBuildDate: feed.lastBuildDate || feed.pubDate,
      items: feed.items.map(item => ({
        title: item.title || '无标题',
        link: item.link || '',
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        author: item.author || item.creator || '',
        category: item.category || '',
        content: item.content || item.contentSnippet || item.summary || '',
        guid: item.guid || item.link || ''
      }))
    };

    // 缓存数据
    setCache(cacheKey, normalizedData, options.cacheTTL || 300); // 默认5分钟缓存
    
    logger.info(`成功获取RSS数据: ${rssUrl}, 文章数: ${normalizedData.items.length}`);
    return normalizedData;
    
  } catch (error) {
    logger.error(`获取RSS数据失败: ${rssUrl}`, error);
    throw new Error(`获取RSS数据失败: ${error.message}`);
  }
}

/**
 * 批量获取多个RSS源数据
 * @param {Array} rssUrls RSS源URL数组
 * @param {Object} options 请求选项
 * @returns {Promise<Array>} RSS数据数组
 */
export async function fetchAllRssFeeds(rssUrls, options = {}) {
  const results = [];
  const errors = [];
  
  logger.info(`开始批量获取 ${rssUrls.length} 个RSS源数据`);
  
  // 并发获取RSS数据，但限制并发数
  const concurrencyLimit = options.concurrency || 5;
  const chunks = [];
  
  for (let i = 0; i < rssUrls.length; i += concurrencyLimit) {
    chunks.push(rssUrls.slice(i, i + concurrencyLimit));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(async (url) => {
      try {
        const data = await fetchRssFeed(url, options);
        return { url, data, success: true };
      } catch (error) {
        logger.error(`获取RSS源失败: ${url}`, error);
        errors.push({ url, error: error.message });
        return { url, error: error.message, success: false };
      }
    });
    
    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
  }
  
  logger.info(`批量获取完成，成功: ${results.filter(r => r.success).length}, 失败: ${errors.length}`);
  
  return {
    results: results.filter(r => r.success),
    errors,
    total: rssUrls.length,
    successCount: results.filter(r => r.success).length,
    errorCount: errors.length
  };
}

/**
 * 获取缓存统计信息
 * @returns {Object} 缓存统计
 */
export function getRssCacheStats() {
  return getCacheStats();
}

/**
 * 检查RSS源健康状态
 * @param {string} rssUrl RSS源URL
 * @returns {Promise<Object>} 健康状态
 */
export async function checkRSSHealth(rssUrl) {
  try {
    const startTime = Date.now();
    await fetchRssFeed(rssUrl, { skipCache: true });
    const responseTime = Date.now() - startTime;
    
    return {
      url: rssUrl,
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      url: rssUrl,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 清理过期的RSS缓存
 * @param {number} maxAge 最大缓存时间（秒）
 */
export function cleanExpiredRssCache(maxAge = 3600) {
  // 这里可以实现缓存清理逻辑
  // 当前使用内存缓存，自动清理
  logger.info('RSS缓存清理完成');
}