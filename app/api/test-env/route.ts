export async function GET() {
  const envStatus = {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? '已配置' : '未配置',
    EXA_API_KEY: process.env.EXA_API_KEY ? '已配置' : '未配置',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? '已配置' : '未配置',
  };

  return new Response(JSON.stringify(envStatus, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
} 