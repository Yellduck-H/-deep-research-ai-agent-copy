# 阶段二：API 路由与 AI 服务集成

本文档指导你设置项目的后端 API 路由，并集成大型语言模型 (LLM) 和搜索服务。

## 任务 2.1：创建主 API 路由

**目标**：创建一个 Next.js API 路由 (Route Handler)，作为前端与后端 AI 逻辑交互的主要入口。

**LLM 提示词**：
```
请指导我如何在我的 Next.js 项目的 `app/api/` 目录下创建一个名为 `chat/route.ts` 的 API 路由文件。
这个 API 路由需要：
1.  能够处理 POST 请求。
2.  从请求体中接收消息列表 (messages) 和其他可能的参数 (例如研究主题 initialQuery)。
3.  (占位逻辑) 目前，它只需要简单地将接收到的消息构造成一个包含 "role": "assistant" 和 "content": "这是来自 API 的回复" 的新消息，并将其以流式响应 (streaming response) 的形式返回。
4.  使用 Vercel AI SDK 的 `StreamingTextResponse` 和 `OpenAIStream` (或相应的 OpenRouter/AI SDK 流处理工具) 来处理流式响应。
5.  确保正确设置了必要的环境变量（如 `OPENROUTER_API_KEY`）。虽然此阶段我们可能只是模拟响应，但要为后续集成做好准备。
```

**测试**：
1.  **Postman/curl 测试**：
    *   启动开发服务器 (`npm run dev`)。
    *   使用 Postman 或 curl 向 `http://localhost:3000/api/chat` 发送一个 POST 请求。
    *   请求体 (JSON)：
        ```json
        {
          "messages": [
            { "role": "user", "content": "你好" }
          ],
          "initialQuery": "测试查询"
        }
        ```
    *   期望响应：你应该能收到一个流式响应，其中包含 `data: {"role":"assistant","content":"这是来自 API 的回复"}` 这样的数据块。
2.  **单元测试准备**：
    *   考虑在后续创建一个 `tests/api/chat.test.ts` (或类似路径的) 文件，用于对此 API 路由进行单元测试。可以模拟请求和响应，验证 API 是否按预期处理输入并返回正确的流式结构（即使内容是模拟的）。

## 任务 2.2：集成 OpenRouter LLM 服务

**目标**：将真实的 LLM 调用集成到 API 路由中，以处理用户输入并生成回应。

**LLM 提示词**：
```
请指导我修改 `app/api/chat/route.ts` 文件，以集成 OpenRouter 来调用大型语言模型 (例如 Deepseek Coder, GPT-4o, 或 Gemini)。
修改要求：
1.  从环境变量中读取 `OPENROUTER_API_KEY`。
2.  使用 `@openrouter/ai-sdk-provider` (或 `ai` 库中的 OpenRouter 相关功能) 初始化 OpenRouter LLM 提供者。
3.  接收前端发送过来的消息列表。
4.  将这些消息和预设的系统提示 (system prompt) 一起发送给选定的 LLM 模型。
    *   系统提示应该指导 LLM 扮演一个研究助手，能够根据用户查询进行深入分析、提出澄清问题、生成搜索查询等。
5.  将 LLM 生成的响应通过流式方式返回给前端，使用 `StreamingTextResponse`。

请提供一个基础的系统提示示例，用于指导 LLM 进行初步的研究任务。
```

**测试**：
1.  **Postman/curl 测试**：
    *   确保你的 `.env.local` 文件中配置了有效的 `OPENROUTER_API_KEY`。
    *   重启开发服务器。
    *   使用 Postman 或 curl 再次向 `http://localhost:3000/api/chat` 发送 POST 请求，包含一个简单的研究性问题，例如：
        ```json
        {
          "messages": [
            { "role": "user", "content": "关于人工智能在医疗领域的最新进展，你能提供一些信息吗？" }
          ]
        }
        ```
    *   期望响应：你应该能收到来自 LLM 的、与你的问题相关的流式文本响应。
2.  **单元测试准备**：
    *   在 `tests/api/chat.test.ts` 中，可以模拟 OpenRouter SDK 的调用，测试在给定输入消息和系统提示时，是否正确构造了发送给 LLM 的请求，并能正确处理 LLM 的（模拟）流式响应。

## 任务 2.3：集成 Exa Search API (第一部分：API 路由)

**目标**：创建一个新的 API 路由，用于从 Exa API 获取搜索结果。

**LLM 提示词**：
```
请指导我创建一个新的 Next.js API 路由文件，路径为 `app/api/search/route.ts`。
这个 API 路由需要：
1.  能够处理 POST 请求。
2.  从请求体中接收一个搜索查询字符串 (query) 和其他可能的 Exa API 参数。
3.  从环境变量中读取 `EXA_API_KEY`。
4.  使用 `exa-js` SDK 初始化 Exa 客户端。
5.  调用 Exa API 的搜索或查找相似内容的功能，并将原始查询字符串传递给它。
6.  将 Exa API 返回的搜索结果 (通常是 JSON 格式的链接和摘要列表) 直接返回给前端。
```

**测试**：
1.  **Postman/curl 测试**：
    *   确保你的 `.env.local` 文件中配置了有效的 `EXA_API_KEY`。
    *   重启开发服务器。
    *   使用 Postman 或 curl 向 `http://localhost:3000/api/search` 发送一个 POST 请求，例如：
        ```json
        {
          "query": "latest advancements in quantum computing"
        }
        ```
    *   期望响应：你应该能收到一个 JSON 响应，其中包含来自 Exa API 的搜索结果列表 (链接、标题、摘要等)。如果 API 调用失败或没有结果，也应有相应的错误或空结果提示。
2.  **单元测试准备**：
    *   考虑创建 `tests/api/search.test.ts` 文件。可以模拟 `exa-js` SDK 的调用，测试在给定搜索查询时，API 路由是否正确构造了发送给 Exa API 的请求，并能正确处理和返回 Exa API 的（模拟）响应数据。

## 任务 2.4：在主 API 路由中编排 LLM 和搜索 (占位)

**目标**：修改主聊天 API 路由 (`app/api/chat/route.ts`) 的逻辑，使其能够根据 LLM 的判断，决定何时调用搜索 API，并将搜索结果提供给 LLM 进行后续分析和报告生成。这是一个复杂任务的初步框架。

**LLM 提示词**：
```
请指导我初步修改 `app/api/chat/route.ts` 文件，以实现一个基本的研究流程编排逻辑。现阶段，我们先搭建框架，具体实现细节后续完善：

1.  **LLM 初步分析**：首先，将用户的初始查询发送给 LLM (如任务 2.2)。
2.  **识别搜索需求 (占位)**：LLM 的响应中，我们期望它能识别出何时需要进行外部搜索，并可能生成一个或多个搜索查询。为了简化，假设 LLM 会在其响应中用一个特殊标记（例如 `[SEARCH: <query>]`）来指示需要搜索，并提供搜索词。
3.  **调用搜索 API (占位)**：如果 LLM 的响应中包含上述特殊标记：
    a.  从标记中提取搜索查询 `<query>`。
    b.  (占位逻辑) 模拟调用我们之前创建的 `/api/search` 接口 (或者直接在当前函数内模拟 Exa API 调用)，并获得模拟的搜索结果 (例如，一个包含几个假链接和摘要的数组)。
4.  **LLM 整合结果 (占位)**：将模拟的搜索结果追加到与 LLM 的对话历史中，并再次调用 LLM，要求它基于这些信息生成最终的、更全面的回答或研究报告的初步内容。
5.  所有 LLM 的回复都应以流式响应返回。

请重点描述如何在代码中组织这个流程，特别是如何处理和传递不同阶段的状态和数据。强调这只是一个初步的占位实现，后续步骤会细化 LLM 的提示工程和工具使用。
```

**测试**：
1.  **Postman/curl 测试**：
    *   重启开发服务器。
    *   设计一个 POST 请求到 `http://localhost:3000/api/chat`，其用户消息可能触发（你模拟的）搜索逻辑。例如，如果你的 LLM 模拟响应中包含 `[SEARCH: example query]`，你需要观察流程是否按预期执行。
    *   期望响应：一个流式响应。你需要检查这个响应是否包含了 LLM 初步分析的内容，以及（如果搜索被触发）基于模拟搜索结果的后续内容。由于搜索调用和 LLM 整合是占位的，重点是验证流程的条件分支和数据传递框架是否正确。
2.  **日志调试**：在此阶段，大量使用 `console.log` 来跟踪 API 路由内部的状态、LLM 的输入输出、是否触发搜索、模拟的搜索结果等，会非常有帮助。
3.  **单元测试准备**：
    *   `tests/api/chat.test.ts` 中的测试用例需要扩展，以覆盖这种包含条件性搜索调用的复杂场景。需要模拟 LLM 返回包含特殊搜索指令的响应，然后验证是否（模拟）调用了搜索，以及是否再次调用了 LLM 并传入了模拟的搜索结果。

---

完成此阶段后，你的应用将拥有核心的后端 AI 处理能力和外部信息检索的初步框架。 