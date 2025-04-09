import { Document } from "@langchain/core/documents";

export type DocMetaType = {
  type: string
  id: string
}

export interface IRagInstance {
  addText: (text: string, meta: DocMetaType) => Promise<void>
  query: (question: string) => Promise<string>
}

export type LoadDocsFunc = () => Promise<Document<Record<string, unknown>>[]>
