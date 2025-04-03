import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { Document } from "@langchain/core/documents";

const sbUrl = 'https://adzxefltxhqgkdfdcxll.supabase.co'
const sbApiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkenhlZmx0eGhxZ2tkZmRjeGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1ODM3NTEsImV4cCI6MjA1OTE1OTc1MX0.HUWoOSLoZuR5rRAUB7WKxIYlD7fUvo8Jwi3JpOSwdYg'

export function createSupabaseVectorStore(embeddings: EmbeddingsInterface) {
  try {
    const client = createClient(sbUrl, sbApiKey)
    
    return new SupabaseVectorStore(
      embeddings,
      {
        client,
        tableName: 'documents',
        queryName: 'match_documents',
      }
    )
  } catch (e) {
    console.log(e)
  }
}

export async function addDocumentsToSupabaseVectorStore(vectorStore: SupabaseVectorStore, docs: Document[], ids: string[] | number[]) {
  return await vectorStore.addDocuments(docs, { ids });
}

export async function deleteFromSupabaseVectorStore(vectorStore: SupabaseVectorStore, ids: string[] | number[]) {
  return await vectorStore.delete({ ids });
}
