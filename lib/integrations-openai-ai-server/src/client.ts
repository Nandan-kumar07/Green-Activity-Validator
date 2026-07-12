import OpenAI from "openai";
import { getOpenAIConfig } from "./env";

const { apiKey, baseURL } = getOpenAIConfig();

export const openai = new OpenAI({
  apiKey,
  baseURL,
});
