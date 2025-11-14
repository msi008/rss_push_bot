const rssService = require('./rssService.mjs');
const config = require('../config/config');

describe('rssService', () => {
  // 保存原始配置，以便在测试后恢复
  const originalBaseUrl = config.service.baseUrl;

  beforeAll(() => {
    // 设置一个测试用的baseUrl
    config.service.baseUrl = 'http://localhost:1200';
  });

  afterAll(() => {
    // 恢复原始配置
    config.service.baseUrl = originalBaseUrl;
  });

  describe('fetchRssFeed', () => {
    test('应该正确处理 rsshub:// 协议并拼接 URL', async () => {
      const source = 'rsshub://36kr/hot-list';
      const expectedUrl = 'http://localhost:1200/36kr/hot-list';

      // 模拟 fetchRssFeed 内部的 parseURL 调用
      // 由于 parseURL 是异步的，我们需要模拟它的行为
      // 这里我们只关注 URL 的拼接是否正确，不实际发起网络请求
      const originalParseURL = rssService.__get__('parser').parseURL;
      rssService.__get__('parser').parseURL = jest.fn(async (url) => {
        expect(url).toBe(expectedUrl);
        return { items: [] }; // 返回一个空数组，避免后续处理报错
      });

      await rssService.fetchRssFeed(source);

      // 恢复原始 parseURL
      rssService.__get__('parser').parseURL = originalParseURL;
    });

    test('应该正确处理 rsshub:// 协议，即使 baseUrl 带有斜杠', async () => {
      const originalBaseUrlWithSlash = config.service.baseUrl;
      config.service.baseUrl = 'http://localhost:1200/';

      const source = 'rsshub://36kr/hot-list';
      const expectedUrl = 'http://localhost:1200/36kr/hot-list';

      const originalParseURL = rssService.__get__('parser').parseURL;
      rssService.__get__('parser').parseURL = jest.fn(async (url) => {
        expect(url).toBe(expectedUrl);
        return { items: [] };
      });

      await rssService.fetchRssFeed(source);

      rssService.__get__('parser').parseURL = originalParseURL;
      config.service.baseUrl = originalBaseUrlWithSlash;
    });

    test('应该正确处理 rsshub:// 协议，即使 source 带有斜杠', async () => {
      const source = 'rsshub:///36kr/hot-list';
      const expectedUrl = 'http://localhost:1200/36kr/hot-list';

      const originalParseURL = rssService.__get__('parser').parseURL;
      rssService.__get__('parser').parseURL = jest.fn(async (url) => {
        expect(url).toBe(expectedUrl);
        return { items: [] };
      });

      await rssService.fetchRssFeed(source);

      rssService.__get__('parser').parseURL = originalParseURL;
    });
  });
});