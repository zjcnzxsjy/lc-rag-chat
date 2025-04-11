#!/usr/bin/env node

import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { Document } from "@langchain/core/documents";
import { Annotation, LangGraphRunnableConfig, StateGraph } from "@langchain/langgraph/web";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graph: any
  constructor() {
    this.init()
  }
  init = async () => {
    const llm = initOllamaChatModel();
    const embeddings = initOllamaEmbeddings();
    this.vectorStore = new SupabaseVectorStoreWrapper(embeddings);
    // const instance = this.vectorStore.instance;
    // const retriever = instance!.asRetriever();
    
    // const standaloneQuestionChain = RunnableSequence.from([
    //   createStandalonePromptTemplate(),
    //   llm,
    //   new StringOutputParser(),
    // ]);

    // const retrieverChain = RunnableSequence.from([
    //   (prevResult) => prevResult.standalone_question,
    //   retriever,
    //   combineDocuments,
    // ]);

    // const answerChain = RunnableSequence.from([
    //   createAnswerPromptTemplate(),
    //   llm,
    //   new StringOutputParser(),
    // ]);
    // this.chain = await RunnableSequence.from([
    //   {
    //     standalone_question: standaloneQuestionChain,
    //     original_input: new RunnablePassthrough(),
    //   },
    //   {
    //     context: retrieverChain,
    //     question: ({ original_input }) => original_input.question,
    //   },
    //   answerChain,
    // ]);
    // const InputStateAnnotation = Annotation.Root({
    //   question: Annotation<string>
    // })
    const StateAnnotation = Annotation.Root({
      question: Annotation<string>,
      context: Annotation<Document[]>,
      answer: Annotation<string>,
    })

    const standaloneQuestion = async (state: typeof StateAnnotation.State) => {
      const prompt = createStandalonePromptTemplate()
      const messages = await prompt.invoke({
        question: state.question
      })
      console.log('messages', messages)
      const standaloneQuestion = await llm.invoke(messages)
      console.log('standaloneQuestion', standaloneQuestion)
      return { question: standaloneQuestion.content }
    }

    const retrieve = async (state: typeof StateAnnotation.State) => {
      const retrievedDocs = await this.vectorStore?.instance?.similaritySearch(state.question)
      console.log('retrievedDocs', retrievedDocs)
      return { context: retrievedDocs }
    }

    const generate = async (state: typeof StateAnnotation.State, config: LangGraphRunnableConfig) => {
      const docsContent = combineDocuments(state.context)
      const prompt = createAnswerPromptTemplate()
      const messages = await prompt.invoke({
        question: state.question,
        context: docsContent
      })
      console.log('messages', messages)
      // const response = await llm.invoke(messages)
      const chunks = []
      for await (const chunk of await llm.stream(messages)) {
        chunks.push(chunk.content)
        config.writer?.(chunk.content);
      }
      // console.log('response', response)
      return { answer: chunks.join('') }
    }

    this.graph = new StateGraph(StateAnnotation)
      .addNode('standaloneQuestion', standaloneQuestion)
      .addNode('retrieve', retrieve)
      .addNode('generate', generate)
      .addEdge("__start__", "standaloneQuestion")
      .addEdge('standaloneQuestion', 'retrieve')
      .addEdge('retrieve', 'generate')
      .addEdge("generate", "__end__")
      .compile()
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
    // if (this.chain) {
    //   const results = await this.chain.invoke({
    //     question,
    //   });
    //   return results;
    // }
    if (this.graph) {
      const results = await this.graph.invoke({
        question,
      });
      return results.answer;
    }
  }
  stream = async (question: string, onStream: (chunk: string) => void) => {
    if (this.graph) {
      let result = ''
      for await (const chunk of await this.graph.stream(
        {question},
        { streamMode: "custom" }
      )) {
        // console.log('event', chunk)
        // if (chunk.generate) {

        //   console.log(data.chunk.generate.answer);
        // }
        console.log('chunk', chunk)
        result += chunk
        onStream?.(result)
      }
    }
  }
}

export default RagApplication;
