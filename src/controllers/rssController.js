/**
 * RSS订阅控制器
 * 处理与RSS订阅相关的HTTP请求
 */
import * as rssService from '../services/rssService.mjs';
import * as wechatService from '../services/wechatService.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

// 缓存变量
let articlesCache = {
  data: null,
  timestamp: null,
  ttl: 5 * 60 * 1000 // 5分钟缓存
};

// 缓存开关，默认关闭
let cacheEnabled = false;

/**
 * 获取所有RSS文章
 * @route GET /api/rss/articles
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getArticles(req, res, next) {
  try {
    const now = Date.now();
    const forceRefresh = req.query.refresh === 'true';
    const enableCache = req.query.cache === 'true';
    
    // 更新缓存开关状态
    if (enableCache) {
      cacheEnabled = true;
    } else if (req.query.cache === 'false') {
      cacheEnabled = false;
      // 清空缓存
      articlesCache = {
        data: null,
        timestamp: null,
        ttl: 5 * 60 * 1000
      };
    }
    
    // 检查缓存是否有效（仅当缓存启用时）
    if (cacheEnabled && 
        !forceRefresh && 
        articlesCache.data && 
        articlesCache.timestamp && 
        (now - articlesCache.timestamp < articlesCache.ttl)) {
      logger.info(`使用缓存数据，缓存时间: ${now - articlesCache.timestamp}ms`);
      return res.json({
        success: true,
        data: articlesCache.data,
        count: articlesCache.data.length,
        cached: true,
        cacheEnabled: true,
        timestamp: articlesCache.timestamp
      });
    }
    
    // 缓存无效或强制刷新，重新获取数据
    const startTime = Date.now();
    const articles = await rssService.fetchAllRssFeeds();
    const duration = Date.now() - startTime;
    
    // 更新缓存（仅当缓存启用时）
    if (cacheEnabled) {
      articlesCache = {
        data: articles,
        timestamp: now,
        ttl: 5 * 60 * 1000 // 5分钟缓存
      };
    }
    
    logger.info(`获取RSS文章完成，共${articles.length}篇，耗时${duration}ms`);
    
    res.json({
      success: true,
      data: articles,
      count: articles.length,
      cached: false,
      cacheEnabled,
      duration,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 从Supabase获取文章
 * @route GET /api/rss/articles/supabase
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getArticlesFromSupabase(req, res, next) {
  try {
    const {
      limit = 50,
      offset = 0,
      orderBy = 'pub_date',
      order = 'desc',
      source,
      startDate,
      endDate
    } = req.query;
    
    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      orderBy,
      order,
      source,
      startDate,
      endDate
    };
    
    const articles = await rssService.fetchArticlesFromSupabase(options);
    
    res.json({
      success: true,
      data: articles,
      count: articles.length,
      options,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 手动推送RSS文章到企业微信
 * @route POST /api/rss/push
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function pushArticlesToWeChat(req, res, next) {
  try {
    // 获取最新的RSS文章
    const allSources = await rssService.fetchAllRssFeeds();
    const latestArticles = allSources.filter((article, index) => index < 3);
    
    if (latestArticles.length === 0) {
      return res.json({
        success: true,
        message: '暂无新文章'
      });
    }
    console.log("11111111===========", latestArticles); 
    // 发送到企业微信
    const result = await wechatService.sendRssArticles(latestArticles, 'RSS订阅推送');
    // console.log("11111111===========", result); 
    if(result.errcode == 0){
      res.json({
        success: true,
        message: '推送成功',
        data: result,
        articlesCount: latestArticles.length
      });
    }else{
      res.json({
        success: false,
        message: '推送失败',
        data: result,
        articlesCount: latestArticles.length
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * 获取RSS订阅源健康状态
 * @route GET /api/rss/health
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getHealthStatus(req, res, next) {
  try {
    const health = await rssService.checkRSSHealth();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      feeds: config.feeds,
      health
    });
  } catch (error) {
    next(error);
  }
}

export {
  getArticles,
  getArticlesFromSupabase,
  pushArticlesToWeChat,
  getHealthStatus
};