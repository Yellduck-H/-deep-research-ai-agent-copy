import { Message, streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { createDeepSeek } from '@ai-sdk/deepseek'; // 导入 DeepSeek provider

export const runtime = 'edge'; // 推荐用于 AI SDK 的 Vercel Edge Runtime

// 初始化 DeepSeek Provider
// 请确保在环境变量中设置了 DEEPSEEK_API_KEY
const deepseekProvider = createDeepSeek({
  // apiKey 将从 process.env.DEEPSEEK_API_KEY 读取
  // 如果 apiKey 未在此处提供，它会默认查找 DEEPSEEK_API_KEY
  // 为明确起见，我们也可以直接传递: apiKey: process.env.DEEPSEEK_API_KEY
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'Missing DEEPSEEK_API_KEY in environment variables.' },
        { status: 500 }
      );
    }
    const { messages }: { messages: Message[] } = await req.json();

    const result = await streamText({
      model: deepseekProvider.chat('deepseek-chat'), // 使用 DeepSeek 模型
      messages,
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error('[API CHAT POST Error]', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    // 更通用的错误处理
    return NextResponse.json({ error: 'Internal Server Error from API' }, { status: 500 });
  }
} 