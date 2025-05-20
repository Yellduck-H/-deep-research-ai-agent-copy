# 阶段四：高级功能与研究流程增强

本文档将指导你为 Deep-Research-AI-Agent 项目添加更高级的功能，并优化研究流程的交互和展现。

## 任务 4.1：实现研究代理状态管理 (State Machine or Zustand Store)

**目标**：在前端或后端（或两者结合）管理研究代理的当前状态（例如：等待用户输入、LLM 思考中、等待搜索结果、正在生成报告等），以便更精细地控制 UI 和流程。

**LLM 提示词 (Zustand Store)**：
```
我需要在我的 Next.js 应用中引入客户端状态管理来跟踪复杂的研究流程。我选择使用 Zustand。
请指导我创建一个 Zustand store (`store/research-store.ts` 或类似路径)，用于管理以下状态：
- `currentStage`: 字符串类型，表示研究的当前阶段 (例如：`IDLE`, `THINKING`, `SEARCHING`, `SUMMARIZING`, `REPORT_READY`, `ERROR`)。
- `initialQuery`: 用户最初的研究主题。
- `followUpQuestions`: LLM 生成的后续问题列表 (字符串数组)。
- `searchResults`: 从 Exa API 获取的搜索结果列表 (对象数组，包含 title, url, snippet 等)。
- `reportContent`: LLM 生成的最终研究报告 (字符串，可能是 Markdown)。
- `errorMessage`: 发生的错误信息。

并提供更新这些状态的 action 函数。
```

**LLM 提示词 (集成 Store 到 Page/Components)**：
```
请指导我如何在 `app/page.tsx` 或相关子组件中集成并使用上面创建的 Zustand store。
例如，如何根据 `currentStage` 的值来显示不同的 UI 元素或提示信息 (例如，显示"正在搜索相关资料..."或"正在为您撰写报告...")。
以及如何在 `useChat` 的回调 (如 `onFinish` 或 `onResponse`) 中或在与其他 API (如 `/api/search`) 交互后，调用 store 的 action 来更新状态。
```

**测试**：
1.  **React DevTools/Zustand DevTools**：使用浏览器开发者工具检查 Zustand store 的状态变化。
    *   当开始一个新的研究时，`initialQuery` 是否被设置，`currentStage` 是否变为 `THINKING`？
    *   如果流程涉及到搜索，`currentStage` 是否会变为 `SEARCHING`，`searchResults` 是否被填充？
    *   最终 `reportContent` 是否被填充，`currentStage` 是否变为 `REPORT_READY`？
2.  **UI 反馈**：确认 UI 会根据 `currentStage` 的变化显示相应的提示信息或加载状态。
3.  **流程模拟**：在 `app/api/chat/route.ts` 中，可以暂时通过 `console.log` 和模拟的延迟来观察和触发前端状态的预期变化，即使后端逻辑尚未完全实现这些状态转换的精确触发。

## 任务 4.2：改进后端 API (`/api/chat`) 以支持多阶段研究流程

**目标**：重构 `app/api/chat/route.ts` 以支持更复杂的研究流程，包括生成澄清问题、执行搜索、总结内容并生成报告。这需要更精密的提示工程和 LLM 工具使用 (function calling)。

**LLM 提示词 (Function Calling/Tool Use)**：
```
请指导我大幅改进 `app/api/chat/route.ts` 中的 LLM 交互逻辑，使其能够执行一个多步骤的研究任务。我希望 LLM 能够：
1.  **理解初始查询**：接收用户的初始研究请求。
2.  **生成澄清问题 (可选)**：如果初始查询不够清晰，LLM 应能生成一些澄清问题让用户回答。
3.  **规划研究步骤/生成搜索查询**：基于用户的（澄清后的）查询，LLM 应规划研究步骤，并生成一个或多个精确的搜索查询字符串，准备交给 Exa API。
4.  **调用搜索工具 (Function Calling)**：使用 LLM 的 Function Calling 或 Tool Use 能力。定义一个名为 `perform_web_search` (或类似) 的工具，其参数是搜索查询字符串。当 LLM 决定需要搜索时，它应该调用这个工具。
5.  **处理搜索工具的调用**：在 API 路由中，捕获到 LLM 对 `perform_web_search` 工具的调用后：
    a.  执行实际的搜索 (调用 `/api/search` 或直接调用 Exa SDK)。
    b.  将搜索结果返回给 LLM，作为工具调用的结果。
6.  **总结与报告生成**：LLM 接收到搜索结果后，应能总结信息并生成一份结构化的研究报告的初稿。
7.  **迭代与细化 (可选)**：LLM 可能需要多轮搜索和总结来完善报告。

请重点说明如何设计系统提示 (System Prompt) 来引导 LLM 完成这个复杂流程，以及如何定义和处理 Function Calling/Tool Use。
所有 LLM 的中间思考过程和最终报告都应以流式响应返回给前端。
前端需要能够解析这些流中的结构化数据或特殊标记，以更新 Zustand store 中的 `followUpQuestions`, `searchResults`, `reportContent` 等。
```

**测试**：
1.  **Postman/curl 深入测试**：
    *   发送一个需要多步骤研究的查询到 `/api/chat`。
    *   观察流式响应：
        *   是否先收到了 LLM 的初步分析或澄清问题？
        *   (如果实现了工具调用) 是否能观察到 LLM 意图调用搜索工具的日志或标记？
        *   在模拟或真实搜索完成后，LLM 是否基于搜索结果继续生成内容？
        *   最终是否生成了类似报告的文本？
2.  **日志**：在 API 路由中大量使用 `console.log` 跟踪 LLM 的输入、输出、工具调用意图、工具调用参数、从搜索服务获取的结果以及传递给 LLM 的工具结果。
3.  **前端状态联动**：配合前端，观察 Zustand store 中的状态是否根据后端流返回的特定标记或数据片段得到正确更新 (例如，当 LLM 生成搜索查询时，前端 `searchResults` 状态应该在搜索完成后被填充)。
4.  **单元测试准备 (`tests/api/chat.test.ts`)**：
    *   模拟 LLM 返回需要调用工具的响应。
    *   验证 API 路由是否正确解析了工具调用请求，并（模拟）执行了工具。
    *   验证是否将工具执行结果正确地传回给 LLM。
    *   模拟 LLM 在接收工具结果后的最终响应。

## 任务 4.3：前端 UI 增强 - 展示搜索结果和研究报告

**目标**：在前端界面上，除了聊天流，还要有专门的区域或组件来美观地展示搜索结果和最终生成的研究报告。

**LLM 提示词 (搜索结果组件)**：
```
请指导我创建一个新的 React 组件 `components/search-results-display.tsx`。
这个组件：
1.  接收一个搜索结果数组作为 props (每个结果包含 title, url, snippet 等信息，对应 Zustand store 中的 `searchResults`)。
2.  如果结果为空，显示"未找到相关搜索结果"或类似的提示。
3.  将每个搜索结果以卡片或列表项的形式展示，清晰地显示标题、摘要和可点击的源链接 (链接应在新标签页打开)。
4.  使用 Shadcn UI 组件 (如 Card) 和 Tailwind CSS 进行样式设计。
```

**LLM 提示词 (研究报告组件)**：
```
请指导我创建一个新的 React 组件 `components/report-display.tsx`。
这个组件：
1.  接收研究报告内容 (Markdown 字符串，对应 Zustand store 中的 `reportContent`) 作为 prop。
2.  如果报告内容为空，显示"研究报告正在生成中..."或不显示任何内容。
3.  使用 `react-markdown` (配合 `remark-gfm` 和 `react-syntax-highlighter`) 来渲染报告内容。
4.  提供良好的排版和样式，使其易于阅读。
```

**LLM 提示词 (在主页集成新组件)**：
```
请指导我如何在 `app/page.tsx` 中集成 `SearchResultsDisplay` 和 `ReportDisplay` 组件。
1.  从 Zustand store 中获取 `searchResults` 和 `reportContent`。
2.  根据研究的不同阶段 (`currentStage` from store) 或数据显示的逻辑，条件性地渲染这些组件。
    *   例如，当 `currentStage` 是 `SEARCHING` 或 `SUMMARIZING` 且 `searchResults` 有数据时，显示 `SearchResultsDisplay`。
    *   当 `currentStage` 是 `REPORT_READY` 且 `reportContent` 有数据时，显示 `ReportDisplay`。
3.  这些组件可以显示在聊天消息流旁边，或者在一个专门的内容区域。
```

**测试**：
1.  运行开发服务器并与应用交互，尝试一个完整的研究流程。
2.  **搜索结果展示**：
    *   当后端 API (通过 LLM 的工具调用) 执行了搜索并将结果通过某种方式（例如流中的特定标记后跟JSON数据，或者通过Zustand action直接更新）传递给前端后，`SearchResultsDisplay` 组件是否正确显示了这些结果？
    *   链接是否可点击并在新标签页打开？
3.  **研究报告展示**：
    *   当 LLM 生成了最终报告，并且 `reportContent` 在 Zustand store 中更新后，`ReportDisplay` 组件是否正确渲染了 Markdown 格式的报告？
    *   代码块、列表、标题等是否按预期显示？
4.  **条件渲染**：确认这些组件只在适当的研究阶段和有数据时才显示。

## 任务 4.4：(可选) 实现用户反馈或迭代研究功能

**目标**：允许用户对生成的研究报告或研究过程中的某些步骤提供反馈，或者基于当前结果进行迭代提问。

**LLM 提示词**：
```
我希望在我的研究代理应用中加入用户反馈或迭代研究的功能。请提供一些思路和初步的实现指导：
1.  **反馈机制**：如何在研究报告下方添加简单的反馈按钮 (例如"报告有用 👍 / 报告需改进 👎")？点击这些按钮后，可以将反馈信息发送到后端 API (可以是一个新的 API 端点 `app/api/feedback/route.ts`，目前只需记录日志)。
2.  **迭代提问**：如何在当前研究结果（例如报告或搜索结果）的基础上，允许用户提出进一步的问题？这可能意味着将当前的报告/搜索结果作为上下文，附加到用户的下一个问题中，然后重新调用 `/api/chat`。
3.  如何在 UI 上组织这些交互元素？
```

**测试**：
1.  **反馈功能** (如果实现)：
    *   点击反馈按钮后，检查浏览器网络请求，确认有请求发送到 `/api/feedback` (或你选择的端点)。
    *   检查后端服务器日志，确认收到了反馈数据。
2.  **迭代提问功能** (如果实现)：
    *   在查看完一份报告或搜索结果后，尝试提出一个相关的后续问题。
    *   观察发送到 `/api/chat` 的新请求体，确认它是否包含了之前的上下文信息。
    *   AI 的回答是否考虑了之前的研究结果。

---

完成这些高级功能后，你的 Deep-Research-AI-Agent 将会更加强大和智能。 