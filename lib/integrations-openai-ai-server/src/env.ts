export function getOpenAIConfig(): { apiKey: string; baseURL: string } {
  const apiKey =
    process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const baseURL =
    process.env.OPENAI_BASE_URL ??
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ??
    "https://api.openai.com/v1";

  if (!apiKey || apiKey.includes("your-openai-api-key-here") || apiKey.includes("your-ope")) {
    console.warn("⚠️  OPENAI_API_KEY is not configured properly. AI features (chat, image verification) will not work.");
    console.warn("Please set a valid OpenAI API key in your .env file.");
    // Return a dummy config to prevent startup crash, but features will fail gracefully
    return { 
      apiKey: "dummy-key-for-development", 
      baseURL: "https://api.openai.com/v1" 
    };
  }

  return { apiKey, baseURL };
}
