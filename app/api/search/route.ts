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
    const body = await req.json();
    const { query, numResults = 5, includeText = true } = body;

    // 确保提供了查询参数
    if (!query || typeof query !== 'string') {
      return new Response("请提供有效的搜索查询", { status: 400 });
    }

    console.log(`执行搜索: "${query}", 结果数量: ${numResults}`);

    // 初始化Exa客户端
    const exaClient = new Exa(apiKey);

    // 调用Exa搜索API
    const searchOptions = {
      numResults: Number(numResults),
      includeDomains: body.includeDomains || undefined,
      excludeDomains: body.excludeDomains || undefined,
      startPublishedDate: body.startPublishedDate || undefined,
      endPublishedDate: body.endPublishedDate || undefined,
    };

    const searchResults = await exaClient.search(query, searchOptions);
    console.log(`搜索完成，找到 ${searchResults.results.length} 条结果`);

    // 格式化为前端友好的格式
    const formattedResults = searchResults.results.map(result => ({
      title: result.title || '无标题',
      url: result.url,
      publishedDate: result.publishedDate || null,
      author: result.author || null,
      text: includeText ? (result.text || '无可用内容') : undefined,
    }));

    // 返回搜索结果
    return new Response(JSON.stringify({
      query,
      count: formattedResults.length,
      results: formattedResults
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("搜索API路由错误:", error);
    
    // 返回格式化的错误信息
    const errorMessage = error instanceof Error ? error.message : "处理搜索请求时出错";
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 