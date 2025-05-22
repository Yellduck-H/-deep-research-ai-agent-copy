import { CoreMessage, streamText } from 'ai';
import Exa from 'exa-js';
import { deepseek } from '@ai-sdk/deepseek';

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
5. 当你收到搜索结果后，请整合这些信息，提供全面的回答，并在必要时引用来源

请保持专业、客观、有帮助的态度。在生成研究报告时，使用清晰的标题、小标题和列表来组织信息。`;

// 从LLM响应中提取搜索查询
function extractSearchQuery(content: string): string | null {
  const match = content.match(/\[SEARCH:\\s*(.*?)\]/);
  return match ? match[1].trim() : null;
}

// 使用新的 streamText API 进行非流式获取 (hacky way, by consuming the stream)
async function fetchLLMResponseNonStreaming(messages: CoreMessage[]): Promise<string> {
  try {
    const result = await streamText({
      model: deepseek('deepseek-chat'),
      messages,
      temperature: 0.7,
      maxTokens: 2000,
    });

    let content = '';
    for await (const part of result.textStream) {
      content += part;
    }
    
    if (content) {
      return content;
    } else {
      console.error("DeepSeek API响应为空");
      throw new Error("未能从DeepSeek API获取有效响应");
    }
  } catch (error) {
    console.error("非流式LLM响应获取错误:", error);
    throw new Error("获取LLM响应失败: " + (error instanceof Error ? error.message : "未知错误"));
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

    // 验证输入
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response("请提供有效的消息数组", { status: 400 });
    }

    // 添加系统提示到消息列表
    const messagesWithSystemPrompt: CoreMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({ 
        role: msg.role as 'user' | 'assistant' | 'system', 
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) 
      })),
    ];

    // 步骤1: LLM初步分析 (非流式，用于提取搜索查询)
    console.log("步骤1: 开始LLM初步分析...");
    const initialResponseContent = await fetchLLMResponseNonStreaming(messagesWithSystemPrompt);
    
    // 提取搜索查询
    const searchQuery = extractSearchQuery(initialResponseContent);
    console.log("提取的搜索查询:", searchQuery);
    
    // 如果没有搜索查询或Exa API密钥未配置，直接返回初步分析结果
    if (!searchQuery || !exaApiKey) {
      console.log("无搜索查询或Exa API密钥未配置，返回初步分析...");
      const result = await streamText({
        model: deepseek('deepseek-chat'),
        messages: messagesWithSystemPrompt,
        temperature: 0.7,
        maxTokens: 2000,
      });
      return result.toDataStreamResponse();
    }
    
    // 步骤2: 调用搜索API
    console.log("步骤2: 使用查询执行搜索:", searchQuery);
    let searchResults;
    try {
      searchResults = await performSearch(searchQuery);
      console.log("搜索完成，找到结果:", searchResults?.results?.length || 0);
    } catch (error) {
      console.error("搜索执行错误:", error);
      // 搜索失败时，仍返回LLM初步分析，并添加搜索失败说明
      const fallbackMessages: CoreMessage[] = [
        ...messagesWithSystemPrompt,
        { 
          role: 'assistant', 
          content: `${initialResponseContent}\n\n**注意：** 我无法获取关于"${searchQuery}"的在线搜索结果，以上分析仅基于我已有的知识。` 
        }
      ];
      
      const fallbackResult = await streamText({
        model: deepseek('deepseek-chat'),
        messages: fallbackMessages,
        temperature: 0.7,
        maxTokens: 2000,
      });
      return fallbackResult.toDataStreamResponse();
    }
    
    // 步骤3: 格式化搜索结果
    const formattedSearchResults = formatSearchResults(searchResults, searchQuery);
    
    // 步骤4: LLM整合搜索结果 (流式返回)
    console.log("步骤4: LLM整合搜索结果...");
    const messagesForFinalResponse: CoreMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({ 
        role: msg.role as 'user' | 'assistant' | 'system', 
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) 
      })),
      { 
        role: 'assistant', 
        content: initialResponseContent
      },
      {
        role: 'user',
        content: `我找到了以下关于"${searchQuery}"的最新信息，请基于这些信息和你之前的分析，提供一个全面的研究报告：\n\n${formattedSearchResults}`
      }
    ];
    
    const finalResult = await streamText({
      model: deepseek('deepseek-chat'),
      messages: messagesForFinalResponse,
      temperature: 0.7,
      maxTokens: 2000,
    });

    return finalResult.toDataStreamResponse();
  } catch (error) {
    console.error("API路由错误:", error);
    return new Response(error instanceof Error ? error.message : "处理请求时出错", { status: 500 });
  }
}

// 执行搜索查询
async function performSearch(query: string) {
  try {
    // 初始化Exa客户端
    const exaClient = new Exa(exaApiKey!);

    // 调用Exa搜索API
    return await exaClient.search(query, {
      numResults: 5,  // 返回5条结果
    });
  } catch (error) {
    console.error("执行搜索查询错误:", error);
    throw new Error("无法执行搜索: " + (error instanceof Error ? error.message : "未知错误"));
  }
}

// 格式化搜索结果
function formatSearchResults(searchResults: any, query: string): string {
  if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
    return `未找到关于"${query}"的搜索结果。`;
  }

  let formattedResults = `## 关于"${query}"的搜索结果\n\n`;
  
  searchResults.results.forEach((result: any, index: number) => {
    formattedResults += `### 来源 ${index + 1}: ${result.title || '无标题'}\n`;
    formattedResults += `- **链接**: ${result.url}\n`;
    if (result.publishedDate) {
      formattedResults += `- **发布日期**: ${result.publishedDate}\n`;
    }
    if (result.author) {
      formattedResults += `- **作者**: ${result.author}\n`;
    }
    formattedResults += `\n**摘要**: ${result.text || '无摘要信息'}\n\n`;
    
    // 添加高亮片段（如果有）
    if (result.highlights && result.highlights.length > 0) {
      formattedResults += `**关键信息**:\n`;
      result.highlights.forEach((highlight: string, hIndex: number) => {
        formattedResults += `- ${highlight.replace(/<\/?em>/g, '**')}\n`;
      });
    }
    
    formattedResults += `${'-'.repeat(50)}\n\n`;
  });

  return formattedResults;
} 