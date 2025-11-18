// Cloudflare Workers入口文件
import { Request, Response } from '@cloudflare/workers-types';

// 导入Express应用适配器
import { app } from './src/app.js';

// 处理请求的主函数
export default {
  async fetch(request, env, ctx) {
    try {
      // 设置环境变量
      process.env.SUPABASE_URL = env.SUPABASE_URL || '';
      process.env.SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || '';
      process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || '';
      process.env.WECHAT_CORP_ID = env.WECHAT_CORP_ID || '';
      process.env.WECHAT_CORP_SECRET = env.WECHAT_CORP_SECRET || '';
      process.env.WECHAT_AGENT_ID = env.WECHAT_AGENT_ID || '';
      process.env.RSSHUB_URL = env.RSSHUB_URL || 'https://rsshub.app';
      
      // 创建请求和响应对象
      const url = new URL(request.url);
      const method = request.method;
      const headers = {};
      
      // 复制请求头
      request.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      // 获取请求体
      let body = null;
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        body = await request.text();
      }
      
      // 创建模拟的Express请求和响应对象
      const req = {
        method,
        url: url.pathname + url.search,
        headers,
        body,
        query: Object.fromEntries(url.searchParams.entries()),
        params: {},
        // 其他Express请求对象属性...
      };
      
      const res = {
        statusCode: 200,
        headers: {},
        body: '',
        
        status(code) {
          this.statusCode = code;
          return this;
        },
        
        json(data) {
          this.headers['Content-Type'] = 'application/json';
          this.body = JSON.stringify(data);
          return this;
        },
        
        send(data) {
          this.body = data;
          return this;
        },
        
        setHeader(name, value) {
          this.headers[name] = value;
          return this;
        },
        
        // 其他Express响应对象方法...
      };
      
      // 处理请求
      await new Promise((resolve, reject) => {
        // 这里需要适配Express应用以在Cloudflare Workers中运行
        // 由于Express和Cloudflare Workers的API不同，可能需要使用适配器库
        // 如@cloudflare/worker-express或重写部分路由逻辑
        
        // 临时解决方案：直接处理API路由
        handleRequest(req, res);
        resolve();
      });
      
      // 返回Cloudflare Workers响应
      return new Response(res.body, {
        status: res.statusCode,
        headers: res.headers,
      });
      
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

// 临时请求处理函数
async function handleRequest(req, res) {
  const { url, method } = req;
  
  // 健康检查端点
  if (url === '/health' && method === 'GET') {
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 0,
      environment: 'cloudflare-workers'
    });
  }
  
  // API路由
  if (url.startsWith('/api/') && method === 'GET') {
    // 这里需要导入并使用您的路由逻辑
    // 由于Cloudflare Workers环境限制，可能需要重写部分服务逻辑
    return res.json({ message: 'API endpoint - needs implementation' });
  }
  
  // 默认响应
  return res.json({
    name: 'RSSHub企业微信推送服务',
    version: '1.0.0',
    description: '基于Cloudflare Workers部署的RSSHub企业微信推送服务',
    endpoints: {
      health: '/health',
      api: '/api/rss'
    }
  });
}

// 定时任务处理
export const scheduled = {
  async scheduled(event, env, ctx) {
    console.log('Scheduled event triggered:', event.cron);
    
    try {
      // 这里添加您的定时任务逻辑
      // 例如：检查RSS源并发送通知
      console.log('Running scheduled RSS check...');
      
      // 示例：获取RSS缓存
      const cacheKey = 'rss:last_check';
      const lastCheck = await env.RSS_CACHE.get(cacheKey);
      const now = new Date().toISOString();
      
      if (!lastCheck || (new Date(now) - new Date(lastCheck)) > 6 * 60 * 60 * 1000) {
        // 执行RSS检查
        console.log('Checking for new RSS items...');
        
        // 更新检查时间
        await env.RSS_CACHE.put(cacheKey, now);
      }
      
    } catch (error) {
      console.error('Error in scheduled task:', error);
    }
  },
};