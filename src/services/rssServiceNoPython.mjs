/**
 * RSSHub订阅服务模块 (ESM版本)
 * 不依赖原生模块的纯JavaScript实现
 */
import axios from 'axios';
import crypto from 'crypto';
import config from '../config/config.js';
import rsshubCache from '../config/rsshubCache.js';
import cacheMonitor from '../utils/cacheMonitor.js';
import logger from '../utils/logger.js';
import { saveArticles, getArticles, getArticleByLink, getArticlesByLinks } from './supabaseService.js';

/**
 * 转换为北京时间（UTC+8）
 * @param {string|Date} date - 原始时间
 * @returns {string} 北京时间 ISO 字符串
 */
function convertToBeijingTime(date) {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return new Date().toISOString();
    }
    
    // 转换为北京时间（UTC+8）
    const beijingTime = new Date(dateObj.getTime() + 8 * 60 * 60 * 1000);
    return beijingTime.toISOString();
  } catch (error) {
    logger.warn(`时间转换失败: ${date}`, error);
    return new Date().toISOString();
  }
}

/**
 * 使用纯API方式获取RSS订阅源数据
 * @param {string} source - RSS源的URL或RSSHub协议路径
 * @returns {Promise<Array>} - 解析后的文章数组
 */
async function fetchRssFeed(source) {
  if (!source) {
    logger.warn('尝试获取未定义的RSS源，已跳过。');
    return [];
  }

  // 如果是rsshub://协议，则转换为实际的RSSHub URL
  if (source.startsWith('rsshub://')) {
    const cleanSource = source.trim().replace(/[,\s]+$/g, '');
    
    // 构建基础URL
    let baseUrl = 'https://api.follow.is/feeds?url=' + encodeURIComponent(cleanSource);
    
    // 使用智能缓存策略添加参数
    baseUrl = rsshubCache.addCacheParamsToUrl(baseUrl, config.api.forceRefresh);
    
    source = baseUrl;
  }

  logger.info(`获取RSS订阅源: ${source}`);

  let attempts = 0;
  const maxAttempts = config.api.retryAttempts || 3;
  
  // 记录请求开始
  const requestInfo = cacheMonitor.recordRequestStart(source);
  
  while (attempts < maxAttempts) {
    try {
      const axiosConfig = {
        headers: {
          'Content-Type': 'application/json',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
          'Cache-Control': config.api.forceRefresh ? 'no-cache' : 'max-age=0'
        },
        timeout: config.api.requestTimeout || 10000
      };
      
      const response = await axios.get(source, axiosConfig);
      if (response.data.code === 0 && response.data.data?.entries) {
        const feed = response.data.data;
        
        // 记录请求成功
        const monitorResult = cacheMonitor.recordRequestSuccess(
          requestInfo, 
          feed.entries.length,
          false // 不是从缓存获取
        );
        
        logger.info(`✅ 获取成功，共${feed.entries.length}篇文章，耗时${monitorResult.duration}ms`);
        
        // 处理和过滤文章数据
        const articles = feed.entries
          .slice(0, config.rss.maxItemsPerFeed || 10)
          .map(item => ({
            title: item.title?.trim() || '',
            link: item.url || item.guid || '',
            author: item.author || '',
            summary: item.description || '',
            content: item.content || '',
            pubDate: item.publishedAt || new Date().toISOString(),
            source: item.authorUrl || ''
          }));
        
        return articles;
      } else {
        logger.warn(`API返回数据格式无效: ${source}`);
        return [];
      }
    } catch (error) {
      attempts++;
      
      // 记录请求失败
      cacheMonitor.recordRequestFailure(requestInfo, error);
      
      if (attempts >= maxAttempts) {
        logger.error(`获取失败: ${source}, 错误: ${error.message}, 已重试${attempts}次`);
        return [];
      }
      
      logger.warn(`第${attempts}次获取失败，${config.api.retryDelay || 2000}ms后重试: ${source}`);
      await new Promise(resolve => setTimeout(resolve, config.api.retryDelay || 2000));
    }
  }
  
  return [];
}

/**
 * 获取所有RSS订阅源的文章
 * @returns {Promise<Array>} 所有订阅源的文章列表（按时间倒序排列）
 */
async function fetchAllRssFeeds() {
  const startTime = Date.now();
  const sources = config.feeds;
  
  logger.info(`开始并行获取${sources.length}个RSS订阅源`, sources);
  
  // 并行获取所有RSS源
  const rssPromises = sources.map(async (source, index) => {
    const sourceStartTime = Date.now();
    try {
      // 使用纯API方式获取数据
      const articles = await fetchRssFeed(source.url);
      const sourceDuration = Date.now() - sourceStartTime;
      logger.info(`✅ 成功获取RSS源[${index+1}/${sources.length}]: ${source.name || source.url}，共${articles.length}篇文章，耗时${sourceDuration}ms`);
      return articles;
    } catch (error) {
      const sourceDuration = Date.now() - sourceStartTime;
      logger.error(`获取RSS源[${index+1}/${sources.length}]失败: ${source.url}，耗时${sourceDuration}ms，错误: ${error.message}`);
      return [];
    }
  });
  
  // 等待所有RSS源获取完成
  const rssResults = await Promise.all(rssPromises);
  const allArticles = rssResults.flat();
  const rssFetchTime = Date.now() - startTime;
  
  logger.info(`所有RSS源获取完成，共${allArticles.length}篇文章，耗时${rssFetchTime}ms`);
  
  // 获取财联社文章（如果配置了）
  if (config.cls.enabled) {
    const clsStartTime = Date.now();
    try {
      logger.info('开始获取财联社文章...');
      const clsArticles = await fetchClsArticles();
      allArticles.push(...clsArticles);
      const clsDuration = Date.now() - clsStartTime;
      logger.info(`财联社文章获取成功，共${clsArticles.length}篇，耗时${clsDuration}ms`);
    } catch (error) {
      const clsDuration = Date.now() - clsStartTime;
      logger.error(`获取财联社文章失败，耗时${clsDuration}ms，错误: ${error.message}`);
    }
  }
  
  // 按发布时间倒序排列（最新的在前）
  const sortStartTime = Date.now();
  const sortedArticles = allArticles.sort((a, b) => {
    const dateA = new Date(a.pubDate);
    const dateB = new Date(b.pubDate);
    return dateB - dateA;
  });
  const sortDuration = Date.now() - sortStartTime;
  logger.info(`文章排序完成，耗时${sortDuration}ms`);
  
  // 如果启用了Supabase，保存文章到数据库
  if (config.supabase.enabled) {
    const dbStartTime = Date.now();
    try {
      // 优化：批量检查文章是否存在
      const articleLinks = sortedArticles.map(article => article.link);
      const existingArticles = await getArticlesByLinks(articleLinks);
      const existingLinks = new Set(existingArticles.map(article => article.link));
      
      // 过滤掉已存在的文章
      const newArticles = sortedArticles.filter(article => !existingLinks.has(article.link));
      
      if (newArticles.length > 0) {
        logger.info(`发现${newArticles.length}篇新文章，正在保存到Supabase...`);
        const saveResult = await saveArticles(newArticles);
        if (saveResult.success) {
          logger.info(`成功保存${saveResult.count}篇文章到Supabase`);
        } else {
          logger.error(`保存文章到Supabase失败: ${saveResult.error}`);
        }
      } else {
        logger.info('没有新文章需要保存到Supabase');
      }
      
      const dbDuration = Date.now() - dbStartTime;
      logger.info(`数据库操作完成，耗时${dbDuration}ms`);
    } catch (error) {
      const dbDuration = Date.now() - dbStartTime;
      logger.error(`保存文章到Supabase异常，耗时${dbDuration}ms，错误: ${error.message}`);
    }
  }
  
  const totalDuration = Date.now() - startTime;
  logger.info(`✅ 成功获取并排序所有RSS文章，共${sortedArticles.length}篇，总耗时${totalDuration}ms`);
  return sortedArticles;
}

/**
 * 检查RSS订阅源健康状态
 * @returns {Promise<Object>} 健康检查结果
 */
async function checkRSSHealth() {
  try {
    const sources = config.feeds;
    const healthChecks = [];
    
    for (const source of sources) {
      try {
        const startTime = Date.now();
        // 测试API连接
        await fetchRssFeed(source.url);
        const responseTime = Date.now() - startTime;
        
        healthChecks.push({
          name: source.name,
          url: source.url,
          status: 'healthy',
          responseTime,
          checkedAt: new Date().toISOString()
        });
      } catch (error) {
        healthChecks.push({
          name: source.name,
          url: source.url,
          status: 'unhealthy',
          error: error.message,
          checkedAt: new Date().toISOString()
        });
      }
    }
    
    return {
      status: 'healthy',
      sources: healthChecks,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 生成财联社API的sign参数
 * @param {Object} params - 请求参数对象
 * @returns {string} 生成的sign值
 */
function generateClsSign(params) {
  // 对字典的键进行排序，并生成排序后的查询字符串
  const sortedKeys = Object.keys(params).sort();
  const queryString = new URLSearchParams();
  
  // 按排序后的键添加参数
  for (const key of sortedKeys) {
    queryString.append(key, params[key]);
  }
  
  const queryStringStr = queryString.toString();
  
  // 使用SHA1加密
  const sha1Hash = crypto.createHash('sha1').update(queryStringStr, 'utf8').digest('hex');
  
  // 对SHA1加密的结果再进行MD5加密
  const sign = crypto.createHash('md5').update(sha1Hash, 'utf8').digest('hex');
  
  return sign;
}

/**
 * 获取财联社文章列表
 * @param {string} lastTime - 获取文章的最后时间戳，默认为当前时间戳
 * @param {number} pageSize - 每页文章数量，默认使用配置文件中的值
 * @returns {Promise<Array>} - 解析后的文章数组
 */
async function fetchClsArticles(lastTime = null, pageSize = null) {
  try {
    // 如果没有提供时间戳，使用当前时间戳
    if (!lastTime) {
      lastTime = Math.floor(Date.now() / 1000);
    }
    
    // 使用配置文件中的值作为默认值
    if (!pageSize) {
      pageSize = config.cls.pageSize || 20;
    }
    
    // 构建财联社API参数
    const params = {
      app: 'CailianpressWeb',
      category: config.cls.category || 'red',
      last_time: lastTime,
      os: 'web',
      refresh_type: 1,
      rn: pageSize,
      sv: '8.4.6'
    };
    
    // 尝试动态生成sign值
    let sign;
    try {
      sign = generateClsSign(params);
      logger.info(`✅ 成功生成财联社API sign值: ${sign}`);
    } catch (error) {
      logger.warn(`生成财联社API sign值失败，使用默认值: ${error.message}`);
      sign = config.cls.sign || 'e9fa0dccc6a9574b9b93217871cb0982';
    }
    
    // 添加sign参数
    params.sign = sign;
    
    // 构建财联社API URL
    const baseUrl = 'https://www.cls.cn/v1/roll/get_roll_list';
    const url = new URL(baseUrl);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache'
      },
      timeout: config.api.requestTimeout || 10000
    };
    logger.info(`开始获取财联社文章: ${url.toString()}`);
    const response = await axios.get(url.toString(), axiosConfig);
    
    if (response.data.errno === 0 && response.data.data && response.data.data.roll_data) {
      const rollData = response.data.data.roll_data;
      logger.info(`✅ 财联社文章获取成功，共${rollData.length}篇文章`);
      
      // 处理和过滤文章数据
      const articles = rollData.map(item => {
        // 将时间戳转换为北京时间
        const publishTime = item.ctime ? new Date(item.ctime * 1000) : new Date();
        const beijingTime = publishTime //convertToBeijingTime(publishTime);
        
        return {
          title: item.title || '',
          link: item.shareurl || '',
          author: '财联社',
          summary: item.brief || '',
          content: item.content || '',
          pubDate: beijingTime,
          source: 'https://www.cls.cn',
          // 添加财联社特有的字段
          id: item.id,
          readingNum: item.reading_num || 0,
          commentNum: item.comment_num || 0,
          images: item.images || [],
          tags: item.tags || []
        };
      });
      
      return articles;
    } else {
      logger.warn(`财联社API返回数据格式无效`);
      return [];
    }
  } catch (error) {
    logger.error(`获取财联社文章失败: ${error.message}`);
    return [];
  }
}

// 导出函数
export {
  fetchRssFeed,
  fetchAllRssFeeds,
  checkRSSHealth,
  fetchClsArticles,
  convertToBeijingTime
};