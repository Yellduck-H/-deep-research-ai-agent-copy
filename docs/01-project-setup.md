# 阶段一：项目初始化与基本设置

本文档指导你完成 Deep-Research-AI-Agent 项目的初始化和基础配置。

## 任务 1.1：创建 Next.js 项目

**目标**：使用 Next.js (App Router 模式) 创建一个新的 TypeScript 项目。

**LLM 提示词**：
```
请为我生成一个命令，用于创建一个新的 Next.js 项目。项目要求如下：
1.  项目名称为 `deep-research-ai-agent-copy`。
2.  使用 TypeScript。
3.  启用 ESLint。
4.  使用 Tailwind CSS。
5.  使用 App Router 模式。
6.  不使用 `src/` 目录 (代码直接放在项目根目录下的 `app` 等文件夹中)。
7.  询问我是否需要自定义默认的导入别名。
```

**测试**：
1.  在项目根目录下，你应该能看到 `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `eslint.config.mjs` (或 `.eslintrc.json`) 和 `app` 目录等文件和文件夹。
2.  运行开发服务器：在项目根目录下打开终端，执行 `npm run dev` (或 `yarn dev` / `pnpm dev`)。
3.  在浏览器中打开 `http://localhost:3000`，你应该能看到 Next.js 的默认欢迎页面。

## 任务 1.2：安装项目核心依赖

**目标**：安装项目运行所需的核心依赖库。

**LLM 提示词**：
```
请为我生成一个命令，用于向现有的 Next.js 项目中添加以下npm依赖：

- `@ai-sdk/react`
- `@hookform/resolvers`
- `@openrouter/ai-sdk-provider`
- `@opentelemetry/api`
- `@radix-ui/react-accordion`
- `@radix-ui/react-collapsible`
- `@radix-ui/react-label`
- `@radix-ui/react-progress`
- `@radix-ui/react-radio-group`
- `@radix-ui/react-select`
- `@radix-ui/react-slot`
- `@radix-ui/react-tabs`
- `@radix-ui/react-tooltip`
- `ai`
- `class-variance-authority`
- `clsx`
- `date-fns`
- `exa-js`
- `lucide-react`
- `next-themes`
- `react-hook-form`
- `react-markdown`
- `react-syntax-highlighter`
- `remark-gfm`
- `sonner`
- `tailwind-merge`
- `tailwindcss-animate`
- `zod`
- `zustand`

同时，请为我生成一个命令，用于添加以下开发依赖：

- `@tailwindcss/typography`
- `@types/react-syntax-highlighter`
```

**测试**：
1.  检查 `package.json` 文件，确保 "dependencies" 和 "devDependencies" 部分包含了所有上述列出的库及其版本号。
2.  运行 `npm install` (或 `yarn install` / `pnpm install`) 确保所有依赖都能成功安装，没有报错。
3.  再次运行开发服务器 (`npm run dev`)，确保项目仍然可以正常启动。

## 任务 1.3：配置 Tailwind CSS

**目标**：配置 Tailwind CSS，使其能够与 Shadcn UI 和项目的其他部分协同工作。

**LLM 提示词**：
```
请指导我如何配置 Next.js 项目中的 `tailwind.config.ts` 文件。我需要进行以下配置：
1.  确保 `content` 数组包含 `./app/**/*.{js,ts,jsx,tsx,mdx}` 和 `./components/**/*.{js,ts,jsx,tsx,mdx}` 路径。
2.  启用暗黑模式，策略为 `class`。
3.  在 `theme.extend` 中配置容器（container）的居中、内边距等。
4.  添加 `tailwindcss-animate` 插件。
5.  添加 `@tailwindcss/typography` 插件。
```

**测试**：
1.  修改 `tailwind.config.ts` 文件后，重启开发服务器 (`npm run dev`)。
2.  尝试在 `app/layout.tsx` 或 `app/page.tsx` 中添加一些使用了 Tailwind CSS 类的 HTML 元素，例如 `<div class="container mx-auto p-4 bg-blue-500 text-white">Hello Tailwind</div>`。
3.  在浏览器中查看页面，确认 Tailwind CSS 的样式（如背景色、内边距、文字颜色、容器居中）是否生效。

## 任务 1.4：初始化 Shadcn UI

**目标**：在项目中集成 Shadcn UI，这是一个基于 Radix UI 和 Tailwind CSS 的组件集合。

**LLM 提示词**：
```
请为我生成一个命令，用于在我的 Next.js 项目中初始化 Shadcn UI。请告诉我初始化过程中需要注意的选择，例如：
- 选择哪个样式 (e.g., Default, New York)。
- 全局 CSS 文件路径 (e.g., `app/globals.css`)。
- Tailwind CSS 配置文件路径 (`tailwind.config.ts`)。
- 导入别名 (`@/*`)。
- 组件的存放路径 (e.g., `components`)。
- 是否使用 React Server Components (RSC)。
```

**LLM 提示词 (后续)**：
```
现在我需要使用 Shadcn UI CLI 添加一些基础组件。请为我生成命令，分别添加以下组件：
- button
- label
- input
- select
- radio-group
- accordion
- collapsible
- progress
- tooltip
- sonner (toast/notifications)
- tabs
```

**测试**：
1.  运行 Shadcn UI 初始化命令后，检查项目结构：
    *   `components/ui/` 目录下应该出现了 `button.tsx`, `label.tsx` 等组件文件。
    *   `lib/utils.ts` 文件应该被创建或更新，其中包含 `cn` 函数。
    *   `app/globals.css` 文件应该被更新，包含了 Shadcn UI 所需的 CSS 变量和基础样式。
    *   `tailwind.config.ts` 可能会被更新。
2.  运行 Shadcn UI 添加组件的命令后，确认 `components/ui/` 目录下包含了所有新添加的组件文件。
3.  尝试在 `app/page.tsx` 中导入并使用一个 Shadcn UI 组件，例如 `Button`。
    ```tsx
    // 这是一个示例，LLM 不需要生成这个
    import { Button } from "@/components/ui/button";

    export default function HomePage() {
      return (
        <div>
          <Button>Click me</Button>
        </div>
      );
    }
    ```
4.  运行开发服务器 (`npm run dev`) 并在浏览器中查看，确保按钮组件能够正确显示和交互。

## 任务 1.5：设置全局布局和主题

**目标**：创建基本的全局布局，并集成主题切换功能 (亮色/暗色模式)。

**LLM 提示词 (创建 ThemeProvider)**：
```
我需要在我的 Next.js 项目中实现亮色和暗色主题切换功能。
请指导我如何创建一个名为 `ThemeProvider` 的客户端组件 (`components/theme-provider.tsx`)。
这个组件应该使用 `next-themes` 库。
它应该包裹应用的子组件，并提供切换主题的能力。
```

**LLM 提示词 (更新根布局)**：
```
请指导我如何更新我的 Next.js 项目的根布局文件 `app/layout.tsx`。
我需要做以下修改：
1.  导入 `ThemeProvider` 组件。
2.  在 `<body>` 标签中包裹主要内容，并应用 `ThemeProvider`，设置其 `attribute="class"`, `defaultTheme="system"`, 和 `enableSystem`。
3.  确保 `<html>` 标签设置了 `lang="en"` 和 `suppressHydrationWarning`。
4.  在 `<body>` 标签应用 Tailwind CSS 的一些基础样式，例如背景色和字体。
5.  引入 `Inter` 字体 (如果 Next.js 默认没有配置的话)。
6.  引入全局 CSS 文件 `app/globals.css`。
```

**LLM 提示词 (创建 ThemeToggle 组件)**：
```
请指导我如何创建一个名为 `ThemeToggle` 的客户端组件 (`components/theme-toggle.tsx`)。
这个组件应该：
1.  使用 `next-themes` 的 `useTheme` hook。
2.  提供一个按钮，点击后可以在亮色和暗色主题之间切换。
3.  可以使用 `lucide-react` 的 `Sun` 和 `Moon` 图标来表示当前主题和切换目标。
4.  使用 Shadcn UI 的 `Button` 组件作为切换按钮的样式。
```

**测试**：
1.  在 `app/layout.tsx` 或 `app/page.tsx` 中引入并使用 `ThemeToggle` 组件。
2.  运行开发服务器 (`npm run dev`)。
3.  在浏览器中查看页面，应该能看到主题切换按钮。
4.  点击按钮，确认页面能够在亮色和暗色主题之间正确切换。检查 HTML 元素的 `class` 是否包含 `dark`。
5.  检查浏览器的开发者工具，确认 `<html>` 标签上 `class` 属性会根据主题变化 (例如，暗色模式下为 `dark`)。

**实际结果：**

用户提供的截图显示：
*   `ThemeToggle` 组件已正确显示在页面右上角。
*   点击按钮后，页面主题（背景色、文本颜色）在浅色和深色模式之间成功切换。
*   Shadcn Button 和 Tailwind 测试条块的颜色也随主题正确变化。

## 任务 1.6：配置环境变量

**目标**：设置项目所需的环境变量，特别是 API密钥。

**LLM 提示词**：
```
我需要在我的 Next.js 项目中配置环境变量。
请指导我创建一个 `.env.local` 文件，并在其中定义以下环境变量的占位符：
- `OPENROUTER_API_KEY`: 用于 OpenRouter LLM 服务的 API 密钥。
- `EXA_API_KEY`: 用于 Exa Search API 的 API 密钥。
- `OPENAI_API_KEY`: (如果需要直接使用 OpenAI) 用于 OpenAI API 的密钥。

请同时指导我创建一个 `.env.example` 文件，它应该包含这些环境变量的名称，但不包含实际的值，作为配置参考。
并且，请提醒我将 `.env.local` 文件添加到 `.gitignore` 文件中，以避免将敏感信息提交到版本控制。
```

**测试**：
1.  确认项目根目录下存在 `.env.local` 和 `.env.example` 文件。
2.  确认 `.env.example` 文件中只有变量名，没有实际值。
3.  确认 `.gitignore` 文件中包含了 `.env.local`。
4.  (可选) 可以在项目的某个服务端组件或 API 路由中尝试读取这些环境变量 (`process.env.YOUR_VARIABLE_NAME`) 并打印到控制台 (不要暴露到客户端)，以验证 Next.js 是否能正确加载它们。**注意：此时不需要实现真实的功能，仅测试环境变量的读取。**

---

完成以上所有任务后，你的项目基础框架就搭建完毕了。 