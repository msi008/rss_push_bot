/**
 * RSSHub订阅服务模块
 * 负责获取和解析RSS订阅源内容
 */
const Parser = require('rss-parser');
const axios = require('axios'); // 确保已引入axios
const config = require('../config/config');
const logger = require('../utils/logger');
const { convertRsshubToUrl } = require('../utils/validate');

const parser = new Parser();
/**
 * 获取所有RSS订阅源的文章
 * @returns {Promise<Array>} 所有订阅源的文章列表
 */
async function fetchAllRssFeeds() {
  const allArticles = [];
  const sources = config.feeds;  // 使用正确的配置路径
  
  logger.info(`开始获取${sources.length}个RSS订阅源`, sources);
  
  for (const source of sources) {
    try {
      const articles = await fetchRssFeed(source.url, source.type || "rss");
      // console.log("11111111===========", articles); 
      allArticles.push(...articles);
    } catch (error) {
      logger.error(`获取RSS源失败: ${source.url}`, error);
    }
  }
  return allArticles;
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
        source = 'https://api.follow.is/feeds?url=' + encodeURIComponent(cleanSource);
    }

    logger.info(`开始获取RSS订阅源: ${source}`);

    let feed;
    try {
        // 使用axios发起GET请求，并期望返回JSON数据
        const config = {
          headers: {
            'Content-Type': 'application/json',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
          }
          // params: {
          //   url: "rsshub://36kr/hot-list"
          // }
        };
        const response = await axios.get(source, config);
        if(response.data.code == 0){
          feed = response.data.data ? response.data.data : null;
        }
    } catch (error) {
        logger.error(`获取或解析RSS订阅源失败: ${source}, 错误: ${error.message}`);
        return [];
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
            pubDate: item.publishedAt || item.publishedAt || new Date().toISOString(),
            source: item.authorUrl || ''
        }));
    return articles;
}
module.exports = {
  fetchRssFeed,
  fetchAllRssFeeds,
  checkHealth,
  
  // 测试用 - 获取配置中的baseUrl
  getBaseUrl: () => config.service.baseUrl
};