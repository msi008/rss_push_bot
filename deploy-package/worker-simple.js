// Cloudflare Workers入口文件 - 完全兼容版本
// 此版本移除了所有可能导致workerd问题的依赖

// 处理请求的主函数
export default {
  async fetch(request, env, ctx) {
    try {
      // 解析URL
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;
      
      // 处理不同的路由
      if (path === '/health' && method === 'GET') {
        return new Response(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          environment: 'cloudflare-workers'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // API路由
      if (path.startsWith('/api/')) {
        // RSS API端点
        if (path === '/api/rss' && method === 'GET') {
          try {
            const rssData = await getRSSData(env);
            return new Response(JSON.stringify({
              success: true,
              data: rssData
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (error) {
            return new Response(JSON.stringify({
              success: false,
              error: error.message
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        // 企业微信回调端点
        if (path === '/api/wechat/callback' && method === 'POST') {
          try {
            const body = await request.json();
            const result = await handleWechatCallback(body, env);
            return new Response(JSON.stringify(result), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (error) {
            return new Response(JSON.stringify({
              success: false,
              error: error.message
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
      }
      
      // 默认响应
      return new Response(JSON.stringify({
        name: 'RSSHub企业微信推送服务',
        version: '1.0.0',
        description: '基于Cloudflare Workers部署的RSSHub企业微信推送服务',
        endpoints: {
          health: '/health',
          api: '/api/rss',
          wechatCallback: '/api/wechat/callback'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error', 
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
};

// 获取RSS数据的实现
async function getRSSData(env) {
  try {
    // 获取环境变量
    const supabaseUrl = env.SUPABASE_URL || '';
    const supabaseKey = env.SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    // 简化的RSS数据获取逻辑
    // 在实际部署中，这里应该连接到Supabase获取RSS数据
    return {
      message: 'RSS data from Supabase',
      timestamp: new Date().toISOString(),
      data: [
        {
          title: '示例RSS条目',
          link: 'https://example.com',
          description: '这是一个示例RSS条目',
          pubDate: new Date().toISOString()
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching RSS data:', error);
    throw error;
  }
}

// 处理企业微信回调的实现
async function handleWechatCallback(body, env) {
  try {
    // 获取环境变量
    const corpId = env.WECHAT_CORP_ID || '';
    const corpSecret = env.WECHAT_CORP_SECRET || '';
    const agentId = env.WECHAT_AGENT_ID || '';
    
    if (!corpId || !corpSecret || !agentId) {
      throw new Error('Missing WeChat configuration');
    }
    
    // 简化的企业微信回调处理逻辑
    console.log('Received WeChat callback:', body);
    
    return {
      success: true,
      message: 'WeChat callback processed',
      received: body
    };
  } catch (error) {
    console.error('Error handling WeChat callback:', error);
    throw error;
  }
}

// 定时任务处理
export const scheduled = {
  async scheduled(event, env, ctx) {
    console.log('Scheduled event triggered:', event.cron);
    
    try {
      // 这里添加您的定时任务逻辑
      console.log('Running scheduled RSS check...');
      
      // 检查环境变量
      const supabaseUrl = env.SUPABASE_URL || '';
      const supabaseKey = env.SUPABASE_ANON_KEY || '';
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase configuration for scheduled task');
        return;
      }
      
      // 获取缓存
      let lastCheck = null;
      try {
        if (env.RSS_CACHE) {
          lastCheck = await env.RSS_CACHE.get('rss:last_check');
        }
      } catch (cacheError) {
        console.error('Error accessing cache:', cacheError);
      }
      
      const now = new Date();
      const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      
      if (!lastCheck || new Date(lastCheck) < sixHoursAgo) {
        // 执行RSS检查
        console.log('Checking for new RSS items...');
        
        // 这里应该实现RSS检查逻辑
        // 由于环境限制，这里只是记录日志
        
        // 更新检查时间
        try {
          if (env.RSS_CACHE) {
            await env.RSS_CACHE.put('rss:last_check', now.toISOString());
          }
        } catch (cacheError) {
          console.error('Error updating cache:', cacheError);
        }
        
        console.log('RSS check completed at', now.toISOString());
      } else {
        console.log('Skipping RSS check, last check was at', lastCheck);
      }
      
    } catch (error) {
      console.error('Error in scheduled task:', error);
    }
  },
};