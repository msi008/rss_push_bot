/**
 * 定时任务调度服务
 * 使用node-cron实现RSS订阅和推送的定时执行
 */
const cron = require('node-cron');
const rssService = require('./rssService');
const wechatService = require('./wechatService');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * 最后一次推送的文章链接集合，用于去重
 */
let pushedLinks = new Set();

/**
 * 初始化定时任务
 */
function initializeScheduler() {
  // 每小时执行一次RSS订阅和推送任务
  const scheduledJob = cron.schedule(
    config.scheduler.cron,
    performScheduledPush,
    {
      scheduled: config.scheduler.enabled,
      timezone: config.scheduler.timezone
    }
  );
  
  logger.info(`定时任务已启动: ${config.scheduler.cron}`);
  
  if (config.scheduler.enabled) {
    logger.info(`📅 定时任务时间: ${config.scheduler.cron} (${config.scheduler.timezone})`);
  }
  
  return scheduledJob;
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
    
    await wechatService.sendRssArticles(newArticles);
    
    logger.info(`成功推送${newArticles.length}篇新文章到企业微信`);
    
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
 * 获取定时任务状态
 * @returns {Object} 任务状态信息
 */
function getSchedulerStatus() {
  return {
    enabled: config.schedule.enabled,
    cron: config.schedule.cronExpression,
    timezone: config.schedule.timezone,
    lastPushedCount: pushedLinks.size,
    started: true
  };
}

module.exports = {
  initializeScheduler,
  triggerImmediatePush,
  getSchedulerStatus
};