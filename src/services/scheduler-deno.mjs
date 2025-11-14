/**
 * 定时任务调度服务 - Deno版本
 * 使用Deno内置API实现RSS订阅和推送的定时执行
 */
import * as rssService from './rssService.mjs';
import * as wechatService from './wechatService.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

/**
 * 最后一次推送的文章链接集合，用于去重
 */
let pushedLinks = new Set();

/**
 * 定时任务实例
 */
let cronJob = null;

/**
 * 初始化定时任务
 */
function initializeScheduler() {
  if (!config.scheduler.enabled) {
    logger.info('定时任务已禁用');
    return null;
  }
  
  try {
    // 使用Deno.cron API创建定时任务（Deno 1.30+）
    if (typeof Deno?.cron === 'function') {
      cronJob = Deno.cron("rss-push", config.scheduler.cron, async () => {
        await performScheduledPush();
      });
      
      logger.info(`📅 定时任务已启动: ${config.scheduler.cron} (${config.scheduler.timezone})`);
      logger.info('使用Deno.cron API实现定时任务');
    } else {
      // 回退到setInterval实现
      const intervalMs = getCronIntervalMs(config.scheduler.cron);
      if (intervalMs > 0) {
        cronJob = setInterval(async () => {
          await performScheduledPush();
        }, intervalMs);
        
        logger.info(`📅 定时任务已启动，每${intervalMs/1000/60}分钟执行一次`);
        logger.info('使用setInterval API实现定时任务（Deno.cron不可用）');
      } else {
        logger.error('无法解析cron表达式，定时任务启动失败');
        return null;
      }
    }
    
    return cronJob;
  } catch (error) {
    logger.error('初始化定时任务失败:', error);
    return null;
  }
}

/**
 * 将cron表达式转换为毫秒间隔（简化版本，仅支持部分常见表达式）
 * @param {string} cronExpression - cron表达式
 * @returns {number} 毫秒间隔
 */
function getCronIntervalMs(cronExpression) {
  // 简单解析常见cron表达式
  // 每分钟: "* * * * *" -> 60000ms
  if (cronExpression === "* * * * *") return 60000;
  
  // 每小时: "0 * * * *" -> 3600000ms
  if (cronExpression === "0 * * * *") return 3600000;
  
  // 每天: "0 0 * * *" -> 86400000ms
  if (cronExpression === "0 0 * * *") return 86400000;
  
  // 每周: "0 0 * * 0" -> 604800000ms
  if (cronExpression === "0 0 * * 0") return 604800000;
  
  // 尝试解析小时间隔，如 "*/30 * * * *" -> 30分钟
  const hourMatch = cronExpression.match(/^\*\/(\d+) \* \* \* \*$/);
  if (hourMatch) {
    return parseInt(hourMatch[1]) * 60 * 1000;
  }
  
  // 默认返回1小时间隔
  return 3600000;
}

/**
 * 执行计划的RSS推送任务
 */
async function performScheduledPush() {
  try {
    logger.info('开始执行计划的RSS推送任务');
    
    const articles = await rssService.fetchAllRssFeeds();
    
    if (articles.length === 0) {
      logger.info('当前没有新的RSS文章，跳过推送');
      return;
    }
    
    // 过滤掉已经推送过的文章
    const newArticles = articles.filter(article => 
      !pushedLinks.has(article.link) && 
      !pushedLinks.has(article.guid)
    );
    
    if (newArticles.length === 0) {
      logger.info('没有新的未推送文章，跳过推送');
      return;
    }
    
    // 将所有新文章添加到已推送集合
    newArticles.forEach(article => {
      pushedLinks.add(article.link);
      if (article.guid) pushedLinks.add(article.guid);
    });
    
    // 定期清理旧的链接记录（保留最近10000条）
    if (pushedLinks.size > 10000) {
      const links = Array.from(pushedLinks);
      pushedLinks = new Set(links.slice(-5000));
    }
    
    //await wechatService.sendRssArticles(newArticles);
    
    //logger.info(`成功推送${newArticles.length}篇新文章到企业微信`);
    
  } catch (error) {
    logger.error('执行计划的RSS推送任务失败:', {
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * 立即执行一次推送任务（手动触发）
 */
async function triggerImmediatePush() {
  return performScheduledPush();
}

/**
 * 停止定时任务
 */
function stopScheduler() {
  if (cronJob) {
    if (typeof cronJob === 'number') {
      // setInterval返回的ID
      clearInterval(cronJob);
    } else if (typeof cronJob?.close === 'function') {
      // Deno.cron返回的对象
      cronJob.close();
    }
    cronJob = null;
    logger.info('定时任务已停止');
  }
}

/**
 * 获取定时任务状态
 * @returns {Object} 任务状态信息
 */
function getSchedulerStatus() {
  return {
    enabled: config.scheduler.enabled,
    cron: config.scheduler.cron,
    timezone: config.scheduler.timezone,
    lastPushedCount: pushedLinks.size,
    started: cronJob !== null,
    usingDenoCron: typeof Deno?.cron === 'function'
  };
}

export {
  initializeScheduler,
  triggerImmediatePush,
  stopScheduler,
  getSchedulerStatus
};