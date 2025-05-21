import { Message } from 'ai';
import Exa from 'exa-js';

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
  const match = content.match(/\[SEARCH:\s*(.*?)\]/);
  return match ? match[1].trim() : null;
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
    const messagesWithSystemPrompt: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    // 步骤1: LLM初步分析
    const initialResponse = await fetchLLMResponse(messagesWithSystemPrompt);
    
    // 从初步分析中提取搜索查询
    const searchQuery = extractSearchQuery(initialResponse);
    
    // 如果没有提取到搜索查询，直接返回初步分析结果
    if (!searchQuery || !exaApiKey) {
      return new Response(
        JSON.stringify({ role: "assistant", content: initialResponse }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 步骤2: 调用搜索API
    const searchResults = await performSearch(searchQuery);
    
    // 步骤3: LLM整合搜索结果
    const formattedSearchResults = formatSearchResults(searchResults, searchQuery);
    
    // 创建包含搜索结果的新消息列表
    const messagesWithSearchResults: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
      { 
        role: 'assistant', 
        content: `我需要搜索一些信息来回答你的问题。我搜索的查询是: "${searchQuery}"`
      },
      { 
        role: 'system', 
        content: `以下是关于"${searchQuery}"的搜索结果:\n\n${formattedSearchResults}\n\n请基于这些信息提供一个全面的回答。`
      }
    ];
    
    // 获取最终结果
    const finalResponse = await fetchLLMResponse(messagesWithSearchResults);
    
    // 返回最终结果
    return new Response(
      JSON.stringify({ role: "assistant", content: finalResponse }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("API路由错误:", error);
    return new Response("处理请求时出错", { status: 500 });
  }
}

// 调用DeepSeek API获取LLM回应
async function fetchLLMResponse(messages: Message[]): Promise<string> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  if (data.choices && data.choices.length > 0 && data.choices[0].message) {
    return data.choices[0].message.content;
  } else {
    // 处理可能的错误或意外的响应结构
    console.error("DeepSeek API response error or unexpected structure:", data);
    throw new Error("Failed to get a valid response from DeepSeek API.");
  }
}

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