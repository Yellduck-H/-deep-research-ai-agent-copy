import { CoreMessage, streamText } from 'ai';
import Exa from 'exa-js';
import { deepseek } from '@ai-sdk/deepseek'; // 假设 deepseek provider 这样导入

// 获取环境变量中的API密钥
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const exaApiKey = process.env.EXA_API_KEY;

// 基本系统提示词
const systemPrompt = `你是一个专业的研究助手，可以帮助用户深入分析研究主题、提出澄清性问题、生成最佳搜索查询，并整合信息编写研究报告。
当用户询问一个研究主题时，你应该：
1. 分析主题并确定研究范围
2. 如有必要，提出澄清性问题以便更好地理解用户需求
3. 如需要外部信息，使用 [SEARCH: 你的搜索查询] 格式明确指出
4. 根据已有知识提供初步分析

请保持专业、客观、有帮助的态度。`;

// 从LLM响应中提取搜索查询
function extractSearchQuery(content: string): string | null {
  const match = content.match(/\[SEARCH:\\s*(.*?)\]/);
  return match ? match[1].trim() : null;
}

// 使用新的 streamText API 进行非流式获取 (hacky way, by consuming the stream)
async function fetchLLMResponseNonStreaming(messages: CoreMessage[]): Promise<string> {
  const result = await streamText({
    model: deepseek('deepseek-chat'),
    messages,
    temperature: 0.7,
    maxTokens: 2000,
    // stream: false, // streamText 默认就是流式，没有 stream: false 选项
  });

  let content = '';
  for await (const part of result.textStream) {
    content += part;
  }
  
  if (content) {
    return content;
  } else {
    // 更详细的错误处理或日志记录会更好
    console.error("DeepSeek API (non-streaming via streamText) response error or empty content.");
    // 尝试从原始响应获取更多信息（如果可用）
    // const fullResponse = await result.response; // 这可能不存在或有不同结构
    // console.error("Full response object (if available):", fullResponse);
    throw new Error("Failed to get a valid non-streaming response from DeepSeek API using streamText.");
  }
}

export async function POST(req: Request) {
  // 确保API密钥已配置
  if (!deepseekApiKey) {
    return new Response("DeepSeek API密钥未配置", { status: 500 });
  }

  try {
    // 解析请求体
    const { messages } = await req.json();

    // 添加系统提示到消息列表
    const messagesWithSystemPrompt: CoreMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({ role: msg.role, content: msg.content })), // 确保消息格式正确
    ];

    // 步骤1: LLM初步分析 (非流式，用于提取搜索查询)
    const initialResponseContent = await fetchLLMResponseNonStreaming(messagesWithSystemPrompt);
    
    const searchQuery = extractSearchQuery(initialResponseContent);
    
    if (!searchQuery || !exaApiKey) {
      // 如果没有搜索查询或Exa key，直接以流式返回初步分析结果
      const result = await streamText({
        model: deepseek('deepseek-chat'),
        messages: messagesWithSystemPrompt,
        temperature: 0.7,
        maxTokens: 2000,
      });
      // if (!response.ok) { // streamText 不直接返回 response.ok
      //   const errorBody = await response.text();
      //   throw new Error(`DeepSeek API request failed: ${response.status} ${errorBody}`);
      // }
      // Vercel AI SDK 的 streamText 返回的结果可以直接转换为 Response
      return result.toDataStreamResponse();
    }
    
    // 步骤2: 调用搜索API
    const searchResults = await performSearch(searchQuery);
    
    // 步骤3: LLM整合搜索结果 (流式返回)
    const formattedSearchResults = formatSearchResults(searchResults, searchQuery);
    
    const messagesForFinalResponse: CoreMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({ role: msg.role, content: msg.content })), // 确保消息格式正确
      { 
        role: 'assistant', 
        content: `我已完成初步分析并提取到搜索查询: "${searchQuery}". 这是初步分析内容:\\n${initialResponseContent}\\n\\n现在，我将使用以下搜索结果来提供更全面的回答:\\n${formattedSearchResults}`
      },
    ];
    
    // 步骤4: LLM整合搜索结果 (流式返回)
    const finalResult = await streamText({
      model: deepseek('deepseek-chat'),
      messages: messagesForFinalResponse,
      temperature: 0.7,
      maxTokens: 2000,
    });

    // if (!finalStreamResponse.ok) { // streamText 不直接返回 response.ok
    //   const errorBody = await finalStreamResponse.text();
    //   throw new Error(`DeepSeek API request failed for final response: ${finalStreamResponse.status} ${errorBody}`);
    // }

    return finalResult.toDataStreamResponse();
  } catch (error) {
    console.error("API路由错误:", error);
    return new Response( error instanceof Error ? error.message : "处理请求时出错", { status: 500 });
  }
}

// 调用DeepSeek API获取LLM回应 (这个函数不再需要，因为 fetchLLMResponseNonStreaming 和 streamText 直接处理)
// async function fetchLLMResponse(messages: CoreMessage[]): Promise<string> {
//   const response = await fetch('https://api.deepseek.com/chat/completions', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${deepseekApiKey}`,
//     },
//     body: JSON.stringify({
//       model: 'deepseek-chat',
//       messages,
//       temperature: 0.7,
//       max_tokens: 2000,
//     }),
//   });

//   const data = await response.json();
//   if (data.choices && data.choices.length > 0 && data.choices[0].message) {
//     return data.choices[0].message.content;
//   } else {
//     // 处理可能的错误或意外的响应结构
//     console.error("DeepSeek API response error or unexpected structure:", data);
//     throw new Error("Failed to get a valid response from DeepSeek API.");
//   }
// }

// 执行搜索查询
async function performSearch(query: string) {
  // 初始化Exa客户端
  const exaClient = new Exa(exaApiKey!);

  // 调用Exa搜索API
  return await exaClient.search(query, {
    numResults: 3,
  });
}

// 格式化搜索结果
function formatSearchResults(searchResults: any, query: string): string {
  if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
    return `未找到关于"${query}"的搜索结果。`;
  }

  return searchResults.results.map((result: any, index: number) => {
    return `[搜索结果 ${index + 1}]
标题: ${result.title || '无标题'}
链接: ${result.url}
发布日期: ${result.publishedDate || '未知'}
${'-'.repeat(50)}`;
  }).join('\n\n');
} 