import Exa from 'exa-js';

// 获取环境变量中的API密钥
const apiKey = process.env.EXA_API_KEY;

export async function POST(req: Request) {
  // 确保API密钥已配置
  if (!apiKey) {
    return new Response("Exa API密钥未配置", { status: 500 });
  }

  try {
    // 解析请求体
    const { query } = await req.json();

    // 确保提供了查询参数
    if (!query || typeof query !== 'string') {
      return new Response("请提供有效的搜索查询", { status: 400 });
    }

    // 初始化Exa客户端
    const exaClient = new Exa(apiKey);

    // 调用Exa搜索API
    const searchResults = await exaClient.search(query, {
      numResults: 5,  // 返回5条结果
    });

    // 返回搜索结果
    return new Response(JSON.stringify(searchResults), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("搜索API路由错误:", error);
    return new Response("处理搜索请求时出错", { status: 500 });
  }
} 