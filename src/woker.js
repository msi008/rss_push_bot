// 示例：src/worker.js
export default {
  async fetch(request, env, ctx) {
    // 原来的 Express 逻辑不能直接整段拷进来，需要改造成“请求-响应”函数
    // 例如：
    const url = new URL(request.url)
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 })
    }
    return new Response('Not Found', { status: 404 })
  }
}