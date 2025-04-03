import { Document } from "@langchain/core/documents";

export async function loadPureText(text: string, metadata: Record<string, unknown>) {
  const docs = [
    new Document({
        pageContent: text,
        metadata,
    }),
  ];
  return docs;
}