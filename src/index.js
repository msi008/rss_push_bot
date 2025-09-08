import {
  handleHealth,
  handleRssPush
} from './routes-handler.js';

/**
 * Cloudflare Workers ES Module 入口
 * 要求：export default 必须返回含 `fetch` 方法的对象
 */
export default {
  /**
   * 每个 HTTP 请求都会调用此方法
   * @param {Request}  request
   * @param {Object}   env   - wrangler.toml 中声明的 KV/vars 等
   * @param {ExecutionContext} ctx - 用于 waitUntil 等生命周期控制
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // 1. 健康检查
    if (url.pathname === '/health' && method === 'GET') {
      return handleHealth();
    }

    // 2. 手动 RSS 推送接口
    if (url.pathname === '/push' && method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body || !body.rss || !body.webhook) {
        return new Response('缺少 rss 和 webhook 字段', { status: 400 });
      }
      // 在 Workers 里从 env 读取解析参数
      const rssUrl  = body.rss;
      const webhook = body.webhook;
      try {
        return await handleRssPush(rssUrl, webhook);
      } catch (err) {
        return new Response(err.message, { status: 500 });
      }
    }

    return new Response('not found', { status: 404 });
  },

  /**
   * 如需定时触发（Cron Trigger）请添加 scheduled 方法
   */
  async scheduled(event, env, ctx) {
    const rssUrl = env.RSS_FEEDS?.split(',')[0];  // 从 wrangler.toml vars 里读取
    const webhook = env.WECHAT_WEBHOOK;
    if (!rssUrl || !webhook) {
      console.log('⚠️ 缺少 RSS_FEEDS / WECHAT_WEBHOOK，跳过定时任务');
      return;
    }
    // 复用同一份逻辑
    try {
      await handleRssPush(rssUrl, webhook);
      console.log('✅ 定时推送完成');
    } catch(err) {
      console.error('定时推送失败:', err);
    }
  }
};