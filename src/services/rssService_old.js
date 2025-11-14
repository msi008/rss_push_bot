/**
 * RSSHub订阅服务模块
 * 负责获取和解析RSS订阅源内容
 */
import Parser from 'rss-parser';
import axios from 'axios'; // 确保已引入axios
import config from '../config/config.js';
import logger from '../utils/logger.js';
import { convertRsshubToUrl } from '../utils/validate.js';

const parser = new Parser();

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
 * 获取所有RSS订阅源的文章
 * @returns {Promise<Array>} 所有订阅源的文章列表（按时间倒序排列）
 */
async function fetchAllRssFeeds() {
  const allArticles = [];
  const sources = config.feeds;  // 使用正确的配置路径
  
  logger.info(`2222222开始获取${sources.length}个RSS订阅源`, sources);
  
  for (const source of sources) {
    try {
      const articles = await fetchRssFeed(source.url, source.type || "rss");
      // console.log("11111111===========", articles); 
      allArticles.push(...articles);
    } catch (error) {
      logger.error(`获取RSS源失败: ${source.url}`, error);
    }
  }
  
  // 按发布时间倒序排列（最新的在前）
  const sortedArticles = allArticles.sort((a, b) => {
    const dateA = new Date(a.pubDate);
    const dateB = new Date(b.pubDate);
    return dateB - dateA; // 倒序排列
  });
  
  logger.info(`成功获取并排序所有RSS文章，共${sortedArticles.length}篇`);
  return sortedArticles;
}

/**
 * 检查RSS订阅源的健康状态
 * @param {string} source - RSS订阅源URL
 * @returns {Promise<Object>} 健康检查结果
 */
async function checkHealth(source) {
  try {
    const startTime = Date.now();
    await parser.parseURL(source);
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      checkedAt: new Date().toISOString()
    };
  }
}

/**
 * 从指定的RSS源获取并解析文章。
 * 支持标准RSS URL和RSSHub协议。
 * @param {string} source - RSS源的URL或RSSHub协议路径。
 * @returns {Promise<Array>} - 解析后的文章数组。
 */
async function fetchRssFeed(source) {
    if (!source) {
        logger.warn('尝试获取未定义的RSS源，已跳过。');
        return [];
    }

    // 如果是rsshub://协议，则转换为实际的RSSHub URL
    if (source.startsWith('rsshub://')) {
        // 清理源字符串（去首尾空格及尾部逗号）
        const cleanSource = source.trim().replace(/[,\s]+$/g, '');
        
        // 构建基础URL
        let baseUrl = 'https://api.follow.is/feeds?url=' + encodeURIComponent(cleanSource);
        
        // 添加缓存破坏参数（如果启用）
        if (config.api.cacheBuster) {
            const timestamp = Date.now();
            baseUrl += `&_t=${timestamp}`;
        }
        
        // 添加强制刷新参数（如果启用）
        if (config.api.forceRefresh) {
            baseUrl += '&refresh=true';
        }
        
        source = baseUrl;
    }

    logger.info(`开始获取RSS订阅源: ${source}`);

    let feed;
    let attempts = 0;
    const maxAttempts = config.api.retryAttempts;
    
    while (attempts < maxAttempts) {
        try {
            // 使用axios发起GET请求，并期望返回JSON数据
            const axiosConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
                    'Cache-Control': config.api.forceRefresh ? 'no-cache' : 'max-age=0'
                },
                timeout: config.api.requestTimeout
            };
            
            const response = await axios.get(source, axiosConfig);
            if(response.data.code == 0){
                feed = response.data.data ? response.data.data : null;
                break; // 成功则退出重试循环
            }
        } catch (error) {
            attempts++;
            if (attempts >= maxAttempts) {
                logger.error(`获取或解析RSS订阅源失败: ${source}, 错误: ${error.message}, 已重试${attempts}次`);
                return [];
            }
            
            logger.warn(`第${attempts}次获取失败，${config.api.retryDelay}ms后重试: ${source}`);
            await new Promise(resolve => setTimeout(resolve, config.api.retryDelay));
        }
    }

    if (!feed || !feed.entries) {
        logger.warn(`RSS订阅源格式无效或无内容: ${source}`);
        return [];
    }

    logger.info(`成功获取RSS订阅源，共${feed.entries.length}篇文章: ${source}`);

    // 处理和过滤文章数据
    const articles = feed.entries
        // .filter(isValidRssItem)
        .slice(0, config.rss.maxItemsPerFeed)  // 修正配置路径
        .map(item => ({
            title: item.title.trim(),
            link: item.url || item.guid,
            author: item.author || "",
            summary: item.description || '',
            content: item.content || '',
            pubDate: convertToBeijingTime(item.publishedAt || new Date().toISOString()),
            source: item.authorUrl || ''
        }));
    return articles;
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
      const health = await checkHealth(source.url);
      healthChecks.push({
        name: source.name,
        url: source.url,
        ...health
      });
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

// 测试用 - 获取配置中的baseUrl
function getBaseUrl() {
  return config.service.baseUrl;
}

export {
  fetchRssFeed,
  fetchAllRssFeeds,
  checkHealth,
  checkRSSHealth,
  getBaseUrl
};