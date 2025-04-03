#!/usr/bin/env node

import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { initOllamaChatModel } from './components/chat_model.ts';
import { initOllamaEmbeddings } from './components/embeddings_model.ts';
import { createStandalonePromptTemplate, createAnswerPromptTemplate } from './components/prompt_template';
import { loadPureText } from './components/doc_loader/text_loader';
import { splitTextDocuments } from './components/text_splitter';
import { createSupabaseVectorStore, addDocumentsToSupabaseVectorStore } from './components/vector_store/supabase';
import { combineDocuments } from './utils/index';
import { DocMetaType } from "../types/index.ts";

export async function createRagApplication() {
    const llm = initOllamaChatModel();
    const embeddings = initOllamaEmbeddings();

    const vectorStore = createSupabaseVectorStore(embeddings);

    const retriever = vectorStore!.asRetriever();
    const standaloneQuestionChain = RunnableSequence.from([
        createStandalonePromptTemplate(),
        llm,
        new StringOutputParser(),
    ])

    const retrieverChain = RunnableSequence.from([
        prevResult => prevResult.standalone_question,
        retriever,
        combineDocuments,
    ]);

    const answerChain = RunnableSequence.from([
        createAnswerPromptTemplate(),
        llm,
        new StringOutputParser(),
    ]);

    const chain = await RunnableSequence.from([
        {
            standalone_question: standaloneQuestionChain,
            original_input: new RunnablePassthrough()
        },
        {
            context: retrieverChain,
            question: ({ original_input }) => original_input.question,
        },
        answerChain, 
    ]);

    /**
     *
     * @param {string} text
     * @param {{
     *   type: string; // 类型
     *   id: string | number; // 标识
     * }} meta
     */
    const addText = async (text: string, meta: DocMetaType) => {
        const docs = await loadPureText(text, meta);
        const docsToAdd = await splitTextDocuments(docs);
        const { id } = meta;
        const ids = docsToAdd.map((_, i) => `${id}${i}`);
        await addDocumentsToSupabaseVectorStore(vectorStore!, docsToAdd, ids);

    };

    const query = async (question: string) => {
        const results = await chain.invoke({
            question,
        })
        return results;
    };

    return {
      addText,
      query,
    };
}