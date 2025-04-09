#!/usr/bin/env node

import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { Document } from "@langchain/core/documents";
import { initOllamaChatModel } from "./components/chat_model.ts";
import { initOllamaEmbeddings } from "./components/embeddings_model.ts";
import {
  createStandalonePromptTemplate,
  createAnswerPromptTemplate,
} from "./components/prompt_template";
import { loadPureText } from "./components/doc_loader/text_loader";
import { splitTextDocuments } from "./components/text_splitter";
import SupabaseVectorStoreWrapper from "./components/vector_store/supabase";
import { combineDocuments } from "./utils/index";
import { DocMetaType } from "../types/index.ts";

class RagApplication {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain: RunnableSequence<any, string> | undefined
  vectorStore: SupabaseVectorStoreWrapper | undefined
  constructor() {
    this.init()
  }
  init = async () => {
    const llm = initOllamaChatModel();
    const embeddings = initOllamaEmbeddings();
    this.vectorStore = new SupabaseVectorStoreWrapper(embeddings);
    const instance = this.vectorStore.instance;
    const retriever = instance!.asRetriever();
    
    const standaloneQuestionChain = RunnableSequence.from([
      createStandalonePromptTemplate(),
      llm,
      new StringOutputParser(),
    ]);

    const retrieverChain = RunnableSequence.from([
      (prevResult) => prevResult.standalone_question,
      retriever,
      combineDocuments,
    ]);

    const answerChain = RunnableSequence.from([
      createAnswerPromptTemplate(),
      llm,
      new StringOutputParser(),
    ]);
    this.chain = await RunnableSequence.from([
      {
        standalone_question: standaloneQuestionChain,
        original_input: new RunnablePassthrough(),
      },
      {
        context: retrieverChain,
        question: ({ original_input }) => original_input.question,
      },
      answerChain,
    ]);
  }
  addText = async (text: string, meta: DocMetaType) => {
    const docs = await loadPureText(text, meta);
    const docsToAdd = await splitTextDocuments(docs);
    const { id } = meta;
    const ids = docsToAdd.map((_, i) => `${id}${i}`);
    if (this.vectorStore) {
      this.vectorStore.addDocuments(docsToAdd, ids);
    }
  }
  addDocs = async (docs: Document<Record<string, unknown>>[]) => {
    const docsToAdd = await splitTextDocuments(docs);
    const id = Date.now();
    const ids = docsToAdd.map((_, i) => `${id}${i}`);
    if (this.vectorStore) {
      this.vectorStore.addDocuments(docsToAdd, ids);
    }
  }
  query = async (question: string) => {
    if (this.chain) {
      const results = await this.chain.invoke({
        question,
      });
      return results;
    }
  }
  stream = async (question: string, onStream: (chunk: string) => void) => {
    if (this.chain) {
      let result = ''
      for await (const chunk of await this.chain.stream({
        question,
      })) {
        result += chunk
        onStream?.(result)
      }
    }
  }
}

export default RagApplication;
