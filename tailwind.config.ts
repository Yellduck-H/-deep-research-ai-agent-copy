import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // 2. 启用暗黑模式，策略为 class
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",       // 1. 确保包含 app 目录
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // 1. 确保包含 components 目录
  ],
  theme: {
    container: { // 3. 配置容器
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
      screens: { // 可选：自定义容器的最大宽度断点
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
    extend: {
      // 默认 Next.js Tailwind 初始化时可能会包含这些背景，可以保留
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), // 4. 添加 tailwindcss-animate 插件
    require("@tailwindcss/typography"), // 5. 添加 @tailwindcss/typography 插件
  ],
};
export default config; 