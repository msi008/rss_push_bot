/**
 * RSS相关路由定义
 * 定义所有与RSS订阅和推送相关的API端点
 */
const express = require('express');
const rssController = require('../controllers/rssController');

const router = express.Router();

/**
 * @route GET /api/rss/articles
 * @description 获取所有RSS文章
 * @access 公开
 */
router.get('/articles', rssController.getArticles);

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
router.get('/status', (req, res) => {
  const config = require('../config/config');
  const scheduler = require('../services/scheduler');
  
  res.json({
    success: true,
    data: {
      name: 'RSSHub企业微信推送服务',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      config: {
        schedule: config.schedule,
        wechatBot: {
          enabled: !!config.wechat.botKey,
          endpoints: config.wechat.endpoints.length
        },
        rssSources: config.rsshub.sources.length
      },
      scheduler: scheduler.getSchedulerStatus()
    }
  });
});

module.exports = router;