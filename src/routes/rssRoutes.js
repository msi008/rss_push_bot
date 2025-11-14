/**
 * RSS相关路由定义
 * 定义所有与RSS订阅和推送相关的API端点
 */
import express from 'express';
import * as rssController from '../controllers/rssController.js';

const router = express.Router();

/**
 * @route GET /api/rss/articles
 * @description 获取所有RSS文章
 * @access 公开
 */
router.get('/articles', rssController.getArticles);

/**
 * @route GET /api/rss/articles/supabase
 * @description 从Supabase获取文章
 * @access 公开
 */
router.get('/articles/supabase', rssController.getArticlesFromSupabase);

/**
 * @route POST /api/rss/push
 * @description 手动推送RSS文章到企业微信
 * @access 公开
 */
router.post('/push', rssController.pushArticlesToWeChat);

router.get('/push', rssController.pushArticlesToWeChat);

/**
 * @route GET /api/rss/health
 * @description 获取RSS订阅源健康状态
 * @access 公开
 */
// 统一函数名调用
router.get('/health', rssController.getHealthStatus);
// 统一函数名调用（无需修改，已经正确引用pushArticlesToWeChat）
router.post('/push', rssController.pushArticlesToWeChat);

/**
 * @route GET /api/rss/status
 * @description 获取应用状态信息
 * @access 公开
 */
router.get('/status', async (req, res) => {
  const configModule = await import('../config/config.js');
  const schedulerModule = await import('../services/scheduler.js');
  const config = configModule.default;
  const scheduler = schedulerModule;
  
  res.json({
    success: true,
    data: {
      name: 'RSSHub企业微信推送服务',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      config: {
        scheduler: {
          enabled: config.scheduler.enabled,
          cron: config.scheduler.cron,
          timezone: config.scheduler.timezone
        },
        wechatBot: {
          enabled: !!config.wxRobot.key,
          baseUrl: config.wxRobot.url
        },
        rssSources: config.feeds.length
      },
      scheduler: scheduler.getSchedulerStatus()
    }
  });
});

export default router;