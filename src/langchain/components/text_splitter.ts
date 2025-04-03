import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from "@langchain/core/documents";

export async function splitTextDocuments(docs: Document[]) {
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    return await textSplitter.splitDocuments(docs);
}