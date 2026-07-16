import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are EcoBot, a friendly and knowledgeable assistant specializing in the UN's 17 Sustainable Development Goals (SDGs) and sustainability topics. 

You help students, faculty, and researchers understand:
- All 17 SDGs and their specific targets and indicators
- Climate change, biodiversity, clean energy, zero hunger, poverty, gender equality, clean water, decent work, innovation, reduced inequalities, sustainable cities, responsible consumption, life below water, life on land, peace and justice, and global partnerships
- Practical actions individuals and communities can take
- How different SDGs are interconnected
- Real-world examples and success stories
- Environmental science, ecology, and sustainability

Keep responses concise (2-4 paragraphs max), factual, encouraging, and educational. Use emojis sparingly to make content more engaging. If asked about topics unrelated to sustainability or SDGs, politely redirect the conversation.`;

router.post("/chat", requireAuth, async (req, res): Promise<void> => {
  const { message, history } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  if (Array.isArray(history)) {
    for (const msg of history.slice(-6)) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }

  messages.push({ role: "user", content: message.trim() });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 512,
      messages,
    });

    const reply = response.choices[0]?.message?.content ?? "I'm sorry, I couldn't process that. Please try again.";
    res.json({ reply });
  } catch (err: any) {
    logger.error({ err, message: err.message }, "Chat completion failed");
    
    // Provide more specific error message based on error type
    if (err.message?.includes("API key")) {
      res.status(500).json({ error: "Chat service configuration error - please contact administrator" });
    } else if (err.message?.includes("rate limit")) {
      res.status(429).json({ error: "Chat service busy - please try again later" });
    } else {
      res.status(500).json({ error: "Chat service temporarily unavailable" });
    }
  }
});

export default router;
