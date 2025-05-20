import { NextRequest, NextResponse } from 'next/server';
import Exa from 'exa-js';

export const runtime = 'edge'; // 使用 Vercel Edge Runtime 以获得最佳性能

export async function POST(req: NextRequest) {
  try {
    // 检查 EXA_API_KEY 是否已设置
    if (!process.env.EXA_API_KEY) {
      return NextResponse.json(
        { error: '缺少 EXA_API_KEY 环境变量。' },
        { status: 500 }
      );
    }

    // 解析请求体
    const body = await req.json();
    const { query, ...otherParams } = body;

    // 验证必需的查询参数
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '请求缺少有效的 query 参数。' },
        { status: 400 }
      );
    }

    // 初始化 Exa 客户端
    const exa = new Exa(process.env.EXA_API_KEY);

    // 调用 Exa 搜索 API
    // 这里使用 search 方法，而不是 searchAndContents，因为我们只需要基本搜索结果
    // 如果需要获取网页内容，可以使用 searchAndContents 方法
    const searchResults = await exa.search(query, {
      // 可以传递其他可选参数，如 numResults, type 等
      // 这些参数可以从请求体中获取
      ...otherParams,
      // 默认获取文本内容
      text: true,
    });

    // 返回搜索结果
    return NextResponse.json(searchResults);

  } catch (error) {
    console.error('[API SEARCH POST Error]', error);

    // 处理特定类型的错误
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: '请求体中的 JSON 格式无效。' },
        { status: 400 }
      );
    }

    // 处理 API 密钥错误
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'Exa API 密钥无效或已过期。' },
        { status: 401 }
      );
    }

    // 处理 Exa API 请求错误
    if (error instanceof Error && error.message.includes('rate')) {
      return NextResponse.json(
        { error: '已超过 Exa API 的速率限制。' },
        { status: 429 }
      );
    }

    // 通用错误处理
    return NextResponse.json(
      { error: '处理搜索请求时发生内部服务器错误。' },
      { status: 500 }
    );
  }
} 