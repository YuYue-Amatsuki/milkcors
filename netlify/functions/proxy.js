// netlify/functions/proxy.js
export async function handler(event, context) {
  // 处理预检请求（OPTIONS）
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204, // No Content
      headers: {
        'Access-Control-Allow-Origin': 'https://yuyue-amatsuki.github.io',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', // 根据实际需要添加
        'Access-Control-Max-Age': '86400', // 预检结果缓存 24 小时
      },
      body: '',
    };
  }

  // 只允许 GET 和 POST（可根据需要添加其他方法）
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': 'https://yuyue-amatsuki.github.io' },
      body: 'Method Not Allowed',
    };
  }

  try {
    // 从请求路径中提取实际要请求的 API 路径
    // 假设请求的是 /.netlify/functions/proxy/getdata 或 /.netlify/functions/proxy/some-post-endpoint
    const path = event.path.replace('/.netlify/functions/proxy/', '');
    const targetUrl = `https://api.milkbot.cn/server/api/${path}`;

    // 准备传递给目标 API 的请求参数
    const fetchOptions = {
      method: event.httpMethod,
      headers: {
        // 转发一些必要的请求头（可根据需要筛选）
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0',
      },
    };

    // 如果是 POST，添加请求体和 Content-Type
    if (event.httpMethod === 'POST') {
      // 解析前端传来的 Content-Type，默认使用 application/json
      const contentType = event.headers['content-type'] || 'application/json';
      fetchOptions.headers['Content-Type'] = contentType;

      // 将请求体原样转发（event.body 已经是字符串）
      fetchOptions.body = event.body;
    }

    // 发起请求到目标 API
    const response = await fetch(targetUrl, fetchOptions);

    // 读取响应数据（根据 Content-Type 决定使用 text() 或 json()，这里统一用 text() 避免解析失败）
    const data = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        // 添加 CORS 头，允许你的 GitHub Pages 域名
        'Access-Control-Allow-Origin': 'https://yuyue-amatsuki.github.io',
        // 如果需要支持携带凭证（cookies），取消下一行注释
        // 'Access-Control-Allow-Credentials': 'true',
      },
      body: data,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://yuyue-amatsuki.github.io',
      },
      body: JSON.stringify({ error: 'Proxy failed: ' + error.message }),
    };
  }
}
