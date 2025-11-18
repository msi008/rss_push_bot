// Cloudflare Workers入口文件
import { Request, Response } from '@cloudflare/workers-types';

// 处理请求的主函数
export default {
  async fetch(request, env, ctx) {
    try {
      // 设置环境变量
      globalThis.SUPABASE_URL = env.SUPABASE_URL || '';
      globalThis.SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || '';
      globalThis.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY || '';
      globalThis.WECHAT_CORP_ID = env.WECHAT_CORP_ID || '';
      globalThis.WECHAT_CORP_SECRET = env.WECHAT_CORP_SECRET || '';
      globalThis.WECHAT_AGENT_ID = env.WECHAT_AGENT_ID || '';
      globalThis.RSSHUB_URL = env.RSSHUB_URL || 'https://rsshub.app';
      
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
        const contentType = headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          body = await request.json();
        } else {
          body = await request.text();
        }
      }
      
      // 处理请求
      const response = await handleRequest({
        method,
        url: url.pathname + url.search,
        headers,
        body,
        query: Object.fromEntries(url.searchParams.entries()),
        params: {},
      }, env);
      
      // 返回Cloudflare Workers响应
      return new Response(JSON.stringify(response.body), {
        status: response.statusCode,
        headers: {
          'Content-Type': 'application/json',
          ...response.headers,
        },
      });
      
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

// 请求处理函数
async function handleRequest(req, env) {
  const { url, method } = req;
  
  // 健康检查端点
  if (url === '/health' && method === 'GET') {
    return {
      statusCode: 200,
      headers: {},
      body: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: 'cloudflare-workers'
      }
    };
  }
  
  // API路由
  if (url.startsWith('/api/') && method === 'GET') {
    // RSS API端点
    if (url === '/api/rss') {
      try {
        // 这里应该调用RSS服务获取数据
        // 由于Cloudflare Workers环境限制，我们需要简化实现
        const rssData = await getRSSData(env);
        return {
          statusCode: 200,
          headers: {},
          body: {
            success: true,
            data: rssData
          }
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers: {},
          body: {
            success: false,
            error: error.message
          }
        };
      }
    }
    
    // 企业微信回调端点
    if (url === '/api/wechat/callback' && method === 'POST') {
      try {
        // 处理企业微信回调
        const result = await handleWechatCallback(req.body, env);
        return {
          statusCode: 200,
          headers: {},
          body: result
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers: {},
          body: {
            success: false,
            error: error.message
          }
        };
      }
    }
  }
  
  // 默认响应
  return {
    statusCode: 200,
    headers: {},
    body: {
      name: 'RSSHub企业微信推送服务',
      version: '1.0.0',
      description: '基于Cloudflare Workers部署的RSSHub企业微信推送服务',
      endpoints: {
        health: '/health',
        api: '/api/rss',
        wechatCallback: '/api/wechat/callback'
      }
    }
  };
}

// 获取RSS数据的简化实现
async function getRSSData(env) {
  // 这里应该实现RSS数据获取逻辑
  // 由于环境限制，这里返回一个示例响应
  return {
    message: 'RSS data - needs implementation',
    timestamp: new Date().toISOString()
  };
}

// 处理企业微信回调的简化实现
async function handleWechatCallback(body, env) {
  // 这里应该实现企业微信回调处理逻辑
  return {
    message: 'WeChat callback - needs implementation',
    received: body
  };
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
        
        // 这里应该实现RSS检查逻辑
        // 由于环境限制，这里只是记录日志
        
        // 更新检查时间
        await env.RSS_CACHE.put(cacheKey, now);
        console.log('RSS check completed at', now);
      } else {
        console.log('Skipping RSS check, last check was at', lastCheck);
      }
      
    } catch (error) {
      console.error('Error in scheduled task:', error);
    }
  },
};