import { ChatOllama } from "@langchain/ollama";

export function initOllamaChatModel() {
  const llm = new ChatOllama({
    model: "qwen2.5:7b",
    temperature: 0,
    maxRetries: 2,
    streaming: true,
    baseUrl: 'http://127.0.0.1:11434/',
  });
  return llm;
}