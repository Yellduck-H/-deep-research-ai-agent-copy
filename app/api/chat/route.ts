import { Message, streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { createDeepSeek } from '@ai-sdk/deepseek'; // 导入 DeepSeek provider
import Exa from 'exa-js'; // 导入 Exa SDK

export const runtime = 'edge'; // 推荐用于 AI SDK 的 Vercel Edge Runtime

// 初始化 DeepSeek Provider
// 请确保在环境变量中设置了 DEEPSEEK_API_KEY
const deepseekProvider = createDeepSeek({
  // apiKey 将从 process.env.DEEPSEEK_API_KEY 读取
  // 如果 apiKey 未在此处提供，它会默认查找 DEEPSEEK_API_KEY
  // 为明确起见，我们也可以直接传递: apiKey: process.env.DEEPSEEK_API_KEY
});

// 初始化 Exa 客户端
// 注意：这里我们只声明，但在实际使用时才会创建实例
// 这样可以避免在不需要搜索时也初始化 Exa 客户端
let exaClient: Exa | null = null;

// 系统提示，指导 LLM 扮演研究助手的角色
const SYSTEM_PROMPT = `你是一个专业的研究助手，能够进行深入分析、提出澄清问题，并在需要时生成搜索查询。
当你需要查找最新信息或特定事实时，请使用以下格式来指示需要搜索：[SEARCH: 你的搜索查询]
例如：[SEARCH: 2023年人工智能领域的突破性研究]
我会根据你的搜索查询获取相关信息，然后你可以基于这些信息提供更全面的回答。`;

// 从 LLM 响应中提取搜索查询的函数
function extractSearchQuery(content: string): string | null {
  // 使用正则表达式匹配 [SEARCH: xxx] 格式的内容
  const match = content.match(/\[SEARCH:\s*(.*?)\]/);
  return match ? match[1].trim() : null;
}

export async function POST(req: NextRequest) {
  // console.log('[API CHAT DEBUG] Received request to /api/chat');
  try {
    // 检查必要的环境变量
    if (!process.env.DEEPSEEK_API_KEY) {
      // console.error('[API CHAT DEBUG] DEEPSEEK_API_KEY is missing');
      return NextResponse.json(
        { error: 'Missing DEEPSEEK_API_KEY in environment variables.' },
        { status: 500 }
      );
    }
    // console.log('[API CHAT DEBUG] DEEPSEEK_API_KEY is present');

    // 解析请求体
    const { messages }: { messages: Message[] } = await req.json();
    // console.log('[API CHAT DEBUG] Request body parsed:', messages);

    // 第一步：LLM 初步分析
    const messagesWithSystemPrompt: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT } as Message,
      ...messages
    ];
    // console.log('[API CHAT DEBUG] Messages for initial LLM call:', messagesWithSystemPrompt);

    // 调用 LLM 进行初步分析
    // console.log('[API CHAT DEBUG] Calling initial streamText...');
    const initialAnalysisResult = await streamText({
      model: deepseekProvider.chat('deepseek-chat'),
      messages: messagesWithSystemPrompt,
    });
    // console.log('[API CHAT DEBUG] Initial streamText call completed.');

    // ---- 修改：尝试直接读取 textStream ----
    let accumulatedText = "";
    // console.log('[API CHAT DEBUG] Starting to read textStream directly...');
    try {
      for await (const textPart of initialAnalysisResult.textStream) {
        // console.log('[API CHAT DEBUG] Stream textPart received:', textPart);
        accumulatedText += textPart;
      }
      // console.log('[API CHAT DEBUG] Stream finished.');
    } catch (streamError) {
      // console.error('[API CHAT DEBUG] Error while reading textStream directly:', streamError);
    }
    // console.log('[API CHAT DEBUG] Accumulated text from stream:', accumulatedText);
    const initialResponse = accumulatedText; // 使用累积的文本
    // ---- 结束修改 ----
    
    // console.log('[API CHAT DEBUG] Awaiting initialAnalysisResult.text...'); // 注释掉原来的 .text
    // const initialResponse = await initialAnalysisResult.text; // 注释掉原来的 .text
    // console.log('[API CHAT DEBUG] initialResponse (from direct stream read) received:', initialResponse);
    
    // 第二步：识别搜索需求
    const searchQuery = extractSearchQuery(initialResponse);
    // console.log('[API CHAT DEBUG] Extracted search query:', searchQuery);
    
    // 如果没有识别到搜索查询，直接返回初始分析结果
    if (!searchQuery) {
      // console.log('[API CHAT DEBUG] No search query found. Returning initialAnalysisResult.toDataStreamResponse().');
      return initialAnalysisResult.toDataStreamResponse();
    }
    
    // 第三步：调用搜索 API（如果识别到了搜索查询）
    // console.log(`[API CHAT DEBUG] Search query identified: ${searchQuery}`);
    
    // 检查 EXA_API_KEY
    if (!process.env.EXA_API_KEY) {
      // console.error('[API CHAT DEBUG] EXA_API_KEY is missing, skipping search');
      // console.log('[API CHAT DEBUG] Returning initialAnalysisResult.toDataStreamResponse() due to missing EXA_API_KEY.');
      return initialAnalysisResult.toDataStreamResponse();
    }
    // console.log('[API CHAT DEBUG] EXA_API_KEY is present.');
    
    try {
      // 初始化 Exa 客户端（如果还没有初始化）
      if (!exaClient) {
        // console.log('[API CHAT DEBUG] Initializing Exa client...');
        exaClient = new Exa(process.env.EXA_API_KEY);
        // console.log('[API CHAT DEBUG] Exa client initialized.');
      }
      
      // 调用 Exa 搜索 API
      // console.log(`[API CHAT DEBUG] Calling Exa search with query: "${searchQuery}"`);
      const searchResults = await exaClient.search(searchQuery, {
        numResults: 3,
      });
      // console.log('[API CHAT DEBUG] Exa search completed. Results:', searchResults);
      
      const formattedSearchResults = searchResults.results.map((result, index) => {
        return `[搜索结果 ${index + 1}]
标题: ${result.title || '无标题'}
链接: ${result.url}
发布日期: ${result.publishedDate || '未知'}
${'-'.repeat(50)}`;
      }).join('\n\n');
      // console.log('[API CHAT DEBUG] Search results formatted.');
      
      // 第四步：LLM 整合结果
      const messagesWithSearchResults: Message[] = [
        { role: 'system', content: SYSTEM_PROMPT } as Message,
        ...messages,
        { 
          role: 'assistant', 
          content: `我需要搜索一些信息来回答你的问题。我搜索的查询是: "${searchQuery}"`
        } as Message,
        { 
          role: 'system', 
          content: `以下是关于"${searchQuery}"的搜索结果:\n\n${formattedSearchResults}\n\n请基于这些信息提供一个全面的回答。`
        } as Message
      ];
      // console.log('[API CHAT DEBUG] Messages for final LLM call:', messagesWithSearchResults);
      
      // 调用 LLM 进行最终分析
      // console.log('[API CHAT DEBUG] Calling final streamText...');
      const finalAnalysisResult = await streamText({
        model: deepseekProvider.chat('deepseek-chat'),
        messages: messagesWithSearchResults,
      });
      // console.log('[API CHAT DEBUG] Final streamText call completed.');
      
      // 返回最终分析结果
      // console.log('[API CHAT DEBUG] Returning finalAnalysisResult.toDataStreamResponse().');
      return finalAnalysisResult.toDataStreamResponse();
      
    } catch (searchError) {
      // console.error('[API CHAT DEBUG] Error during search process:', searchError);
      // console.log('[API CHAT DEBUG] Returning initialAnalysisResult.toDataStreamResponse() due to search error.');
      // 保留实际的错误处理逻辑，而不是调试日志
      console.error('[API CHAT] Search process error:', searchError);
      return initialAnalysisResult.toDataStreamResponse(); // Fallback to initial result
    }

  } catch (error) {
    // console.error('[API CHAT DEBUG] Outer catch block error:', error);
    // 保留实际的错误处理逻辑
    console.error('[API CHAT] POST request error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error from API', details: (error as Error).message }, { status: 500 });
  }
} 