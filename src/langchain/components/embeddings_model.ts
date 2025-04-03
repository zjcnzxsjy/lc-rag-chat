import { OllamaEmbeddings } from "@langchain/ollama";

export function initOllamaEmbeddings() {
  const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text", // Default value
    baseUrl: "http://127.0.0.1:11434/", // Default value
  });
  return embeddings;
}