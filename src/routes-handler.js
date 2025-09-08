/**
 * 通用路由与业务处理，完全遵循 Web 标准
 * 在 Cloudflare Workers、Vercel Functions 均可复用
 */
/**
 * @param {Object} env - 环境绑定（KV/AI/D1 等）
 */
export async function handleHealth() {
  return new Response('OK', { status: 200 });
}

/**
 * @param {string} rssUrl - RSS 源地址
 * @param {string} webhook - 企业微信机器人地址
 */
export async function handleRssPush(rssUrl, webhook) {
  const entries = await fetchRssItems(rssUrl);
  await pushToWechat(entries, webhook);
  return new Response('推送完成', { status: 200 });
}

/**
 * 纯 JS 版简易 RSS 解析（无 DOM 依赖，使用纯字符串解析）
 */
async function fetchRssItems(rssUrl) {
  const res = await fetch(rssUrl);
  if (!res.ok) throw new Error(`RSS 获取失败 ${res.status}`);
  // 这里写你最熟知的「字符串/正则」解析或集成 lightweight RSS 库
  // 示例返回格式：
  return [{ title: '示例标题', link: 'https://example.com/1' }];
}

/**
 * 推送函数
 */
async function pushToWechat(entries, webhook) {
  if (!webhook) throw new Error('未配置企业微信机器人');
  const body = JSON.stringify({
    msgtype: 'text',
    text: { content: entries.map(e => `📌 ${e.title}\n🔗 ${e.link}`).join('\n\n') }
  });
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  if (!res.ok) throw new Error(`企业微信推送失败 ${res.status}`);
}